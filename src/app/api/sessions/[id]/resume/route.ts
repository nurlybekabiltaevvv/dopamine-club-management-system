import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, computers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [s] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (!s) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    if (s.status !== "paused") {
      return NextResponse.json({ error: "Только приостановленная сессия может быть возобновлена" }, { status: 400 });
    }
    const pausedAt = s.pausedAt ? new Date(s.pausedAt) : new Date();
    const pauseMinutes = Math.max(
      0,
      Math.floor((Date.now() - pausedAt.getTime()) / 60000)
    );

    const [updated] = await db
      .update(sessions)
      .set({
        status: "active",
        pausedAt: null,
        totalPausedMinutes: sql`${sessions.totalPausedMinutes} + ${pauseMinutes}`,
      })
      .where(eq(sessions.id, id))
      .returning();
    await db
      .update(computers)
      .set({ status: "busy" })
      .where(eq(computers.id, s.computerId));
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
