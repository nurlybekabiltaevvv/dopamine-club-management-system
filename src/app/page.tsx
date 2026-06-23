"use client";

import { useEffect, useState } from "react";
import { Sidebar, MobileNav, type Tab } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { Halls } from "@/components/Halls";
import { Sessions } from "@/components/Sessions";
import { Packages } from "@/components/Packages";
import { Products } from "@/components/Products";
import { Sales } from "@/components/Sales";
import { Users } from "@/components/Users";
import { Reports } from "@/components/Reports";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [seeded, setSeeded] = useState<boolean | null>(null);

  useEffect(() => {
    // Auto-seed if empty
    fetch("/api/halls")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length === 0) {
          return fetch("/api/seed", { method: "POST" });
        }
        return null;
      })
      .then(() => setSeeded(true))
      .catch(() => setSeeded(true));
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar active={tab} onChange={setTab} />
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {tab === "dashboard" && <Dashboard />}
          {tab === "halls" && <Halls />}
          {tab === "sessions" && <Sessions />}
          {tab === "packages" && <Packages />}
          {tab === "products" && <Products />}
          {tab === "sales" && <Sales />}
          {tab === "users" && <Users />}
          {tab === "reports" && <Reports />}
        </div>
      </main>
      <MobileNav active={tab} onChange={setTab} />
    </div>
  );
}
