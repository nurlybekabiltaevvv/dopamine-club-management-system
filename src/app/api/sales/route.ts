import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, products, transactions } from "@/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const allSales = await db
      .select()
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(limit);
    const saleIds = allSales.map((s) => s.id);
    let items: any[] = [];
    if (saleIds.length > 0) {
      const allItems = await db
        .select({
          id: saleItems.id,
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          subtotal: saleItems.subtotal,
          productName: products.name,
          productCategory: products.category,
        })
        .from(saleItems)
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(inArray(saleItems.saleId, saleIds));
      items = allItems;
    }
    const result = allSales.map((s) => ({
      ...s,
      items: items.filter((i) => i.saleId === s.id),
    }));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, operatorId, paymentMethod, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
    }

    // Verify stock and compute total
    const productIds = items.map((i: any) => i.productId);
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));
    const productMap = new Map(productRows.map((p) => [p.id, p]));

    let total = 0;
    const itemRows: any[] = [];
    for (const it of items) {
      const p = productMap.get(it.productId);
      if (!p) return NextResponse.json({ error: `Товар #${it.productId} не найден` }, { status: 400 });
      if (p.stock < it.quantity) {
        return NextResponse.json({ error: `Недостаточно товара: ${p.name}` }, { status: 400 });
      }
      const subtotal = parseFloat(p.price) * it.quantity;
      total += subtotal;
      itemRows.push({
        productId: p.id,
        quantity: it.quantity,
        unitPrice: p.price,
        subtotal: String(subtotal),
      });
    }

    const [sale] = await db
      .insert(sales)
      .values({
        userId: userId || null,
        operatorId: operatorId || null,
        totalAmount: String(total),
        paymentMethod: paymentMethod || "cash",
      })
      .returning();

    for (const it of itemRows) {
      await db.insert(saleItems).values({ ...it, saleId: sale.id });
      await db
        .update(products)
        .set({ stock: sql`${products.stock} - ${it.quantity}` })
        .where(eq(products.id, it.productId));
    }

    await db.insert(transactions).values({
      userId: userId || null,
      operatorId: operatorId || null,
      type: "product",
      amount: String(total),
      description: `Продажа товаров на сумму ${total} ₸`,
      referenceId: sale.id,
    });

    return NextResponse.json({ ...sale, items: itemRows }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
