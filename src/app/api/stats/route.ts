import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sales, saleItems, computers, products, users, transactions, halls } from "@/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Active sessions
    const activeSessions = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(eq(sessions.status, "active"));

    // Total computers
    const totalComputers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(computers);

    const busyComputers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(computers)
      .where(eq(computers.status, "busy"));

    // Revenue today (sessions + sales)
    const todaySessionRevenue = await db
      .select({ total: sql<string>`coalesce(sum(${sessions.totalAmount}::numeric), 0)` })
      .from(sessions)
      .where(
        and(
          gte(sessions.endAt, todayStart),
          eq(sessions.status, "finished")
        )
      );

    const todaySalesRevenue = await db
      .select({ total: sql<string>`coalesce(sum(${sales.totalAmount}::numeric), 0)` })
      .from(sales)
      .where(gte(sales.createdAt, todayStart));

    // Revenue month
    const monthSessionRevenue = await db
      .select({ total: sql<string>`coalesce(sum(${sessions.totalAmount}::numeric), 0)` })
      .from(sessions)
      .where(
        and(
          gte(sessions.endAt, monthStart),
          eq(sessions.status, "finished")
        )
      );
    const monthSalesRevenue = await db
      .select({ total: sql<string>`coalesce(sum(${sales.totalAmount}::numeric), 0)` })
      .from(sales)
      .where(gte(sales.createdAt, monthStart));

    // Hall occupancy
    const hallStats = await db
      .select({
        hallId: halls.id,
        hallName: halls.name,
        hallType: halls.type,
        total: sql<number>`count(${computers.id})::int`,
        busy: sql<number>`count(case when ${computers.status} = 'busy' then 1 end)::int`,
      })
      .from(halls)
      .leftJoin(computers, eq(computers.hallId, halls.id))
      .groupBy(halls.id, halls.name, halls.type)
      .orderBy(halls.id);

    // Top products
    const topProducts = await db
      .select({
        productId: saleItems.productId,
        productName: products.name,
        totalQty: sql<number>`sum(${saleItems.quantity})::int`,
        totalRevenue: sql<string>`sum(${saleItems.subtotal}::numeric)`,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .groupBy(saleItems.productId, products.name)
      .orderBy(desc(sql`sum(${saleItems.subtotal}::numeric)`))
      .limit(5);

    // Total users / clients
    const totalClients = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "client"));

    // Low stock
    const lowStock = await db
      .select()
      .from(products)
      .where(sql`${products.stock} < 10`)
      .limit(5);

    // Last 7 days revenue (sessions)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const dailyRevenue = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${sessions.endAt}), 'YYYY-MM-DD')`,
        total: sql<string>`coalesce(sum(${sessions.totalAmount}::numeric), 0)`,
      })
      .from(sessions)
      .where(
        and(
          gte(sessions.endAt, sevenDaysAgo),
          eq(sessions.status, "finished")
        )
      )
      .groupBy(sql`date_trunc('day', ${sessions.endAt})`)
      .orderBy(sql`date_trunc('day', ${sessions.endAt})`);

    return NextResponse.json({
      activeSessions: activeSessions[0]?.count || 0,
      totalComputers: totalComputers[0]?.count || 0,
      busyComputers: busyComputers[0]?.count || 0,
      freeComputers: (totalComputers[0]?.count || 0) - (busyComputers[0]?.count || 0),
      occupancyRate: totalComputers[0]?.count
        ? Math.round((busyComputers[0]?.count / totalComputers[0]?.count) * 100)
        : 0,
      todayRevenue:
        parseFloat(todaySessionRevenue[0]?.total || "0") +
        parseFloat(todaySalesRevenue[0]?.total || "0"),
      todaySessionRevenue: todaySessionRevenue[0]?.total || "0",
      todaySalesRevenue: todaySalesRevenue[0]?.total || "0",
      monthRevenue:
        parseFloat(monthSessionRevenue[0]?.total || "0") +
        parseFloat(monthSalesRevenue[0]?.total || "0"),
      monthSessionRevenue: monthSessionRevenue[0]?.total || "0",
      monthSalesRevenue: monthSalesRevenue[0]?.total || "0",
      hallStats,
      topProducts,
      totalClients: totalClients[0]?.count || 0,
      lowStock,
      dailyRevenue,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
