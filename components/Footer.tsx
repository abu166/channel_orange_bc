import { Logo } from "./Nav";

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_2fr]">
        <Logo />
        <p className="text-sm leading-relaxed text-mute">
          VetoHealth is an educational evidence tool. It does not diagnose, prescribe, or tell you to start, stop or change any
          medication or dose. Verdicts summarise published research that we retrieve live from PubMed (NCBI) and are not medical
          advice. If you have urgent symptoms, contact a clinician or call 911. Demo data only — never upload real patient records.
        </p>
      </div>
    </footer>
  );
}
