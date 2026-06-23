"use client";

import { useEffect, useState } from "react";
import { formatKZT } from "@/lib/format";

type Stats = {
  activeSessions: number;
  totalComputers: number;
  busyComputers: number;
  freeComputers: number;
  occupancyRate: number;
  todayRevenue: number;
  todaySessionRevenue: string;
  todaySalesRevenue: string;
  monthRevenue: number;
  monthSessionRevenue: string;
  monthSalesRevenue: string;
  hallStats: {
    hallId: number;
    hallName: string;
    hallType: string;
    total: number;
    busy: number;
  }[];
  topProducts: { productName: string; totalQty: number; totalRevenue: string }[];
  totalClients: number;
  lowStock: { id: number; name: string; stock: number; category: string }[];
  dailyRevenue: { day: string; total: string }[];
};

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/stats");
      const data = await r.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid place-items-center h-64">
        <div className="text-[#737373] animate-pulse text-sm">Загрузка статистики...</div>
      </div>
    );
  }

  const maxDaily = Math.max(...stats.dailyRevenue.map((d) => parseFloat(d.total) || 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Дашборд</h1>
          <p className="text-sm text-[#737373] mt-1">Реальное время • автообновление каждые 5 сек.</p>
        </div>
        <button
          onClick={load}
          className="btn-ghost text-sm"
        >
          ↻ Обновить
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Активные сессии"
          value={stats.activeSessions.toString()}
          icon="⏱️"
        />
        <StatCard
          label="Загрузка зала"
          value={`${stats.occupancyRate}%`}
          icon="🖥️"
          sub={`${stats.busyComputers} / ${stats.totalComputers} ПК`}
        />
        <StatCard
          label="Выручка сегодня"
          value={formatKZT(stats.todayRevenue)}
          icon="💰"
        />
        <StatCard
          label="Выручка за месяц"
          value={formatKZT(stats.monthRevenue)}
          icon="📈"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 surface rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#f97316] rounded" />
            Загрузка залов
          </h2>
          <div className="space-y-3">
            {stats.hallStats.map((h) => {
              const rate = h.total ? Math.round((h.busy / h.total) * 100) : 0;
              return (
                <div key={h.hallId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{h.hallName}</span>
                      <span className="text-[10px] text-[#525252] uppercase tracking-wider">{h.hallType}</span>
                    </div>
                    <div className="text-xs text-[#a3a3a3]">
                      <span className="font-bold text-white">{h.busy}</span>
                      <span className="text-[#525252]"> / {h.total}</span>
                      <span className="ml-2 text-[#f97316] font-bold">{rate}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f97316] transition-all duration-500"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#f97316] rounded" />
            Топ товаров
          </h2>
          <div className="space-y-2">
            {stats.topProducts.length === 0 && (
              <p className="text-sm text-[#525252]">Пока нет продаж</p>
            )}
            {stats.topProducts.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f0f0f] border border-[#1f1f1f]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#262626] grid place-items-center font-black text-xs text-[#f97316] flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate text-white">{p.productName}</div>
                    <div className="text-[10px] text-[#525252]">×{p.totalQty} шт</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-white">{formatKZT(p.totalRevenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 surface rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#f97316] rounded" />
            Выручка за 7 дней
          </h2>
          <div className="flex items-end gap-2 h-44">
            {stats.dailyRevenue.length === 0 ? (
              <div className="flex-1 grid place-items-center text-[#525252] text-sm">
                Нет данных за последние 7 дней
              </div>
            ) : (
              stats.dailyRevenue.map((d) => {
                const v = parseFloat(d.total) || 0;
                const h = Math.max(8, (v / maxDaily) * 100);
                const date = new Date(d.day);
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="text-[10px] text-[#a3a3a3] opacity-0 group-hover:opacity-100 transition">
                      {formatKZT(v)}
                    </div>
                    <div
                      className="w-full bg-[#f97316] rounded-t hover:bg-[#fb923c] transition-colors cursor-pointer"
                      style={{ height: `${h}%` }}
                      title={formatKZT(v)}
                    />
                    <div className="text-[10px] text-[#525252]">
                      {date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface rounded-2xl p-5">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#f97316] rounded" />
              Клиенты
            </h2>
            <div className="text-3xl font-black text-white">{stats.totalClients}</div>
            <div className="text-xs text-[#525252] mt-1">Всего в базе</div>
          </div>

          <div className="surface rounded-2xl p-5">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#f97316] rounded" />
              Заканчивается
            </h2>
            <div className="space-y-2">
              {stats.lowStock.length === 0 ? (
                <p className="text-sm text-[#525252]">Всё в порядке</p>
              ) : (
                stats.lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-[#a3a3a3]">{p.name}</span>
                    <span
                      className={`font-bold ${
                        p.stock === 0 ? "text-[#f97316]" : "text-white"
                      }`}
                    >
                      {p.stock} шт
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: string;
  sub?: string;
}) {
  return (
    <div className="surface rounded-2xl p-5 surface-hover">
      <div className="flex items-start justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">{label}</div>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="text-2xl md:text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-[#525252] mt-1">{sub}</div>}
    </div>
  );
}
