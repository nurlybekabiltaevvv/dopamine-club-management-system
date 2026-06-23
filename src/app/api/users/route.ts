import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, fullName, phone, email, role, balance, bonusPoints } = body;
    if (!username || !fullName) {
      return NextResponse.json(
        { error: "username и fullName обязательны" },
        { status: 400 }
      );
    }
    const [created] = await db
      .insert(users)
      .values({
        username,
        fullName,
        phone: phone || null,
        email: email || null,
        role: role || "client",
        balance: balance ? String(balance) : "0",
        bonusPoints: bonusPoints || 0,
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json({ error: "Пользователь с таким логином уже существует" }, { status: 400 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
