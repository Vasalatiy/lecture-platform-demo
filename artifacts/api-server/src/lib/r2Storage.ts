import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "node:path";
import { randomUUID } from "node:crypto";

const R2_VIDEO_PREFIX = "r2/videos/";
const SIGNED_UPLOAD_TTL_SECONDS = 15 * 60;
const SIGNED_READ_TTL_SECONDS = 60 * 60;
const SUPPORTED_VIDEO_TYPES = new Map([
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".mov", "video/quicktime"],
]);

type R2Config = {
  bucket: string;
  publicBaseUrl?: string;
  client: S3Client;
};

let cachedConfig: R2Config | undefined;

export function isR2StorageEnabled(): boolean {
  return process.env.STORAGE_DRIVER === "r2";
}

export function isR2ObjectPath(objectPath: string): boolean {
  return objectPath.startsWith(R2_VIDEO_PREFIX);
}

export async function createR2Upload(name: string, contentType: string) {
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

  const config = getR2Config();
  const objectPath = `${R2_VIDEO_PREFIX}${randomUUID()}${extension}`;
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

export async function getR2PlaybackUrl(objectPath: string): Promise<string> {
  if (!isR2ObjectPath(objectPath) || !isSafeObjectPath(objectPath)) {
    throw new Error("Invalid R2 video object path.");
  }

  const config = getR2Config();
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

function getR2Config(): R2Config {
  if (cachedConfig) return cachedConfig;

  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const bucket = requiredEnv("R2_BUCKET_NAME");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const endpoint = (
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`
  ).replace(/\/+$/, "");
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");

  cachedConfig = {
    bucket,
    publicBaseUrl,
    client: new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
  return cachedConfig;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required when STORAGE_DRIVER=r2.`);
  }
  return value;
}

function isSafeObjectPath(objectPath: string): boolean {
  return (
    !objectPath.includes("\\") &&
    !objectPath.split("/").some((segment) => !segment || segment === "." || segment === "..")
  );
}
