import Link from "next/link";
import { Logo } from "./Nav";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-subtle text-muted sm:mt-28">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md text-fg focus-visible:outline-2 focus-visible:outline-burgundy" aria-label="VetoHealth home"><Logo /></Link>
        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_2fr]">
          <div>
            <h2 className="text-base font-semibold text-fg">Product</h2>
            <nav aria-label="Footer product" className="mt-3 flex flex-col items-start text-base">
              {[["/analyze", "Check a claim"], ["/routine", "Skincare checker"], ["/labs", "Lab results"], ["/history", "Dashboard"], ["/brief", "Doctor brief"]].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-md hover:text-burgundy focus-visible:outline-2 focus-visible:outline-burgundy">{label}</Link>)}
            </nav>
          </div>
          <div>
            <h2 className="text-base font-semibold text-fg">Care</h2>
            <nav aria-label="Footer care" className="mt-3 flex flex-col items-start text-base">
              {[["/labs", "Lab consult"], ["/visit", "Home skin check"], ["/plans", "Plans"]].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-md hover:text-burgundy focus-visible:outline-2 focus-visible:outline-burgundy">{label}</Link>)}
            </nav>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">For clinicians</h2>
            <nav aria-label="Footer clinicians" className="mt-3 flex flex-col items-start text-base">
              <Link href="/expert" className="inline-flex min-h-11 items-center rounded-md hover:text-burgundy">Expert review</Link>
            </nav>
          </div>
          <div className="col-span-2 border-t border-line pt-6 sm:col-span-3 lg:col-span-1 lg:border-t-0 lg:pt-0">
            <h2 className="text-base font-semibold text-fg">Evidence, with perspective</h2>
            <p className="mt-4 text-base leading-relaxed">Educational only. Not medical advice.</p>
            <p className="mt-3 text-base leading-relaxed">If you have chest pain, trouble breathing, or severe allergic reaction, call 911.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
