export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Muslim Connect";
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function money(cents: number) {
  return cents === 0 ? "Free" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || "America/Los_Angeles";
export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { timeZone: TZ, dateStyle: "full", timeStyle: "short" });
}
export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" });
}
function tzOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const g = (t: string) => Number(parts.find((x) => x.type === t)!.value);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - Math.floor(date.getTime() / 1000) * 1000;
}
/** Convert an admin's <input type="datetime-local"> value (wall time in the site timezone) to a UTC ISO string. */
export function localInputToIso(v: string) {
  if (!v) return null;
  const guess = Date.parse(v + ":00Z");
  return new Date(guess - tzOffsetMs(new Date(guess))).toISOString();
}
export function isoToLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() + tzOffsetMs(d)).toISOString().slice(0, 16);
}
export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "event";
}

export const nowMs = () => Date.now();
export const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

export function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }),
  };
}
