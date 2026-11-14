import { PILOT_AREAS, SERVICES, type ServiceId } from "./pricing";

/** Booking requests (pilot: stored on this device; no payment is taken and nobody is dispatched yet). */
export interface Booking {
  id: string;
  kind: ServiceId;
  created_at: string;
  slot_iso: string;
  duration_min: number;
  price_usd: number;
  plan_id: string | null;
  contact: { name: string; phone: string; email: string };
  address: { line1: string; city: string; state: string; zip: string; access_notes: string } | null;
  details: Record<string, string>;
  status: "requested" | "cancelled";
}

export interface DaySlots { date: string; label: string; weekday: string; slots: string[] }

/** Real calendar slots for the next `days` days, in the user's local time. Home visits Mon–Sat 9:00–18:00 every 90 min; video consults daily 8:00–20:00 every 30 min. */
export function generateSlots(kind: ServiceId, days = 14, from = new Date()): DaySlots[] {
  const out: DaySlots[] = [];
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  for (let d = 1; d <= days; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    if (kind === "home_skin" && day.getDay() === 0) continue;
    const [open, close, step] = kind === "home_skin" ? [9 * 60, 18 * 60, 90] : [8 * 60, 20 * 60, 30];
    const slots: string[] = [];
    for (let m = open; m + SERVICES[kind].minutes <= close; m += step) {
      const t = new Date(day);
      t.setMinutes(m);
      slots.push(t.toISOString());
    }
    out.push({ date: day.toISOString().slice(0, 10), label: day.toLocaleDateString([], { month: "short", day: "numeric" }), weekday: day.toLocaleDateString([], { weekday: "short" }), slots });
  }
  return out;
}

export const isZip = (zip: string) => /^\d{5}$/.test(zip.trim());
export const serviceArea = (zip: string) => (isZip(zip) ? PILOT_AREAS.find((a) => a.prefixes.some((p) => zip.trim().startsWith(p)))?.city ?? null : null);

/** iCalendar file so the booking lands in the user's real calendar. */
export function toICS(b: Booking): string {
  const s = SERVICES[b.kind];
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(b.slot_iso);
  const end = new Date(start.getTime() + b.duration_min * 60_000);
  const loc = b.address ? `${b.address.line1}, ${b.address.city}, ${b.address.state} ${b.address.zip}` : "Video call (link sent before the consult)";
  const esc = (t: string) => t.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VetoHealth//Booking//EN", "BEGIN:VEVENT", `UID:${b.id}@vetohealth`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${esc(`VetoHealth: ${s.name}`)}`, `LOCATION:${esc(loc)}`,
    `DESCRIPTION:${esc(`${s.who}. Pilot booking request ${b.id.slice(0, 8)}. Not a confirmed appointment until our care team confirms.`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}

const KEY = "veto:bookings";
export function listBookings(): Booking[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
export function saveBooking(b: Omit<Booking, "id" | "created_at" | "status">): Booking {
  const full: Booking = { ...b, id: crypto.randomUUID(), created_at: new Date().toISOString(), status: "requested" };
  try { localStorage.setItem(KEY, JSON.stringify([full, ...listBookings()])); } catch { /* storage blocked */ }
  return full;
}
export function cancelBooking(id: string) {
  try { localStorage.setItem(KEY, JSON.stringify(listBookings().map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)))); } catch { /* storage blocked */ }
}
export function downloadICS(b: Booking) {
  const url = URL.createObjectURL(new Blob([toICS(b)], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `vetohealth-${b.kind}.ics` });
  a.click();
  URL.revokeObjectURL(url);
}
