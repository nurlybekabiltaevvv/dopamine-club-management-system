"use client";

import { useState } from "react";

export type Tab =
  | "dashboard"
  | "halls"
  | "sessions"
  | "packages"
  | "products"
  | "sales"
  | "users"
  | "reports";

const NAV: { id: Tab; label: string; icon: string; description: string }[] = [
  { id: "dashboard", label: "Дашборд", icon: "📊", description: "Главная панель" },
  { id: "halls", label: "Залы и ПК", icon: "🖥️", description: "Управление зонами" },
  { id: "sessions", label: "Сессии", icon: "⏱️", description: "Активные сессии" },
  { id: "packages", label: "Пакеты", icon: "📦", description: "Тарифы и пакеты" },
  { id: "products", label: "Товары", icon: "🥤", description: "Склад и ассортимент" },
  { id: "sales", label: "Продажи", icon: "💵", description: "POS и касса" },
  { id: "users", label: "Клиенты", icon: "👥", description: "База пользователей" },
  { id: "reports", label: "Отчёты", icon: "📈", description: "Финансы и аналитика" },
];

export function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0f0f0f] border-r border-[#1f1f1f] sticky top-0 h-screen">
      <div className="p-6 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#f97316] grid place-items-center text-xl font-black text-[#0a0a0a]">
            D
          </div>
          <div>
            <div className="text-lg font-black text-white tracking-tight">Dopamine</div>
            <div className="text-[10px] text-[#737373] uppercase tracking-widest font-medium">Club Manager</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((n) => {
          const isActive = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onChange(n.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 group ${
                isActive
                  ? "bg-[#f97316]/10 text-white border border-[#f97316]/30"
                  : "text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-white border border-transparent"
              }`}
            >
              <span className={`text-lg ${isActive ? "" : "opacity-80 group-hover:opacity-100"}`}>
                {n.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-tight">{n.label}</div>
                <div className="text-[10px] text-[#525252] truncate">{n.description}</div>
              </div>
              {isActive && <div className="w-1 h-5 bg-[#f97316] rounded-full" />}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#262626] grid place-items-center font-bold text-sm text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-white">Администратор</div>
            <div className="text-[10px] text-[#f97316] flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
              В сети
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f0f0f] border-t border-[#1f1f1f]">
      <div className="grid grid-cols-4 gap-1 p-2">
        {NAV.slice(0, 4).map((n) => (
          <button
            key={n.id}
            onClick={() => onChange(n.id)}
            className={`p-2 rounded-lg text-center ${
              active === n.id ? "bg-[#f97316]/15 text-[#f97316]" : "text-[#737373]"
            }`}
          >
            <div className="text-lg">{n.icon}</div>
            <div className="text-[10px] mt-0.5 truncate font-medium">{n.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
