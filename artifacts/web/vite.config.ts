import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 5173;
const apiProxyTarget = process.env["API_PROXY_TARGET"] ?? "http://127.0.0.1:5000";

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(artifactDir, "src"),
    },
  },
  root: artifactDir,
  build: {
    outDir: path.resolve(artifactDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
