"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/analyze", label: "Check a claim" },
  { href: "/routine", label: "Routine" },
  { href: "/labs", label: "Labs" },
  { href: "/visit", label: "Visits" },
  { href: "/plans", label: "Plans" },
  { href: "/history", label: "Dashboard" },
  { href: "/brief", label: "Doctor brief" },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="h-3 w-3 shrink-0 bg-burgundy" />
      <span className="display text-2xl">VetoHealth</span>
    </span>
  );
}

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream text-ink">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="VetoHealth home" className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-burgundy"><Logo /></Link>
        <div className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={`relative inline-flex min-h-11 items-center border-b-2 px-2 py-2 text-[15px] transition ${active ? "border-burgundy font-medium text-burgundy" : "border-transparent text-muted hover:text-burgundy"}`}>
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>
        <Link href="/analyze" className="btn-primary !py-2 text-base">Check a claim</Link>
      </nav>
      <nav aria-label="Mobile primary" className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined} className={`inline-flex items-center px-3 py-2.5 min-h-11 shrink-0 border-b-2 text-[15px] ${path.startsWith(l.href) ? "border-burgundy font-medium text-burgundy" : "border-transparent text-muted hover:text-burgundy"}`}>{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}
