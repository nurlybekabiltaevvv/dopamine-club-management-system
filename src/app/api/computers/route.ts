import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { computers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db.select().from(computers).orderBy(asc(computers.position));
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(computers).values(body).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
