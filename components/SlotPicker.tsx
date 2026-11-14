"use client";
import { useMemo, useState, type KeyboardEvent } from "react";
import { generateSlots } from "@/lib/booking";
import type { ServiceId } from "@/lib/pricing";

function navigateRadio(event: KeyboardEvent<HTMLDivElement>) {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  const radios = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  const index = radios.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? radios.length - 1 : (index + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + radios.length) % radios.length;
  radios[next]?.focus();
  radios[next]?.click();
}

/** Date strip + time grid. `value` is an ISO slot. */
export default function SlotPicker({ kind, value, onChange }: { kind: ServiceId; value: string | null; onChange: (iso: string) => void }) {
  const days = useMemo(() => generateSlots(kind), [kind]);
  const [day, setDay] = useState(0);
  const d = days[day];
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" onKeyDown={navigateRadio} aria-label="Choose a day">
        {days.map((x, i) => (
          <button key={x.date} role="radio" aria-checked={i === day} tabIndex={i === day ? 0 : -1} aria-label={`${x.weekday} ${x.label}`} onClick={() => setDay(i)}
            className={`relative flex min-h-11 items-center gap-3 rounded-md border px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy transition ${i === day ? "border-rose bg-blush-pale text-burgundy" : "border-line bg-surface text-muted hover:border-rose"}`}>
            <span aria-hidden="true" className={`h-4 w-4 shrink-0 rounded-full border ${i === day ? "border-burgundy bg-burgundy ring-2 ring-inset ring-cream" : "border-muted"}`} /><span className="relative text-base font-medium">{x.weekday}</span>
            <span className="relative text-base font-semibold">{x.label.split(" ")[1]}</span>
            <span className="relative text-base">{x.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      
        <div key={d.date} className="mt-6 grid gap-2 sm:grid-cols-2" role="radiogroup" onKeyDown={navigateRadio} aria-label="Choose a time">
          {d.slots.map((s) => {
            const on = value === s;
            return (
              <button key={s} role="radio" aria-checked={on} tabIndex={on || (!d.slots.includes(value ?? "") && s === d.slots[0]) ? 0 : -1} aria-label={new Date(s).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} onClick={() => onChange(s)}
                className={`flex min-h-11 items-center gap-3 rounded-md border px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy transition ${on ? "border-rose bg-blush-pale font-medium text-burgundy" : "border-line bg-surface text-muted hover:border-rose"}`}>
                <span aria-hidden="true" className={`h-4 w-4 shrink-0 rounded-full border ${on ? "border-burgundy bg-burgundy ring-2 ring-inset ring-cream" : "border-muted"}`} />{new Date(s).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </button>
            );
          })}
        </div>
      
    </div>
  );
}
