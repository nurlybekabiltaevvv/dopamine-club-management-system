import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const amount = parseFloat(String(body.amount || 0));
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Сумма должна быть > 0" }, { status: 400 });
    }
    const [updated] = await db
      .update(users)
      .set({
        balance: sql`(${users.balance}::numeric + ${amount})`,
        bonusPoints: sql`(${users.bonusPoints} + ${Math.floor(amount / 100)})`,
      })
      .where(eq(users.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "Не найден" }, { status: 404 });

    await db.insert(transactions).values({
      userId: id,
      operatorId: body.operatorId || null,
      type: "topup",
      amount: String(amount),
      description: `Пополнение баланса на ${amount} ₸`,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
