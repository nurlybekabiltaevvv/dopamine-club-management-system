// Currency formatter for KZT (Tenge)
export function formatKZT(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "0 ₸";
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + " ₸";
}

export function formatDuration(minutes: number): string {
  if (minutes < 0) minutes = 0;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}м`;
  if (m === 0) return `${h}ч`;
  return `${h}ч ${m}м`;
}

export function formatTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function elapsedMinutes(startAt: string | Date, pausedAt?: string | Date | null, totalPausedMinutes = 0): number {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  const now = new Date();
  const refTime = pausedAt ? (typeof pausedAt === "string" ? new Date(pausedAt) : pausedAt) : now;
  const diffMs = refTime.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 60000) - totalPausedMinutes);
}
