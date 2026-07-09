import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(rootDir, "artifacts", "api-server");
const webDir = path.join(rootDir, "artifacts", "web");
const dbDir = path.join(rootDir, "lib", "db");
const apiEnvFile = path.join(apiDir, ".env.local");

const requiredApiVariables = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "PORT",
  "NODE_ENV",
  "STORAGE_DRIVER",
];

function parseEnvFile(contents) {
  const values = {};

  for (const [index, originalLine] of contents.split(/\r?\n/).entries()) {
    const line = originalLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      throw new Error(`Invalid environment assignment on line ${index + 1}.`);
    }

    let value = match[2].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value;
  }

  return values;
}

function loadApiEnvironment(requiredVariables) {
  if (!existsSync(apiEnvFile)) {
    throw new Error(
      "Missing artifacts/api-server/.env.local. Copy .env.example to .env.local and replace the placeholders.",
    );
  }

  const localValues = parseEnvFile(readFileSync(apiEnvFile, "utf8"));
  const missing = requiredVariables.filter(
    (name) => !localValues[name] && !process.env[name],
  );
  if (missing.length) {
    throw new Error(
      `Missing required variables in artifacts/api-server/.env.local: ${missing.join(", ")}`,
    );
  }

  return { ...process.env, ...localValues };
}

function validateStorageEnvironment(env) {
  const requiredByDriver = {
    local: ["LOCAL_STORAGE_DIR"],
    r2: [
      "R2_ACCOUNT_ID",
      "R2_BUCKET_NAME",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
    ],
    s3: [
      "S3_ENDPOINT",
      "S3_BUCKET_NAME",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
    ],
  };
  const required = requiredByDriver[env.STORAGE_DRIVER] ?? [];
  const missing = required.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(
      `Missing variables for STORAGE_DRIVER=${env.STORAGE_DRIVER}: ${missing.join(", ")}`,
    );
  }
}

function pnpmInvocation(args) {
  const pnpmScript = process.env.npm_execpath;
  if (pnpmScript && existsSync(pnpmScript)) {
    return [process.execPath, [pnpmScript, ...args]];
  }
  return [process.platform === "win32" ? "pnpm.cmd" : "pnpm", args];
}

function pipeWithLabel(stream, label, output) {
  let pending = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines) output.write(`[${label}] ${line}\n`);
  });
  stream.on("end", () => {
    if (pending) output.write(`[${label}] ${pending}\n`);
  });
}

function startPnpm(args, { cwd, env = process.env, label }) {
  const [command, commandArgs] = pnpmInvocation(args);
  const child = spawn(command, commandArgs, {
    cwd,
    env,
    stdio: ["inherit", "pipe", "pipe"],
    windowsHide: true,
  });
  pipeWithLabel(child.stdout, label, process.stdout);
  pipeWithLabel(child.stderr, label, process.stderr);
  return child;
}

function completion(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  if (process.platform === "win32") {
    const killer = spawn("taskkill.exe", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    await completion(killer).catch(() => {});
  } else {
    child.kill("SIGTERM");
  }
}

async function runToCompletion(args, options) {
  const result = await completion(startPnpm(args, options));
  if (result.code !== 0) {
    throw new Error(
      `${options.label} command failed${result.signal ? ` (${result.signal})` : ` with exit code ${result.code}`}.`,
    );
  }
}

async function runServers(children) {
  let stopping = false;
  const stopAll = async () => {
    if (stopping) return;
    stopping = true;
    await Promise.all(children.map(stopChild));
  };

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => {
      await stopAll();
      process.exit(0);
    });
  }

  const results = children.map((child) => completion(child));
  const first = await Promise.race(results);
  const failed = first.code !== 0;
  await stopAll();
  if (failed) process.exitCode = first.code ?? 1;
}

async function main() {
  const mode = process.argv[2] ?? "dev";

  if (mode === "web") {
    await runServers([
      startPnpm(["--filter", "@workspace/web", "dev"], {
        cwd: rootDir,
        label: "web",
      }),
    ]);
    return;
  }

  if (!["dev", "api", "db:push", "validate"].includes(mode)) {
    throw new Error(`Unknown local development mode: ${mode}`);
  }

  const required =
    mode === "db:push" ? ["DATABASE_URL"] : requiredApiVariables;
  const apiEnv = loadApiEnvironment(required);
  if (mode !== "db:push") validateStorageEnvironment(apiEnv);
  console.log("[local] Backend environment loaded and validated (values hidden).");

  if (mode === "validate") return;

  if (mode === "db:push") {
    await runToCompletion(["run", "push"], {
      cwd: dbDir,
      env: apiEnv,
      label: "db",
    });
    return;
  }

  await runToCompletion(["run", "build"], {
    cwd: apiDir,
    env: apiEnv,
    label: "api",
  });

  const children = [
    startPnpm(["run", "start"], { cwd: apiDir, env: apiEnv, label: "api" }),
  ];
  if (mode === "dev") {
    children.push(
      startPnpm(["run", "dev"], { cwd: webDir, label: "web" }),
    );
  }
  await runServers(children);
}

main().catch((error) => {
  console.error(`[local] ${error.message}`);
  process.exitCode = 1;
});
