import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, computers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [s] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (!s) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    if (s.status !== "active") {
      return NextResponse.json({ error: "Только активная сессия может быть приостановлена" }, { status: 400 });
    }
    const [updated] = await db
      .update(sessions)
      .set({ status: "paused", pausedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    await db
      .update(computers)
      .set({ status: "reserved" })
      .where(eq(computers.id, s.computerId));
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
