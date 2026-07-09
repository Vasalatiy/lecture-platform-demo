import { Router, type Request } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, videosTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";
import { getOrCreateUser } from "./auth";
import {
  getS3CompatiblePlaybackUrl,
  isS3CompatibleObjectPath,
} from "../lib/s3CompatibleStorage";

const router = Router();
const storage = new ObjectStorageService();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

async function requireAdmin(req: any, res: any, next: any) {
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
  req.currentUser = users[0];
  next();
}

function videoToJson(v: any, uploaderEmail?: string) {
  return {
    id: String(v.id),
    title: v.title,
    description: v.description ?? "",
    lecturer: v.lecturer,
    category: v.category,
    videoUrl: v.videoUrl,
    status: v.status,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
    updatedAt: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : v.updatedAt,
    uploadedBy: uploaderEmail ?? "",
  };
}

router.get("/videos/stats", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const [totals] = await db.select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where status = 'published')::int`,
      draft: sql<number>`count(*) filter (where status = 'draft')::int`,
    }).from(videosTable);

    const cats = await db.select({ category: videosTable.category }).from(videosTable).groupBy(videosTable.category);

    res.json({
      total: totals.total,
      published: totals.published,
      draft: totals.draft,
      categories: cats.map((c) => c.category),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/videos", requireAuth, async (req, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkId = auth?.userId!;
    const user = await getOrCreateUser(clerkId);

    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;

    let query = db.select().from(videosTable);
    const conditions = [];

    if (user.role !== "admin") {
      conditions.push(eq(videosTable.status, "published"));
    }
    if (search) {
      conditions.push(ilike(videosTable.title, `%${search}%`));
    }
    if (category) {
      conditions.push(eq(videosTable.category, category));
    }

    const videos = conditions.length
      ? await query.where(and(...conditions)).orderBy(sql`${videosTable.createdAt} desc`)
      : await query.orderBy(sql`${videosTable.createdAt} desc`);

    res.json(videos.map((v) => videoToJson(v)));
  } catch (err) {
    req.log.error({ err }, "Failed to list videos");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/videos", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { title, description, lecturer, category, videoUrl, status } = req.body;
    if (!title || !lecturer || !category) {
      res.status(400).json({ error: "title, lecturer, category are required" });
      return;
    }

    const [video] = await db.insert(videosTable).values({
      title,
      description: description ?? "",
      lecturer,
      category,
      videoUrl: videoUrl ?? "",
      status: status ?? "draft",
      uploadedBy: (req as any).currentUser?.id,
    }).returning();

    res.status(201).json(videoToJson(video));
  } catch (err) {
    req.log.error({ err }, "Failed to create video");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/videos/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(404).json({ error: "Not found" }); return; }

    const auth = getAuth(req);
    const clerkId = auth?.userId!;
    const user = await getOrCreateUser(clerkId);

    const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);
    if (!video) { res.status(404).json({ error: "Not found" }); return; }
    if (user.role !== "admin" && video.status !== "published") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(videoToJson(video));
  } catch (err) {
    req.log.error({ err }, "Failed to get video");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/videos/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(404).json({ error: "Not found" }); return; }

    const { title, description, lecturer, category, videoUrl, status } = req.body;
    const [video] = await db.update(videosTable).set({
      title, description, lecturer, category, videoUrl, status,
    }).where(eq(videosTable.id, id)).returning();

    if (!video) { res.status(404).json({ error: "Not found" }); return; }
    res.json(videoToJson(video));
  } catch (err) {
    req.log.error({ err }, "Failed to update video");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/videos/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(404).json({ error: "Not found" }); return; }

    await db.delete(videosTable).where(eq(videosTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete video");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/videos/:id/status", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(404).json({ error: "Not found" }); return; }

    const { status } = req.body;
    if (!["draft", "published"].includes(status)) {
      res.status(400).json({ error: "status must be draft or published" });
      return;
    }

    const [video] = await db.update(videosTable).set({ status }).where(eq(videosTable.id, id)).returning();
    if (!video) { res.status(404).json({ error: "Not found" }); return; }
    res.json(videoToJson(video));
  } catch (err) {
    req.log.error({ err }, "Failed to update video status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/videos/:id/stream-url", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(404).json({ error: "Not found" }); return; }

    const auth = getAuth(req);
    const clerkId = auth?.userId!;
    const user = await getOrCreateUser(clerkId);

    const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);
    if (!video) { res.status(404).json({ error: "Not found" }); return; }
    if (user.role !== "admin" && video.status !== "published") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const objectPath = video.videoUrl;
    if (!objectPath) {
      res.status(409).json({ error: "Video file is not configured for this lecture" });
      return;
    }

    if (isS3CompatibleObjectPath(objectPath)) {
      res.json({ url: await getS3CompatiblePlaybackUrl(objectPath) });
      return;
    }

    const streamBase = process.env["REPLIT_DEV_DOMAIN"]
      ? `https://${process.env["REPLIT_DEV_DOMAIN"]}`
      : "";

    const url = `${streamBase}/api/storage/objects/${objectPath.replace(/^\/objects\//, "")}`;
    res.json({ url });
  } catch (err) {
    req.log.error({ err }, "Failed to get stream url");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
