"use client";

import { useEffect, useState } from "react";
import { formatKZT } from "@/lib/format";

type Stats = {
  todayRevenue: number;
  todaySessionRevenue: string;
  todaySalesRevenue: string;
  monthRevenue: number;
  monthSessionRevenue: string;
  monthSalesRevenue: string;
  activeSessions: number;
  totalComputers: number;
  busyComputers: number;
  occupancyRate: number;
  hallStats: {
    hallId: number;
    hallName: string;
    hallType: string;
    total: number;
    busy: number;
  }[];
  topProducts: { productName: string; totalQty: number; totalRevenue: string }[];
  totalClients: number;
  lowStock: { id: number; name: string; stock: number }[];
  dailyRevenue: { day: string; total: string }[];
};

export function Reports() {
  const [stats, setStats] = useState<Stats | null>(null);

  const load = async () => {
    const s = await fetch("/api/stats").then((r) => r.json());
    setStats(s);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, []);

  if (!stats) {
    return (
      <div className="grid place-items-center h-64">
        <div className="text-[#737373] animate-pulse text-sm">Загрузка отчётов...</div>
      </div>
    );
  }

  const maxDaily = Math.max(...stats.dailyRevenue.map((d) => parseFloat(d.total) || 0), 1);
  const totalDaily = stats.dailyRevenue.reduce((s, d) => s + parseFloat(d.total || "0"), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Отчёты и аналитика</h1>
        <p className="text-sm text-[#737373] mt-1">Финансовая сводка и бизнес-метрики</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BigStat
          label="Сегодня"
          value={formatKZT(stats.todayRevenue)}
          sub={`Сессии: ${formatKZT(stats.todaySessionRevenue)} • Товары: ${formatKZT(stats.todaySalesRevenue)}`}
        />
        <BigStat
          label="За месяц"
          value={formatKZT(stats.monthRevenue)}
          sub={`Сессии: ${formatKZT(stats.monthSessionRevenue)} • Товары: ${formatKZT(stats.monthSalesRevenue)}`}
        />
        <BigStat
          label="За неделю"
          value={formatKZT(totalDaily)}
          sub="По завершённым сессиям"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
            <span className="w-1 h-5 bg-[#f97316] rounded" />
            Динамика выручки
          </h2>
          <div className="space-y-2">
            {stats.dailyRevenue.length === 0 ? (
              <p className="text-sm text-[#525252]">Нет данных</p>
            ) : (
              stats.dailyRevenue.map((d) => {
                const v = parseFloat(d.total) || 0;
                const h = Math.max(8, (v / maxDaily) * 100);
                const date = new Date(d.day);
                return (
                  <div key={d.day} className="flex items-center gap-2">
                    <div className="w-20 text-xs text-[#737373]">
                      {date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                    </div>
                    <div className="flex-1 h-7 bg-[#0a0a0a] border border-[#1f1f1f] rounded relative overflow-hidden">
                      <div
                        className="h-full bg-[#f97316] flex items-center justify-end px-2 transition-all"
                        style={{ width: `${h}%` }}
                      >
                        {h > 25 && (
                          <span className="text-[10px] font-bold text-[#0a0a0a]">{formatKZT(v)}</span>
                        )}
                      </div>
                    </div>
                    {h <= 25 && (
                      <div className="w-24 text-xs text-right font-semibold text-white">{formatKZT(v)}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="surface rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
            <span className="w-1 h-5 bg-[#f97316] rounded" />
            Эффективность залов
          </h2>
          <div className="space-y-3">
            {stats.hallStats.map((h) => {
              const rate = h.total ? Math.round((h.busy / h.total) * 100) : 0;
              return (
                <div key={h.hallId} className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-semibold text-white">{h.hallName}</div>
                    <div className="text-sm">
                      <span className="font-black text-white">{h.busy}</span>
                      <span className="text-[#525252]">/{h.total}</span>
                      <span className="ml-2 text-[#f97316] font-bold">{rate}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f97316] transition-all"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#525252] mt-1 tracking-wider">
                    {h.hallType.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="surface rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <span className="w-1 h-5 bg-[#f97316] rounded" />
          Ключевые метрики
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Заполняемость" value={`${stats.occupancyRate}%`} icon="📊" />
          <Metric label="Активных сессий" value={stats.activeSessions} icon="⏱️" />
          <Metric label="Всего клиентов" value={stats.totalClients} icon="👥" />
          <Metric
            label="Средний чек (день)"
            value={formatKZT(
              stats.totalComputers > 0 ? stats.todayRevenue / Math.max(stats.totalComputers, 1) : 0
            )}
            icon="💰"
          />
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="surface rounded-2xl p-5 surface-hover">
      <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">{label}</div>
      <div className="text-3xl font-black mt-1 text-white">{value}</div>
      <div className="text-[10px] text-[#525252] mt-1">{sub}</div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f]">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] uppercase tracking-widest text-[#737373]">{label}</div>
        <div className="text-lg">{icon}</div>
      </div>
      <div className="text-xl font-black text-white">{value}</div>
    </div>
  );
}
