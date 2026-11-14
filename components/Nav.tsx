"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/analyze", label: "Check a claim" },
  { href: "/routine", label: "Routine check" },
  { href: "/history", label: "History" },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-signal text-ink">
        <span className="font-serif text-xl italic leading-none">V</span>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-ink bg-contradict" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">VetoHealth</span>
    </span>
  );
}

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-ink/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="VetoHealth home"><Logo /></Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`relative rounded-full px-4 py-2 text-sm transition ${active ? "text-ink" : "text-bone/70 hover:text-bone"}`}>
                {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-bone" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>
        <Link href="/analyze" className="btn-primary !py-2 text-[13px]">Veto a claim →</Link>
      </nav>
      <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`chip shrink-0 ${path.startsWith(l.href) ? "!bg-bone !text-ink" : ""}`}>{l.label}</Link>
        ))}
      </div>
    </header>
  );
}
