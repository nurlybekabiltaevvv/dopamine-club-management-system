"use client";

import { useEffect, useState } from "react";
import { formatKZT, formatDate } from "@/lib/format";

type User = {
  id: string;
  username: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: "admin" | "operator" | "client";
  balance: string;
  bonusPoints: number;
  isActive: boolean;
  createdAt: string;
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [topUp, setTopUp] = useState<User | null>(null);

  const load = async () => {
    const r = await fetch("/api/users");
    setUsers(await r.json());
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Удалить пользователя?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Клиенты и пользователи</h1>
          <p className="text-sm text-[#737373] mt-1">
            База пользователей: {users.length} • Клиентов:{" "}
            {users.filter((u) => u.role === "client").length}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Добавить
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Поиск..."
          className="input-bare flex-1 min-w-[200px]"
        />
        <div className="flex gap-1.5">
          {[
            { v: "all", l: "Все" },
            { v: "client", l: "Клиенты" },
            { v: "operator", l: "Операторы" },
            { v: "admin", l: "Админы" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setRoleFilter(f.v)}
              className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                roleFilter === f.v
                  ? "bg-[#f97316] text-[#0a0a0a] border-[#f97316]"
                  : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#404040]"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-widest text-[#737373] font-semibold">
              <tr>
                <th className="text-left p-3">Имя</th>
                <th className="text-left p-3">Логин</th>
                <th className="text-left p-3">Телефон</th>
                <th className="text-left p-3">Роль</th>
                <th className="text-right p-3">Баланс</th>
                <th className="text-right p-3">Бонусы</th>
                <th className="text-left p-3">Создан</th>
                <th className="text-right p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#525252]">Нет пользователей</td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-[#1f1f1f] hover:bg-[#0f0f0f]">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#262626] grid place-items-center text-xs font-bold text-white">
                        {u.fullName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.fullName}</div>
                        {u.email && <div className="text-[10px] text-[#525252]">{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs text-[#737373]">@{u.username}</td>
                  <td className="p-3 text-xs text-[#a3a3a3]">{u.phone || "—"}</td>
                  <td className="p-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="p-3 text-right font-bold text-white">{formatKZT(u.balance)}</td>
                  <td className="p-3 text-right font-bold text-[#f97316]">{u.bonusPoints}</td>
                  <td className="p-3 text-xs text-[#737373]">{formatDate(u.createdAt)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {u.role === "client" && (
                        <button
                          onClick={() => setTopUp(u)}
                          className="px-2 py-1 rounded-md bg-[#f97316] text-[#0a0a0a] text-xs font-bold hover:bg-[#fb923c]"
                        >
                          +₸
                        </button>
                      )}
                      <button
                        onClick={() => setEditing(u)}
                        className="px-2 py-1 rounded-md bg-[#1a1a1a] border border-[#262626] hover:bg-[#262626] text-xs font-semibold text-white"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => remove(u.id)}
                        className="px-2 py-1 rounded-md bg-transparent border border-[#3a1a1a] hover:bg-[#1f0a0a] text-[#a3a3a3] text-xs font-semibold"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || creating) && (
        <UserModal
          user={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
        />
      )}

      {topUp && (
        <TopUpModal
          user={topUp}
          onClose={() => {
            setTopUp(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { c: string; l: string }> = {
    admin: { c: "bg-[#f97316] text-[#0a0a0a] border-[#f97316]", l: "Админ" },
    operator: { c: "bg-[#1a1a1a] text-white border-[#262626]", l: "Оператор" },
    client: { c: "bg-[#0a0a0a] text-[#a3a3a3] border-[#262626]", l: "Клиент" },
  };
  const s = map[role] || map.client;
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${s.c}`}>
      {s.l}
    </span>
  );
}

function UserModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [username, setUsername] = useState(user?.username || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "client");
  const [balance, setBalance] = useState(user?.balance || "0");
  const [bonusPoints, setBonusPoints] = useState(user?.bonusPoints || 0);
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!username || !fullName) {
      setError("Заполните имя и логин");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body: any = {
        username,
        fullName,
        phone: phone || null,
        email: email || null,
        role,
        isActive,
      };
      if (!user) {
        body.balance = balance;
        body.bonusPoints = bonusPoints;
      }
      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PATCH" : "POST";
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
          {user ? "Редактировать" : "Новый пользователь"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">ФИО</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-bare mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Логин</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-bare mt-1"
                disabled={!!user}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Роль</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="input-bare mt-1"
              >
                <option value="client">Клиент</option>
                <option value="operator">Оператор</option>
                <option value="admin">Админ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Телефон</label>
            <input
              value={phone || ""}
              onChange={(e) => setPhone(e.target.value)}
              className="input-bare mt-1"
              placeholder="+77001234567"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Email</label>
            <input
              value={email || ""}
              onChange={(e) => setEmail(e.target.value)}
              className="input-bare mt-1"
            />
          </div>
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Баланс ₸</label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="input-bare mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Бонусы</label>
                <input
                  type="number"
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(parseInt(e.target.value) || 0)}
                  className="input-bare mt-1"
                />
              </div>
            </div>
          )}
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
            <button onClick={onClose} className="flex-1 py-2 btn-ghost">Отмена</button>
            <button onClick={save} disabled={loading} className="btn-primary flex-1 py-2">
              {loading ? "..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopUpModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) {
      setError("Введите сумму");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/users/${user.id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: a }),
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
        className="bg-[#0f0f0f] border border-[#262626] rounded-2xl p-6 max-w-sm w-full animate-slide-in"
      >
        <h2 className="text-xl font-black mb-1 text-white">Пополнить баланс</h2>
        <p className="text-sm text-[#737373] mb-4">{user.fullName} (@{user.username})</p>
        <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626] mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[#737373]">Текущий:</span>
            <span className="font-bold text-white">{formatKZT(user.balance)}</span>
          </div>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-bare"
          placeholder="Сумма ₸"
          autoFocus
        />
        {error && (
          <div className="p-2.5 rounded-lg bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] text-sm mt-2">
            {error}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 btn-ghost">Отмена</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 py-2">
            {loading ? "..." : "Пополнить"}
          </button>
        </div>
      </div>
    </div>
  );
}
