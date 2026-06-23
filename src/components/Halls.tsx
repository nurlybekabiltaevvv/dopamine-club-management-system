"use client";

import { useEffect, useState } from "react";
import { formatKZT, formatTime, elapsedMinutes } from "@/lib/format";

type Computer = {
  id: number;
  name: string;
  hallId: number;
  status: "free" | "busy" | "reserved" | "maintenance" | "offline";
  specs: string | null;
  hourlyRate: string | null;
  position: number;
  isActive: boolean;
};

type Hall = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  hourlyRate: string;
  capacity: number;
  isActive: boolean;
  computers: Computer[];
};

type ActiveSession = {
  session: {
    id: string;
    computerId: number;
    userId: string;
    status: "active" | "paused" | "finished" | "cancelled";
    startAt: string;
    pausedAt: string | null;
    totalPausedMinutes: number;
    pricePerHour: string;
    totalAmount: string;
  };
  computer: Computer | null;
  user: { id: string; fullName: string; username: string } | null;
};

type User = { id: string; username: string; fullName: string; role: string };

const STATUS_STYLES: Record<
  string,
  { bg: string; border: string; text: string; dot: string; label: string; ring?: string }
> = {
  free: {
    bg: "bg-[#0f0f0f]",
    border: "border-[#262626] hover:border-[#f97316]/50",
    text: "text-[#a3a3a3]",
    dot: "bg-[#f97316]",
    label: "Свободен",
  },
  busy: {
    bg: "bg-[#f97316]/10",
    border: "border-[#f97316]/50",
    text: "text-[#f97316]",
    dot: "bg-[#f97316]",
    label: "Занят",
    ring: "ring-1 ring-[#f97316]/30",
  },
  reserved: {
    bg: "bg-[#1a1a1a]",
    border: "border-[#525252]",
    text: "text-white",
    dot: "bg-white",
    label: "Пауза",
  },
  maintenance: {
    bg: "bg-[#1a1a1a]",
    border: "border-[#404040]",
    text: "text-[#a3a3a3]",
    dot: "bg-[#737373]",
    label: "Обслуж.",
  },
  offline: {
    bg: "bg-[#0a0a0a]",
    border: "border-[#1f1f1f]",
    text: "text-[#525252]",
    dot: "bg-[#404040]",
    label: "Офлайн",
  },
};

