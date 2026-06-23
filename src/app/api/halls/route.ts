import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { halls, computers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const allHalls = await db.select().from(halls).orderBy(asc(halls.id));
    const allComputers = await db
      .select()
      .from(computers)
      .orderBy(asc(computers.position));
    const result = allHalls.map((h) => ({
      ...h,
      computers: allComputers.filter((c) => c.hallId === h.id),
    }));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(halls).values(body).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
