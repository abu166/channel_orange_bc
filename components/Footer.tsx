import Link from "next/link";
import { Logo } from "./Nav";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-subtle text-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md text-ink" aria-label="VetoHealth home"><Logo /></Link>
        <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_1fr_2fr]">
          <nav aria-label="Footer areas" className="flex flex-col items-start text-base">
            {[["/check", "Check"], ["/shelf", "Shelf"], ["/care", "Care"], ["/ledger", "Ledger"]].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-md hover:text-burgundy">{label}</Link>)}
          </nav>
          <nav aria-label="Footer secondary" className="flex flex-col items-start text-base">
            {[["/brief", "Doctor brief"], ["/expert", "Expert review (for clinicians)"], ["/deck", "Pitch deck"]].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-md hover:text-burgundy">{label}</Link>)}
          </nav>
          <div className="space-y-4 text-base leading-relaxed">
            <p>Educational only. Not medical advice.</p>
            <p>If you have chest pain, trouble breathing, or severe allergic reaction, call 911.</p>
            <p>No sign-up. Your ledger stays on this device.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