export function Halls() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedHall, setSelectedHall] = useState<number | null>(null);
  const [bookingComp, setBookingComp] = useState<Computer | null>(null);
  const [, setTick] = useState(0);

  const load = async () => {
    const [h, sActive, sPaused, us, pk] = await Promise.all([
      fetch("/api/halls").then((r) => r.json()),
      fetch("/api/sessions?status=active").then((r) => r.json()),
      fetch("/api/sessions?status=paused").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/packages").then((r) => r.json()),
    ]);
    setHalls(h);
    setSessions([...sActive, ...sPaused]);
    setUsers(us);
    setPackages(pk);
  };

  useEffect(() => {
    load();
    const id = setInterval(() => {
      setTick((t) => t + 1);
      load();
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const findSession = (compId: number) =>
    sessions.find((s) => s.session.computerId === compId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Залы и компьютеры</h1>
          <p className="text-sm text-[#737373] mt-1">Мониторинг в реальном времени • обновление 4 сек.</p>
        </div>
        <HallFilter halls={halls} selected={selectedHall} onChange={setSelectedHall} />
      </div>

      <div className="space-y-6">
        {halls
          .filter((h) => !selectedHall || h.id === selectedHall)
          .map((hall) => {
            const free = hall.computers.filter((c) => c.status === "free").length;
            const busy = hall.computers.filter((c) => c.status === "busy").length;
            const reserved = hall.computers.filter((c) => c.status === "reserved").length;
            return (
              <div key={hall.id} className="surface rounded-2xl p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="text-xl">{hallIcon(hall.type)}</span>
                      {hall.name}
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-md bg-[#1a1a1a] border border-[#262626] text-[#a3a3a3] font-bold tracking-wider">
                        {hall.type}
                      </span>
                    </h2>
                    {hall.description && (
                      <p className="text-sm text-[#737373] mt-1">{hall.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Counter label="Свободно" value={free} variant="muted" />
                    <Counter label="Занято" value={busy} variant="orange" />
                    <Counter label="Пауза" value={reserved} variant="muted" />
                    <div className="px-3 py-1 rounded-md bg-[#0f0f0f] border border-[#262626] font-semibold text-white">
                      {formatKZT(hall.hourlyRate)}/час
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {hall.computers.map((c) => {
                    const sess = findSession(c.id);
                    const st = STATUS_STYLES[c.status];
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (c.status === "free" || sess) setBookingComp(c);
                        }}
                        className={`relative p-3 rounded-xl border ${st.border} ${st.bg} ${st.ring || ""} hover:scale-[1.02] transition-all text-left group`}
                      >
                        <div className="absolute top-2 right-2">
                          <span
                            className={`w-2 h-2 rounded-full ${st.dot} ${
                              c.status === "busy" ? "animate-pulse-orange" : ""
                            }`}
                          />
                        </div>
                        <div className="text-xl mb-1">{compIcon(c.status)}</div>
                        <div className="font-bold text-sm text-white">{c.name}</div>
                        <div className={`text-[10px] uppercase tracking-wider font-bold ${st.text}`}>
                          {st.label}
                        </div>
                        {sess && sess.session.status === "active" && (
                          <SessionTimer session={sess.session} />
                        )}
                        {sess && sess.session.status === "paused" && (
                          <div className="text-[10px] text-white mt-1">⏸ Пауза</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {bookingComp && (
        <ComputerModal
          computer={bookingComp}
          hall={halls.find((h) => h.id === bookingComp.hallId)!}
          session={findSession(bookingComp.id) || null}
          users={users.filter((u) => u.role === "client")}
          packages={packages}
          onClose={() => {
            setBookingComp(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SessionTimer({ session }: { session: ActiveSession["session"] }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mins = elapsedMinutes(session.startAt, null, session.totalPausedMinutes);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <div className="text-[10px] text-[#f97316] mt-1 font-mono font-bold">
      ⏱ {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
    </div>
  );
}

function Counter({ label, value, variant }: { label: string; value: number; variant: "orange" | "muted" }) {
  return (
    <div
      className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${
        variant === "orange"
          ? "bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]"
          : "bg-[#0f0f0f] border-[#262626] text-[#a3a3a3]"
      }`}
    >
      {label}: <span className="font-black">{value}</span>
    </div>
  );
}

function HallFilter({ halls, selected, onChange }: { halls: Hall[]; selected: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
          selected === null
            ? "bg-[#f97316] text-[#0a0a0a] border-[#f97316]"
            : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#404040]"
        }`}
      >
        Все
      </button>
      {halls.map((h) => (
        <button
          key={h.id}
          onClick={() => onChange(h.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
            selected === h.id
              ? "bg-[#f97316] text-[#0a0a0a] border-[#f97316]"
              : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#404040]"
          }`}
        >
          {h.name}
        </button>
      ))}
    </div>
  );
}

function hallIcon(type: string) {
  return {
    standart: "🏛️",
    room: "🚪",
    vip: "👑",
    bootcamp: "🎯",
    trio: "🎮",
    solo: "🎧",
  }[type] || "🏢";
}

function compIcon(status: string) {
  return {
    free: "🖥️",
    busy: "🎮",
    reserved: "⏸️",
    maintenance: "🔧",
    offline: "⛔",
  }[status] || "🖥️";
}

function ComputerModal({
  computer,
  hall,
  session,
  users,
  packages,
  onClose,
}: {
  computer: Computer;
  hall: Hall;
  session: ActiveSession | null;
  users: User[];
  packages: any[];
  onClose: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [packageId, setPackageId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const pricePerHour = parseFloat(computer.hourlyRate || hall.hourlyRate);

  const startSession = async () => {
    if (!userId) {
      setError("Выберите клиента");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerId: computer.id,
          userId,
          packageId: packageId ? parseInt(packageId) : null,
          pricePerHour,
        }),
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

  const pauseSession = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await fetch(`/api/sessions/${session.session.id}/pause`, { method: "POST" });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const resumeSession = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await fetch(`/api/sessions/${session.session.id}/resume`, { method: "POST" });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await fetch(`/api/sessions/${session.session.id}/stop`, { method: "POST" });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  let minutes = 0;
  let amount = 0;
  if (session) {
    const tp = session.session.pausedAt
      ? session.session.totalPausedMinutes +
        Math.max(0, Math.floor((Date.now() - new Date(session.session.pausedAt).getTime()) / 60000))
      : session.session.totalPausedMinutes;
    minutes = elapsedMinutes(session.session.startAt, null, tp);
    amount = Math.ceil((minutes / 60) * pricePerHour);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f0f0f] border border-[#262626] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-in"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-[#737373] uppercase tracking-wider font-medium">{hall.name}</div>
            <h2 className="text-2xl font-black text-white">{computer.name}</h2>
            {computer.specs && <p className="text-xs text-[#525252] mt-1">{computer.specs}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#262626] grid place-items-center text-[#a3a3a3]"
          >
            ✕
          </button>
        </div>

        {!session && computer.status === "free" && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Клиент</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="input-bare mt-1"
              >
                <option value="">— Выберите клиента —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (@{u.username})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Тариф / пакет</label>
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="input-bare mt-1"
              >
                <option value="">— Поминутная тарификация —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatKZT(p.price)} ({p.durationMinutes} мин)
                  </option>
                ))}
              </select>
            </div>
            <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626] text-sm flex justify-between">
              <span className="text-[#737373]">Ставка:</span>
              <span className="font-bold text-white">{formatKZT(pricePerHour)}/час</span>
            </div>
            {error && (
              <div className="p-2.5 rounded-lg bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] text-sm">
                {error}
              </div>
            )}
            <button onClick={startSession} disabled={loading} className="btn-primary w-full py-2.5">
              ▶ Запустить сессию
            </button>
          </div>
        )}

        {session && session.session.status === "active" && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#f97316]/10 border border-[#f97316]/30">
              <div className="text-[10px] text-[#f97316] uppercase tracking-widest font-bold">Активная сессия</div>
              <div className="text-3xl font-black font-mono mt-1 text-white">
                {String(Math.floor(minutes / 60)).padStart(2, "0")}:
                {String(minutes % 60).padStart(2, "0")}
              </div>
              <div className="text-xs text-[#a3a3a3] mt-1">Начата: {formatTime(session.session.startAt)}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626] text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Клиент:</span>
                <span className="font-semibold text-white">{session.user?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">К оплате:</span>
                <span className="font-bold text-[#f97316]">{formatKZT(amount)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={pauseSession}
                disabled={loading}
                className="py-2.5 rounded-lg bg-[#1a1a1a] border border-[#404040] text-white font-semibold hover:bg-[#262626]"
              >
                ⏸ Пауза
              </button>
              <button
                onClick={stopSession}
                disabled={loading}
                className="py-2.5 rounded-lg bg-[#f97316] text-[#0a0a0a] font-bold hover:bg-[#fb923c]"
              >
                ⏹ Завершить
              </button>
            </div>
          </div>
        )}

        {session && session.session.status === "paused" && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#525252]">
              <div className="text-[10px] text-white uppercase tracking-widest font-bold">На паузе</div>
              <div className="text-3xl font-black font-mono mt-1 text-white">
                {String(Math.floor(minutes / 60)).padStart(2, "0")}:
                {String(minutes % 60).padStart(2, "0")}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={resumeSession}
                disabled={loading}
                className="py-2.5 rounded-lg bg-[#f97316] text-[#0a0a0a] font-bold hover:bg-[#fb923c]"
              >
                ▶ Продолжить
              </button>
              <button
                onClick={stopSession}
                disabled={loading}
                className="py-2.5 rounded-lg bg-[#1a1a1a] border border-[#f97316]/40 text-[#f97316] font-semibold hover:bg-[#f97316]/10"
              >
                ⏹ Завершить
              </button>
            </div>
          </div>
        )}

        {!session && computer.status !== "free" && (
          <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#262626] text-center text-[#737373] text-sm">
            Компьютер в статусе: {STATUS_STYLES[computer.status]?.label}
          </div>
        )}
      </div>
    </div>
  );
}
