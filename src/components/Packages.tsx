"use client";

import { useEffect, useState } from "react";
import { formatKZT } from "@/lib/format";

type Package = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  hallType: string | null;
  isActive: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  hour: "Час",
  two_plus_one: "2+1",
  three_plus_two: "3+2",
  five_hours: "5 часов",
  morning: "Утро",
  day: "День",
  night: "Ночь",
  per_minute: "Поминутно",
};

const ICONS: Record<string, string> = {
  hour: "⏰",
  two_plus_one: "🎁",
  three_plus_two: "🎉",
  five_hours: "🔥",
  morning: "🌅",
  day: "☀️",
  night: "🌙",
  per_minute: "⏱️",
};

export function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [editing, setEditing] = useState<Package | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const r = await fetch("/api/packages");
    setPackages(await r.json());
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: number) => {
    if (!confirm("Удалить пакет?")) return;
    await fetch(`/api/packages/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Пакеты и тарифы</h1>
          <p className="text-sm text-[#737373] mt-1">Управление временными тарифами клуба</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Новый пакет
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {packages.map((p) => (
          <div
            key={p.id}
            className="surface rounded-2xl p-5 surface-hover relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#262626] grid place-items-center text-2xl">
                {ICONS[p.type] || "📦"}
              </div>
              {!p.isActive && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1a1a1a] border border-[#262626] text-[#737373] font-bold">
                  Неактивен
                </span>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">
              {TYPE_LABELS[p.type] || p.type}
            </div>
            <h3 className="text-xl font-black mt-0.5 text-white">{p.name}</h3>
            {p.description && (
              <p className="text-xs text-[#737373] mt-1 line-clamp-2">{p.description}</p>
            )}
            <div className="mt-4">
              <div className="text-3xl font-black text-[#f97316]">{formatKZT(p.price)}</div>
              <div className="text-xs text-[#525252] mt-0.5">
                {p.durationMinutes} мин • {p.hallType ? `${p.hallType}` : "Все залы"}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
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
        ))}
      </div>

      {(editing || creating) && (
        <PackageModal
          pkg={editing}
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

function PackageModal({ pkg, onClose }: { pkg: Package | null; onClose: () => void }) {
  const [name, setName] = useState(pkg?.name || "");
  const [type, setType] = useState(pkg?.type || "hour");
  const [description, setDescription] = useState(pkg?.description || "");
  const [durationMinutes, setDurationMinutes] = useState(pkg?.durationMinutes || 60);
  const [price, setPrice] = useState(pkg?.price || "");
  const [hallType, setHallType] = useState(pkg?.hallType || "");
  const [isActive, setIsActive] = useState(pkg?.isActive ?? true);
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
        type,
        description: description || null,
        durationMinutes,
        price,
        hallType: hallType || null,
        isActive,
      };
      const url = pkg ? `/api/packages/${pkg.id}` : "/api/packages";
      const method = pkg ? "PATCH" : "POST";
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
          {pkg ? "Редактировать пакет" : "Новый пакет"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-bare mt-1" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Тип</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-bare mt-1">
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Длит. (мин)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                className="input-bare mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Цена (₸)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-bare mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Описание</label>
            <input
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              className="input-bare mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Зал (опц.)</label>
            <select
              value={hallType}
              onChange={(e) => setHallType(e.target.value)}
              className="input-bare mt-1"
            >
              <option value="">Все залы</option>
              <option value="standart">Standart</option>
              <option value="room">Room</option>
              <option value="vip">Vip</option>
              <option value="bootcamp">Bootcamp</option>
              <option value="trio">Trio</option>
              <option value="solo">Solo</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-[#f97316]"
            />
            Активен
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
