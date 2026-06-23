"use client";

import { useEffect, useState } from "react";
import { formatKZT, formatDateTime } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  category: "drink" | "snack" | "merch";
  price: string;
  stock: number;
};

type User = { id: string; username: string; fullName: string; balance: string };

type CartItem = { product: Product; quantity: number };

type Sale = {
  id: string;
  totalAmount: string;
  paymentMethod: string;
  createdAt: string;
  userId: string | null;
  items: { productName: string; quantity: number; subtotal: string; productCategory: string }[];
};

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  drink: { label: "Напитки", icon: "🥤" },
  snack: { label: "Снеки", icon: "🍿" },
  merch: { label: "Мерч", icon: "👕" },
};

export function Sales() {
  const [tab, setTab] = useState<"pos" | "history">("pos");
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [payment, setPayment] = useState<"cash" | "card" | "balance">("cash");
  const [category, setCategory] = useState<string>("all");
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const [p, u, s] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/sales?limit=20").then((r) => r.json()),
    ]);
    setProducts(p.filter((x: any) => x.isActive && x.stock > 0));
    setUsers(u.filter((x: any) => x.role === "client"));
    setSales(s);
  };

  useEffect(() => {
    load();
  }, []);

  const addToCart = (p: Product) => {
    setCart((c) => {
      const existing = c.find((i) => i.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) return c;
        return c.map((i) => (i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...c, { product: p, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((c) => c.filter((i) => i.product.id !== id));
  };

  const updateQty = (id: number, qty: number) => {
    if (qty < 1) {
      removeFromCart(id);
      return;
    }
    setCart((c) =>
      c.map((i) => (i.product.id === id ? { ...i, quantity: Math.min(qty, i.product.stock) } : i))
    );
  };

  const total = cart.reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setMessage("");
    try {
      const body = {
        userId: selectedUser || null,
        paymentMethod: payment,
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      };
      const r = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json();
        setMessage(d.error || "Ошибка");
        return;
      }
      setCart([]);
      setMessage("✅ Продажа оформлена");
      load();
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => category === "all" || p.category === category);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Продажи и POS</h1>
          <p className="text-sm text-[#737373] mt-1">Касса и история продаж</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab("pos")}
            className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${
              tab === "pos"
                ? "bg-[#f97316] text-[#0a0a0a] border-[#f97316]"
                : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#404040]"
            }`}
          >
            🛒 Касса
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${
              tab === "history"
                ? "bg-[#f97316] text-[#0a0a0a] border-[#f97316]"
                : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#404040]"
            }`}
          >
            📜 История
          </button>
        </div>
      </div>

      {tab === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              <CategoryTab id="all" label="Все" icon="🛍️" active={category === "all"} onClick={() => setCategory("all")} />
              {Object.entries(CATEGORY_META).map(([id, c]) => (
                <CategoryTab
                  key={id}
                  id={id}
                  label={c.label}
                  icon={c.icon}
                  active={category === id}
                  onClick={() => setCategory(id)}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((p) => {
                const meta = CATEGORY_META[p.category];
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className="surface rounded-xl p-3 text-left surface-hover disabled:opacity-40"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#262626] grid place-items-center text-lg">
                        {meta.icon}
                      </div>
                      <div className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#0a0a0a] border border-[#262626] font-bold text-[#a3a3a3]">
                        {p.stock}
                      </div>
                    </div>
                    <div className="text-xs font-semibold leading-tight line-clamp-2 min-h-[2em] text-white">
                      {p.name}
                    </div>
                    <div className="text-sm font-black text-[#f97316] mt-1">{formatKZT(p.price)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface rounded-2xl p-4 lg:sticky lg:top-4 self-start space-y-3 max-h-[80vh] flex flex-col">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="w-1 h-5 bg-[#f97316] rounded" />
              Корзина
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {cart.length === 0 ? (
                <div className="text-center text-[#525252] py-8 text-sm">Корзина пуста</div>
              ) : (
                cart.map((i) => (
                  <div key={i.product.id} className="p-2 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold leading-tight line-clamp-2 flex-1 text-white">
                        {i.product.name}
                      </div>
                      <button
                        onClick={() => removeFromCart(i.product.id)}
                        className="text-[#737373] hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(i.product.id, i.quantity - 1)}
                          className="w-6 h-6 rounded bg-[#1a1a1a] hover:bg-[#262626] text-sm font-bold text-white"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-white">{i.quantity}</span>
                        <button
                          onClick={() => updateQty(i.product.id, i.quantity + 1)}
                          className="w-6 h-6 rounded bg-[#1a1a1a] hover:bg-[#262626] text-sm font-bold text-white"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {formatKZT(parseFloat(i.product.price) * i.quantity)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[#262626] pt-3 space-y-2">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Клиент</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="input-bare mt-1 text-sm"
                >
                  <option value="">— Без клиента —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (баланс: {formatKZT(u.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Оплата</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {(["cash", "card", "balance"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPayment(m)}
                      className={`py-1.5 rounded-md text-xs font-bold border transition-colors ${
                        payment === m
                          ? "bg-[#f97316] text-[#0a0a0a] border-[#f97316]"
                          : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#404040]"
                      }`}
                    >
                      {m === "cash" ? "💵 Нал" : m === "card" ? "💳 Карта" : "💰 Баланс"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-[#737373]">Итого:</span>
                <span className="text-2xl font-black text-white">{formatKZT(total)}</span>
              </div>
              {message && (
                <div
                  className={`p-2 rounded-lg text-sm ${
                    message.startsWith("✅")
                      ? "bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316]"
                      : "bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316]"
                  }`}
                >
                  {message}
                </div>
              )}
              <button
                onClick={checkout}
                disabled={cart.length === 0 || loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "Оформление..." : `💳 Оплатить ${formatKZT(total)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {sales.length === 0 ? (
            <div className="surface rounded-2xl p-12 text-center text-[#525252]">Продаж ещё нет</div>
          ) : (
            sales.map((s) => (
              <div key={s.id} className="surface rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-sm font-bold text-white">Заказ #{s.id.slice(0, 8)}</div>
                    <div className="text-xs text-[#737373]">{formatDateTime(s.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-[#1a1a1a] border border-[#262626] text-[#a3a3a3]">
                      {s.paymentMethod === "cash" ? "Нал" : s.paymentMethod === "card" ? "Карта" : "Баланс"}
                    </span>
                    <div className="text-xl font-black text-white">{formatKZT(s.totalAmount)}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.items.map((it, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#262626] text-[#a3a3a3]"
                    >
                      {it.productName} ×{it.quantity}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CategoryTab({ label, icon, active, onClick }: { id: string; label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
        active
          ? "bg-[#f97316] text-[#0a0a0a] border-[#f97316]"
          : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#404040]"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
