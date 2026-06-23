import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { packages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const [updated] = await db
      .update(packages)
      .set(body)
      .where(eq(packages.id, parseInt(id)))
      .returning();
    if (!updated) return NextResponse.json({ error: "Не найден" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(packages)
      .where(eq(packages.id, parseInt(id)))
      .returning();
    if (!deleted) return NextResponse.json({ error: "Не найден" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
