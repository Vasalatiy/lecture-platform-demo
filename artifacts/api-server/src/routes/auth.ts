import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function getOrCreateUser(clerkId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];

  let email = "";
  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  } catch {
    email = `${clerkId}@unknown.com`;
  }

  const [user] = await db.insert(usersTable).values({ clerkId, email, role: "viewer" }).returning();
  return user;
}

router.get("/auth/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await getOrCreateUser(clerkId);
    res.json({
      id: String(user.id),
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get/create user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { getOrCreateUser };
export default router;
