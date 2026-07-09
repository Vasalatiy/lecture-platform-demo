import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "node:path";
import { randomUUID } from "node:crypto";

type StorageProvider = "r2" | "s3";

type S3CompatibleConfig = {
  bucket: string;
  objectPrefix: `${StorageProvider}/videos/`;
  publicBaseUrl?: string;
  client: S3Client;
};

const SIGNED_UPLOAD_TTL_SECONDS = 15 * 60;
const SIGNED_READ_TTL_SECONDS = 60 * 60;
const SUPPORTED_VIDEO_TYPES = new Map([
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".mov", "video/quicktime"],
]);

const configCache = new Map<StorageProvider, S3CompatibleConfig>();

export function isS3CompatibleStorageEnabled(): boolean {
  return process.env.STORAGE_DRIVER === "r2" || process.env.STORAGE_DRIVER === "s3";
}

export function isS3CompatibleObjectPath(objectPath: string): boolean {
  return objectPath.startsWith("r2/videos/") || objectPath.startsWith("s3/videos/");
}

export async function createS3CompatibleUpload(name: string, contentType: string) {
  const provider = getActiveProvider();
  const config = getProviderConfig(provider);
  const extension = path.extname(name).toLowerCase();
  const expectedContentType = SUPPORTED_VIDEO_TYPES.get(extension);
  const normalizedContentType = contentType.toLowerCase();

  if (!expectedContentType) {
    throw new Error("Unsupported video file type. Use MP4, WebM, or MOV.");
  }
  if (
    normalizedContentType !== "application/octet-stream" &&
    normalizedContentType !== expectedContentType
  ) {
    throw new Error(`Unsupported content type. Expected ${expectedContentType}.`);
  }

  const objectPath = `${config.objectPrefix}${randomUUID()}${extension}`;
  const uploadURL = await getSignedUrl(
    config.client,
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectPath,
      ContentType: expectedContentType,
    }),
    { expiresIn: SIGNED_UPLOAD_TTL_SECONDS },
  );

  return { uploadURL, objectPath };
}

export async function getS3CompatiblePlaybackUrl(objectPath: string): Promise<string> {
  if (!isS3CompatibleObjectPath(objectPath) || !isSafeObjectPath(objectPath)) {
    throw new Error("Invalid S3-compatible video object path.");
  }

  const provider: StorageProvider = objectPath.startsWith("r2/") ? "r2" : "s3";
  const config = getProviderConfig(provider);
  if (config.publicBaseUrl) {
    const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
    return `${config.publicBaseUrl}/${encodedPath}`;
  }

  return getSignedUrl(
    config.client,
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: objectPath,
    }),
    { expiresIn: SIGNED_READ_TTL_SECONDS },
  );
}

function getActiveProvider(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER;
  if (driver === "r2" || driver === "s3") return driver;
  throw new Error("S3-compatible storage is not enabled.");
}

function getProviderConfig(provider: StorageProvider): S3CompatibleConfig {
  const cached = configCache.get(provider);
  if (cached) return cached;

  const config = provider === "r2" ? createR2Config() : createGenericS3Config();
  configCache.set(provider, config);
  return config;
}

function createR2Config(): S3CompatibleConfig {
  const accountId = requiredEnv("R2_ACCOUNT_ID", "r2");
  return {
    bucket: requiredEnv("R2_BUCKET_NAME", "r2"),
    objectPrefix: "r2/videos/",
    publicBaseUrl: optionalUrl("R2_PUBLIC_BASE_URL"),
    client: new S3Client({
      region: "auto",
      endpoint: optionalUrl("R2_ENDPOINT") ??
        `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requiredEnv("R2_ACCESS_KEY_ID", "r2"),
        secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY", "r2"),
      },
    }),
  };
}

function createGenericS3Config(): S3CompatibleConfig {
  return {
    bucket: requiredEnv("S3_BUCKET_NAME", "s3"),
    objectPrefix: "s3/videos/",
    publicBaseUrl: optionalUrl("S3_PUBLIC_BASE_URL"),
    client: new S3Client({
      region: process.env.S3_REGION?.trim() || "ru-central1",
      endpoint: requiredUrl("S3_ENDPOINT", "s3"),
      forcePathStyle: optionalBoolean("S3_FORCE_PATH_STYLE", true),
      credentials: {
        accessKeyId: requiredEnv("S3_ACCESS_KEY_ID", "s3"),
        secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY", "s3"),
      },
    }),
  };
}

function requiredEnv(name: string, driver: StorageProvider): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required when STORAGE_DRIVER=${driver}.`);
  }
  return value;
}

function requiredUrl(name: string, driver: StorageProvider): string {
  return normalizeUrl(requiredEnv(name, driver), name);
}

function optionalUrl(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? normalizeUrl(value, name) : undefined;
}

function normalizeUrl(value: string, name: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${name} must use http or https.`);
  }
  return value.replace(/\/+$/, "");
}

function optionalBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return defaultValue;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(`${name} must be true or false.`);
}

function isSafeObjectPath(objectPath: string): boolean {
  return (
    !objectPath.includes("\\") &&
    !objectPath.split("/").some((segment) => !segment || segment === "." || segment === "..")
  );
}
