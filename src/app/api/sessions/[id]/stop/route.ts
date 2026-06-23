import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, computers, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { elapsedMinutes } from "@/lib/format";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const [s] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (!s) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    if (s.status === "finished") {
      return NextResponse.json({ error: "Сессия уже завершена" }, { status: 400 });
    }

    const totalPausedMinutes = s.pausedAt
      ? s.totalPausedMinutes +
        Math.max(0, Math.floor((Date.now() - new Date(s.pausedAt).getTime()) / 60000))
      : s.totalPausedMinutes;

    const minutes = elapsedMinutes(s.startAt, null, totalPausedMinutes);
    const hours = minutes / 60;
    const pricePerHour = parseFloat(s.pricePerHour);
    const computed = Math.ceil(hours * pricePerHour);
    const finalAmount = body.finalAmount !== undefined ? parseFloat(String(body.finalAmount)) : computed;

    const [updated] = await db
      .update(sessions)
      .set({
        status: "finished",
        endAt: new Date(),
        totalPausedMinutes,
        totalAmount: String(finalAmount),
      })
      .where(eq(sessions.id, id))
      .returning();

    // Mark computer as free
    await db
      .update(computers)
      .set({ status: "free" })
      .where(eq(computers.id, s.computerId));

    // Record transaction
    await db.insert(transactions).values({
      userId: s.userId,
      operatorId: s.operatorId,
      type: "session",
      amount: String(finalAmount),
      description: `Оплата сессии #${s.id.slice(0, 8)} (${minutes} мин.)`,
      referenceId: s.id,
    });

    return NextResponse.json({ session: updated, minutes, computedAmount: computed, finalAmount });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
