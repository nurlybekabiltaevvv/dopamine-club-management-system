import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { packages } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db.select().from(packages).orderBy(asc(packages.id));
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(packages).values(body).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
