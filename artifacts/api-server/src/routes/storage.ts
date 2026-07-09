import express, { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { createReadStream } from "fs";
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { ObjectPermission } from "../lib/objectAcl";
import {
  createS3CompatibleUpload,
  isS3CompatibleStorageEnabled,
} from "../lib/s3CompatibleStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const LOCAL_VIDEO_PREFIX = "local/videos/";
const LOCAL_UPLOAD_TTL_MS = 15 * 60 * 1000;
const SUPPORTED_VIDEO_TYPES = new Map([
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".mov", "video/quicktime"],
]);

type PendingLocalUpload = {
  objectPath: string;
  filePath: string;
  contentType: string;
  expiresAt: number;
};

const pendingLocalUploads = new Map<string, PendingLocalUpload>();

async function requireAdmin(req: Request, res: Response, next: () => void) {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!users[0] || users[0].role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", requireAdmin, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    if (shouldUseLocalStorage()) {
      const upload = await createLocalUpload(name, contentType);
      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL: `/api/storage/uploads/local/${upload.uploadId}`,
          objectPath: upload.objectPath,
          metadata: { name, size, contentType },
        }),
      );
      return;
    }

    if (isS3CompatibleStorageEnabled()) {
      const upload = await createS3CompatibleUpload(name, contentType);
      res.json(
        RequestUploadUrlResponse.parse({
          ...upload,
          metadata: { name, size, contentType },
        }),
      );
      return;
    }

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

router.put(
  "/storage/uploads/local/:uploadId",
  express.raw({
    type: [...SUPPORTED_VIDEO_TYPES.values(), "application/octet-stream"],
    limit: "2gb",
  }),
  async (req: Request, res: Response) => {
    if (!shouldUseLocalStorage()) {
      res.status(404).json({ error: "Local storage is not enabled" });
      return;
    }

    purgeExpiredLocalUploads();

    const rawUploadId = req.params.uploadId;
    const uploadId = Array.isArray(rawUploadId) ? rawUploadId[0] : rawUploadId;
    const pending = pendingLocalUploads.get(uploadId);
    if (!pending) {
      res.status(404).json({ error: "Upload URL expired or not found" });
      return;
    }

    const body = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ error: "Upload body is empty" });
      return;
    }

    const requestType = req.header("content-type")?.split(";", 1)[0]?.toLowerCase();
    if (requestType && requestType !== pending.contentType) {
      res.status(415).json({ error: `Expected ${pending.contentType}, received ${requestType}` });
      return;
    }

    await mkdir(path.dirname(pending.filePath), { recursive: true });
    await writeFile(pending.filePath, body);
    pendingLocalUploads.delete(uploadId);
    res.status(204).send();
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    if (isLocalObjectPath(wildcardPath)) {
      await serveLocalVideo(wildcardPath, req, res);
      return;
    }

    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (uncomment when using replit-auth) ---
    // if (!req.isAuthenticated()) {
    //   res.status(401).json({ error: "Unauthorized" });
    //   return;
    // }
    // const canAccess = await objectStorageService.canAccessObjectEntity({
    //   userId: req.user.id,
    //   objectFile,
    //   requestedPermission: ObjectPermission.READ,
    // });
    // if (!canAccess) {
    //   res.status(403).json({ error: "Forbidden" });
    //   return;
    // }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;

function shouldUseLocalStorage(): boolean {
  if (process.env.STORAGE_DRIVER === "local") {
    return true;
  }

  if (process.env.STORAGE_DRIVER && process.env.STORAGE_DRIVER !== "replit") {
    return false;
  }

  return process.env.NODE_ENV === "development" && !process.env.PRIVATE_OBJECT_DIR;
}

function getLocalStorageRoot(): string {
  return path.resolve(process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), "uploads"));
}

function getLocalVideoDir(): string {
  return path.join(getLocalStorageRoot(), "videos");
}

function getVideoExtension(name: string, contentType: string): string {
  const ext = path.extname(name).toLowerCase();
  const expectedType = SUPPORTED_VIDEO_TYPES.get(ext);
  const normalizedType = contentType.toLowerCase();

  if (!expectedType) {
    throw new Error("Unsupported video file type. Use MP4, WebM, or MOV.");
  }

  if (normalizedType !== "application/octet-stream" && normalizedType !== expectedType) {
    throw new Error(`Unsupported content type ${contentType}. Use ${expectedType}.`);
  }

  return ext;
}

async function createLocalUpload(name: string, contentType: string) {
  purgeExpiredLocalUploads();

  const ext = getVideoExtension(name, contentType);
  const safeName = `${randomUUID()}${ext}`;
  const uploadId = randomUUID();
  const expectedContentType = SUPPORTED_VIDEO_TYPES.get(ext)!;
  const objectPath = `${LOCAL_VIDEO_PREFIX}${safeName}`;
  const filePath = path.join(getLocalVideoDir(), safeName);

  pendingLocalUploads.set(uploadId, {
    objectPath,
    filePath,
    contentType: expectedContentType,
    expiresAt: Date.now() + LOCAL_UPLOAD_TTL_MS,
  });

  return { uploadId, objectPath };
}

function purgeExpiredLocalUploads(): void {
  const now = Date.now();
  for (const [uploadId, pending] of pendingLocalUploads) {
    if (pending.expiresAt <= now) {
      pendingLocalUploads.delete(uploadId);
    }
  }
}

function isLocalObjectPath(objectPath: string): boolean {
  return objectPath.startsWith(LOCAL_VIDEO_PREFIX);
}

function resolveLocalVideoPath(objectPath: string): { filePath: string; contentType: string } {
  if (!isLocalObjectPath(objectPath)) {
    throw new ObjectNotFoundError();
  }

  const fileName = objectPath.slice(LOCAL_VIDEO_PREFIX.length);
  if (!/^[a-f0-9-]+\.(mp4|webm|mov)$/i.test(fileName)) {
    throw new ObjectNotFoundError();
  }

  const ext = path.extname(fileName).toLowerCase();
  const contentType = SUPPORTED_VIDEO_TYPES.get(ext);
  if (!contentType) {
    throw new ObjectNotFoundError();
  }

  return {
    filePath: path.join(getLocalVideoDir(), fileName),
    contentType,
  };
}

async function serveLocalVideo(objectPath: string, req: Request, res: Response): Promise<void> {
  const { filePath, contentType } = resolveLocalVideoPath(objectPath);
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    throw new ObjectNotFoundError();
  }

  const range = req.headers.range;
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "private, max-age=3600");

  if (!range) {
    res.setHeader("Content-Length", String(fileStat.size));
    createReadStream(filePath).pipe(res);
    return;
  }

  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) {
    res.status(416).setHeader("Content-Range", `bytes */${fileStat.size}`);
    res.end();
    return;
  }

  const requestedStart = match[1] ? Number(match[1]) : null;
  const requestedEnd = match[2] ? Number(match[2]) : null;
  const suffixLength = requestedStart === null && requestedEnd !== null ? requestedEnd : null;
  const start = suffixLength !== null ? Math.max(fileStat.size - suffixLength, 0) : requestedStart ?? 0;
  const end = suffixLength !== null ? fileStat.size - 1 : requestedEnd ?? fileStat.size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= fileStat.size || start < 0) {
    res.status(416).setHeader("Content-Range", `bytes */${fileStat.size}`);
    res.end();
    return;
  }

  res.status(206);
  res.setHeader("Content-Length", String(end - start + 1));
  res.setHeader("Content-Range", `bytes ${start}-${end}/${fileStat.size}`);
  createReadStream(filePath, { start, end }).pipe(res);
}
