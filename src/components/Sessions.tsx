"use client";

import { useEffect, useState } from "react";
import { formatKZT, formatDateTime, elapsedMinutes } from "@/lib/format";

type SessionItem = {
  session: {
    id: string;
    computerId: number;
    userId: string;
    status: "active" | "paused" | "finished" | "cancelled";
    startAt: string;
    endAt: string | null;
    pausedAt: string | null;
    totalPausedMinutes: number;
    pricePerHour: string;
    totalAmount: string;
    packageId: number | null;
    notes: string | null;
  };
  computer: { id: number; name: string; hallId: number } | null;
  user: { id: string; fullName: string; username: string } | null;
};

export function Sessions() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "finished">("all");
  const [, setTick] = useState(0);

  const load = async () => {
    const r = await fetch("/api/sessions");
    const data = await r.json();
    setSessions(data);
  };

  useEffect(() => {
    load();
    const id = setInterval(() => {
      setTick((t) => t + 1);
      load();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const filtered = sessions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "active") return s.session.status === "active" || s.session.status === "paused";
    return s.session.status === filter;
  });

  const stopSession = async (id: string) => {
    if (!confirm("Завершить сессию?")) return;
    await fetch(`/api/sessions/${id}/stop`, { method: "POST" });
    load();
  };

  const totalActive = sessions
    .filter((s) => s.session.status === "active" || s.session.status === "paused")
    .reduce((sum, s) => {
      const tp = s.session.pausedAt
        ? s.session.totalPausedMinutes +
          Math.max(0, Math.floor((Date.now() - new Date(s.session.pausedAt).getTime()) / 60000))
        : s.session.totalPausedMinutes;
      const m = elapsedMinutes(s.session.startAt, null, tp);
      return sum + Math.ceil((m / 60) * parseFloat(s.session.pricePerHour));
    }, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Сессии</h1>
        <p className="text-sm text-[#737373] mt-1">Управление активными и архивными игровыми сессиями</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CounterCard
          label="Активные"
          value={sessions.filter((s) => s.session.status === "active").length}
        />
        <CounterCard
          label="На паузе"
          value={sessions.filter((s) => s.session.status === "paused").length}
        />
        <CounterCard
          label="Завершённые"
          value={sessions.filter((s) => s.session.status === "finished").length}
        />
        <CounterCard
          label="К оплате сейчас"
          value={formatKZT(totalActive)}
        />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(["all", "active", "paused", "finished"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${
              filter === f
                ? "bg-[#f97316] text-[#0a0a0a] border-[#f97316]"
                : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#404040]"
            }`}
          >
            {f === "all"
              ? "Все"
              : f === "active"
              ? "Активные и пауза"
              : f === "paused"
              ? "На паузе"
              : "Завершённые"}
          </button>
        ))}
      </div>

      <div className="surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">ПК</th>
                <th className="text-left p-3">Клиент</th>
                <th className="text-left p-3">Статус</th>
                <th className="text-left p-3">Начало</th>
                <th className="text-left p-3">Длительность</th>
                <th className="text-right p-3">Сумма</th>
                <th className="text-right p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#525252]">
                    Нет сессий
                  </td>
                </tr>
              )}
              {filtered.map((s) => {
                const tp = s.session.pausedAt
                  ? s.session.totalPausedMinutes +
                    Math.max(0, Math.floor((Date.now() - new Date(s.session.pausedAt).getTime()) / 60000))
                  : s.session.totalPausedMinutes;
                const m = elapsedMinutes(s.session.startAt, null, tp);
                const h = Math.floor(m / 60);
                const mm = m % 60;
                const cur =
                  s.session.status === "finished"
                    ? parseFloat(s.session.totalAmount)
                    : Math.ceil((m / 60) * parseFloat(s.session.pricePerHour));
                return (
                  <tr key={s.session.id} className="border-t border-[#1f1f1f] hover:bg-[#0f0f0f]">
                    <td className="p-3 font-mono text-xs text-[#737373]">#{s.session.id.slice(0, 8)}</td>
                    <td className="p-3 font-semibold text-white">{s.computer?.name}</td>
                    <td className="p-3 text-[#a3a3a3]">{s.user?.fullName || "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={s.session.status} />
                    </td>
                    <td className="p-3 text-xs text-[#737373]">{formatDateTime(s.session.startAt)}</td>
                    <td className="p-3 font-mono text-sm text-white">
                      {String(h).padStart(2, "0")}:{String(mm).padStart(2, "0")}
                    </td>
                    <td className="p-3 text-right font-bold text-white">{formatKZT(cur)}</td>
                    <td className="p-3 text-right">
                      {(s.session.status === "active" || s.session.status === "paused") && (
                        <button
                          onClick={() => stopSession(s.session.id)}
                          className="px-2.5 py-1 rounded-md bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] text-xs font-semibold hover:bg-[#f97316]/20"
                        >
                          ⏹ Стоп
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CounterCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="surface rounded-xl p-4 surface-hover">
      <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">{label}</div>
      <div className="text-2xl font-black mt-1 text-white">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; l: string }> = {
    active: { c: "bg-[#f97316]/15 text-[#f97316] border-[#f97316]/30", l: "Активна" },
    paused: { c: "bg-[#262626] text-white border-[#404040]", l: "Пауза" },
    finished: { c: "bg-[#0a0a0a] text-[#a3a3a3] border-[#262626]", l: "Завершена" },
    cancelled: { c: "bg-[#1a1a1a] text-[#737373] border-[#262626]", l: "Отменена" },
  };
  const s = map[status] || map.finished;
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${s.c}`}>
      {s.l}
    </span>
  );
}
