"use client";

import { useEffect, useState } from "react";
import { formatKZT } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  category: "drink" | "snack" | "merch";
  price: string;
  cost: string;
  stock: number;
  sku: string | null;
  isActive: boolean;
};

const CATEGORIES = {
  drink: { label: "Напитки", icon: "🥤" },
  snack: { label: "Снеки", icon: "🍿" },
  merch: { label: "Мерч", icon: "👕" },
};

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const r = await fetch("/api/products");
    setProducts(await r.json());
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: number) => {
    if (!confirm("Удалить товар?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = products.filter((p) => category === "all" || p.category === category);

  const totalStockValue = products.reduce(
    (sum, p) => sum + parseFloat(p.cost) * p.stock,
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Товары и склад</h1>
          <p className="text-sm text-[#737373] mt-1">
            Напитки, снеки и мерч • остаток на складе: {formatKZT(totalStockValue)}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Новый товар
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <CategoryTab id="all" label="Все" icon="📦" active={category === "all"} onClick={() => setCategory("all")} />
        {Object.entries(CATEGORIES).map(([id, c]) => (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const cat = CATEGORIES[p.category];
          const low = p.stock < 10;
          return (
            <div key={p.id} className="surface rounded-2xl p-4 surface-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#1a1a1a] border border-[#262626] grid place-items-center text-xl">
                  {cat.icon}
                </div>
                <div
                  className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                    low
                      ? "bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30"
                      : "bg-[#1a1a1a] text-[#a3a3a3] border border-[#262626]"
                  }`}
                >
                  {p.stock} шт
                </div>
              </div>
              <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5em] text-white">{p.name}</h3>
              {p.sku && <div className="text-[10px] text-[#525252] font-mono mt-0.5">{p.sku}</div>}
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-xs text-[#737373]">Цена</div>
                  <div className="text-xl font-black text-white">{formatKZT(p.price)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#737373]">Себест.</div>
                  <div className="text-sm font-semibold text-[#a3a3a3]">{formatKZT(p.cost)}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setEditing(p)}
                  className="flex-1 py-1.5 rounded-md bg-[#1a1a1a] border border-[#262626] hover:bg-[#262626] text-xs font-semibold text-white"
                >
                  ✏️ Изм.
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="px-3 py-1.5 rounded-md bg-transparent border border-[#3a1a1a] hover:bg-[#1f0a0a] text-[#a3a3a3] text-xs font-semibold"
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(editing || creating) && (
        <ProductModal
          product={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryTab({ label, icon, active, onClick }: { id: string; label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
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

function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "drink");
  const [price, setPrice] = useState(product?.price || "");
  const [cost, setCost] = useState(product?.cost || "0");
  const [stock, setStock] = useState(product?.stock || 0);
  const [sku, setSku] = useState(product?.sku || "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name || !price) {
      setError("Заполните название и цену");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = {
        name,
        category,
        price,
        cost,
        stock,
        sku: sku || null,
        isActive,
      };
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json();
        setError(d.error || "Ошибка");
        return;
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f0f0f] border border-[#262626] rounded-2xl p-6 max-w-md w-full animate-slide-in"
      >
        <h2 className="text-xl font-black mb-4 text-white">
          {product ? "Редактировать товар" : "Новый товар"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-bare mt-1" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="input-bare mt-1"
            >
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.icon} {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Цена ₸</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-bare mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Себест. ₸</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="input-bare mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Остаток</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="input-bare mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">SKU</label>
            <input value={sku || ""} onChange={(e) => setSku(e.target.value)} className="input-bare mt-1" />
          </div>
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-[#f97316]"
            />
            В продаже
          </label>
          {error && (
            <div className="p-2.5 rounded-lg bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2 btn-ghost">
              Отмена
            </button>
            <button onClick={save} disabled={loading} className="btn-primary flex-1 py-2">
              {loading ? "..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
