import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, computers, users, transactions } from "@/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where = status ? eq(sessions.status, status as any) : ne(sessions.status, "finished");
    const all = await db
      .select({
        session: sessions,
        computer: computers,
        user: users,
      })
      .from(sessions)
      .leftJoin(computers, eq(sessions.computerId, computers.id))
      .leftJoin(users, eq(sessions.userId, users.id))
      .where(where)
      .orderBy(desc(sessions.startAt));
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { computerId, userId, packageId, operatorId, pricePerHour, totalAmount, notes } = body;

    if (!computerId || !userId || !pricePerHour) {
      return NextResponse.json(
        { error: "computerId, userId, pricePerHour обязательны" },
        { status: 400 }
      );
    }

    // Check computer is free
    const [comp] = await db.select().from(computers).where(eq(computers.id, computerId));
    if (!comp) return NextResponse.json({ error: "Компьютер не найден" }, { status: 404 });
    if (comp.status === "busy") {
      return NextResponse.json({ error: "Компьютер уже занят" }, { status: 400 });
    }

    const [created] = await db
      .insert(sessions)
      .values({
        computerId,
        userId,
        packageId: packageId || null,
        operatorId: operatorId || null,
        status: "active",
        pricePerHour: String(pricePerHour),
        totalAmount: totalAmount ? String(totalAmount) : "0",
        notes: notes || null,
      })
      .returning();

    // Mark computer as busy
    await db.update(computers).set({ status: "busy" }).where(eq(computers.id, computerId));

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
