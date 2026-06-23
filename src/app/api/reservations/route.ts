import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, computers, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db
      .select({
        reservation: reservations,
        computer: computers,
        user: users,
      })
      .from(reservations)
      .leftJoin(computers, eq(reservations.computerId, computers.id))
      .leftJoin(users, eq(reservations.userId, users.id))
      .orderBy(desc(reservations.startAt));
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { computerId, userId, startAt, endAt, notes } = body;
    if (!computerId || !userId || !startAt || !endAt) {
      return NextResponse.json(
        { error: "computerId, userId, startAt, endAt обязательны" },
        { status: 400 }
      );
    }
    const [created] = await db
      .insert(reservations)
      .values({
        computerId,
        userId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        notes: notes || null,
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
