"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clapperboard, ExternalLink, ImageUp, Loader2, Type, X } from "lucide-react";
import dynamic from "next/dynamic";
import ReportView from "@/components/ReportView";
import type { Mood } from "@/components/HeroScene";
import { VERDICTS, type Verdict } from "@/lib/types";
import { runAnalysis, saveReport, type Thread } from "@/lib/store";
import type { Claim, StreamEvent } from "@/lib/types";

const Vee = dynamic(() => import("@/components/HeroScene"), { ssr: false, loading: () => <div className="h-full w-full rounded-[10px] bg-blush-pale/40" /> });
const moodFor = (v: Verdict): Mood => (v === "supported" || v === "partially_supported" ? "good" : v === "insufficient_evidence" ? "unsure" : "bad");

const SAMPLES = [
  "Collagen supplements reduce wrinkles and improve skin elasticity.",
  "Celery juice cures eczema in 7 days! It also detoxes your liver.",
  "Melatonin improves sleep quality in adults.",
  "Rosemary oil regrows hair as well as minoxidil.",
  "Vitamin C prevents the common cold.",
];
type Mode = "text" | "screenshot" | "reel";
const STAGES = [
  { id: "extract", label: "Extract claims" },
  { id: "search", label: "Search PubMed" },
  { id: "contradict", label: "Check counter-evidence" },
  { id: "assess", label: "Weigh the evidence" },
] as const;

function Analyzer() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [creator, setCreator] = useState("");
  const [ocr, setOcr] = useState<{ busy: boolean; progress: number; name?: string; error?: string }>({ busy: false, progress: 0 });
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<{ id: string; message: string } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const started = useRef(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [doneIdx, setDoneIdx] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = params.get("q");
    if (!q) return;
    setText(q);
    if (params.get("run") === "1" && !started.current) { started.current = true; analyze(undefined, q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const onEvent = (e: StreamEvent) => {
    if (e.type === "stage") { setStage({ id: e.stage, message: e.message }); setLog((l) => (l.at(-1) === e.message ? l : [...l, e.message])); }
    if (e.type === "claims") setClaims(e.claims);
    if (e.type === "claim_done") setDoneIdx((d) => [...d, e.index]);
  };

  async function analyze(existing?: Thread, override?: string) {
    setRunning(true); setError(null); setClaims([]); setDoneIdx([]); setStage(null); setLog([]);
    if (!existing) setThread(null);
    const input = existing ? existing.versions[0].input : { text: override ?? text, content_type: mode === "screenshot" ? "screenshot_text" : mode === "reel" ? "transcript" : "text", source_url: mode === "reel" && url ? url : null, creator: mode === "reel" ? creator.trim() || null : null };
    try {
      const report = await runAnalysis(input, onEvent);
      const t = saveReport(report, existing?.id);
      setThread({ ...t, versions: [...t.versions] });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The check could not finish. Try checking the claim again.");
    } finally {
      setRunning(false);
    }
  }

  async function runOcr(file: File) {
    if (!file.type.startsWith("image/")) return setOcr({ busy: false, progress: 0, error: "Please choose an image (PNG, JPG, WebP)." });
    if (file.size > 8 * 1024 * 1024) return setOcr({ busy: false, progress: 0, error: "Choose an image smaller than 8 MB." });
    setOcr({ busy: true, progress: 0, name: file.name });
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { logger: (m: { status: string; progress: number }) => m.status === "recognizing text" && setOcr((o) => ({ ...o, progress: m.progress })) });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setText(data.text.replace(/\n{2,}/g, "\n").trim());
      setOcr({ busy: false, progress: 1, name: file.name });
    } catch {
      setOcr({ busy: false, progress: 0, error: "Couldn't read text from that image. Try a sharper screenshot or paste the text." });
    }
  }

  const stageIdx = stage ? Math.max(0, STAGES.findIndex((s) => s.id === stage.id)) : -1;
  const canRun = text.trim().length >= 8 && !running && !ocr.busy;

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6">
      <motion.div className="relative mb-10">

        <h1 className="page-heading">Check a health claim</h1>
        <p className="mt-5 max-w-xl text-lg text-muted">Compare a claim with PubMed research.</p>
      </motion.div>

      <motion.div className="card relative p-4 sm:p-8">
        <div className="mb-5 flex flex-wrap border-b border-line" role="group" aria-label="Input format">
          {([["text", "Text", Type], ["screenshot", "Screenshot", ImageUp], ["reel", "Reel or TikTok", Clapperboard]] as const).map(([id, label, Icon]) => (
            <button key={id} aria-pressed={mode === id} onClick={() => setMode(id)} className={`relative flex min-w-0 flex-1 flex-col sm:flex-row items-center justify-center min-h-11 gap-1.5 border-b-2 px-1 py-2.5 text-sm sm:text-base focus-visible:outline-2 focus-visible:outline-burgundy ${mode === id ? "border-burgundy text-burgundy" : "border-transparent text-muted hover:text-ink"}`}>

              <Icon size={20} strokeWidth={1.75} className="relative" /><span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} className="space-y-3">
            {mode === "screenshot" && (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border-y border-dashed border-line bg-subtle p-6 text-center transition hover:border-rose/50"
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) runOcr(f); }}>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && runOcr(e.target.files[0])} />
                {ocr.busy ? <Loader2 className="animate-spin text-burgundy" /> : <ImageUp className="text-burgundy" />}
                <span className="text-base">{ocr.busy ? `Reading text… ${Math.round(ocr.progress * 100)}%` : ocr.name ? `Read “${ocr.name}”. Review text below.` : "Upload a screenshot"}</span>
                <span className="text-base text-muted">Image stays on your device.</span>
                {ocr.busy && <span className="h-1 w-48 overflow-hidden rounded-md bg-fg/[.06]"><span className="block h-full bg-burgundy" style={{ width: `${ocr.progress * 100}%` }} /></span>}
                {ocr.error && <span className="text-base text-contradict">{ocr.error}</span>}
              </label>
            )}
            {mode === "reel" && (
              <div className="grid gap-3 border-t border-line bg-subtle p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label htmlFor="reel-url" className="mb-2 block text-base">Reel / TikTok / Short link</label>
                  <input id="reel-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/…" className="field" />
                </div>
                <a href="https://reelgrab.ink/" target="_blank" rel="noopener noreferrer" className="btn-ghost text-base">Get transcript <ExternalLink size={13} /></a>
                <div className="sm:col-span-2"><label htmlFor="creator-handle" className="mb-2 block text-base">Creator handle (optional)</label><input id="creator-handle" value={creator} onChange={e => setCreator(e.target.value)} placeholder="@creator" maxLength={100} autoCapitalize="none" className="field min-h-11" /></div>
                <p className="text-base text-muted sm:col-span-2">Paste captions from a tool you’re allowed to use.</p>
              </div>
            )}
            <div className="relative">
              <label htmlFor="claim" className="sr-only">Claim text</label>
              <textarea id="claim" value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={6000}
                placeholder={mode === "reel" ? "Paste the transcript here…" : "e.g. “Collagen supplements reduce wrinkles and improve skin elasticity.”"}
                className="field resize-none !rounded-[10px] !border-transparent !bg-transparent pr-14 text-lg leading-relaxed sm:text-xl"
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canRun) analyze(); }} />
              {text && <button aria-label="Clear" onClick={() => setText("")} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-burgundy text-muted hover:bg-fg/[.04] hover:text-fg"><X size={16} /></button>}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-5 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5 pb-1">
            {SAMPLES.map((s, i) => <button key={s} onClick={() => { setMode("text"); setText(s); }} className="chip-lg max-w-full whitespace-normal text-left hover:border-rose/40 hover:text-fg focus-visible:outline-2 focus-visible:outline-burgundy">{["Collagen & skin", "Celery juice", "Melatonin & sleep", "Rosemary oil", "Vitamin C"][i]}</button>)}
          </div>
          <button disabled={!canRun} onClick={() => analyze()} className="btn-primary shrink-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-auto">
            {running ? <><Loader2 size={16} className="animate-spin" /> Checking…</> : <>Check this claim <span className="hidden text-base opacity-60 sm:inline">⌘↵</span></>}
          </button>
        </div>
      </motion.div>

      {(running || thread) && (() => {
        const first = thread?.versions.at(-1)?.claims[0]?.assessment;
        const mood: Mood = running ? "checking" : first ? moodFor(first.verdict) : "unsure";
        return (
          <div className="card mt-6 grid items-center gap-2 overflow-hidden sm:grid-cols-[200px_1fr]">
            <div className="h-44 sm:h-48"><Vee mood={mood} compact /></div>
            <div className="px-5 pb-5 sm:px-0 sm:pb-0 sm:pr-6" aria-live="polite">
              {running ? (
                <>
                  <p className="eyebrow">Vee is checking</p>
                  <p className="mt-1 text-xl font-medium">{stage?.message ?? "Connecting to PubMed…"}</p>
                </>
              ) : first ? (
                <>
                  <p className="eyebrow">Vee&apos;s read</p>
                  <p className="mt-1 text-xl font-medium" style={{ color: VERDICTS[first.verdict].color }}>{VERDICTS[first.verdict].label}</p>
                  <p className="mt-1 max-w-[60ch] text-base text-fg/80">{first.bottom_line}</p>
                </>
              ) : (
                <p className="text-xl font-medium">No checkable claim found.</p>
              )}
            </div>
          </div>
        );
      })()}

      <AnimatePresence>
        {running && (
          <motion.div className="overflow-hidden">
            <div className="card mt-6 p-5 sm:p-6">
              <ol className="divide-y divide-line" aria-label="Analysis progress">
                {STAGES.map((s, i) => (
                  <li key={s.id} aria-current={i === stageIdx ? "step" : undefined} className="flex items-center gap-4 py-3">
                    <span className="w-6 shrink-0 tabular-nums text-muted">{i + 1}.</span>
                    <span className={`flex-1 text-base ${i === stageIdx ? "font-medium text-burgundy" : "text-muted"}`}>{s.label}</span>
                    {i < stageIdx && <Check size={18} className="text-success" aria-label="Complete" />}
                    {i === stageIdx && <span className="eyebrow">In progress</span>}
                  </li>
                ))}
              </ol>
              <details className="mt-5 text-base"><summary className="min-h-11 cursor-pointer">Progress details</summary><ul aria-live="polite" className="mt-5 space-y-2 border-t border-line pt-4 text-base">
                {(log.length ? log : ["Connecting to PubMed…"]).map((m, i, arr) => (
                  <motion.li key={m + i} className={`flex items-start gap-2 ${i === arr.length - 1 ? "text-fg" : "text-muted"}`}>
                    <span className="text-burgundy">{i === arr.length - 1 ? "▸" : "✓"}</span>{m}
                  </motion.li>
                ))}
              </ul></details>
              <div className="mt-4 flex flex-wrap gap-2">
                {claims.map((c, i) => (
                  <motion.span key={c.claim_id} className={`chip ${doneIdx.includes(i) ? "!border-rose/50" : ""}`}>
                    {doneIdx.includes(i) ? <Check size={12} className="text-burgundy" /> : <Loader2 size={12} className="animate-spin" />} {c.normalized_text}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="card mt-6 flex flex-col items-start gap-3 border-contradict/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-contradict">{error}</p>
          <button onClick={() => analyze(thread ?? undefined)} className="btn-ghost !py-2 text-base">Retry claim check</button>
        </div>
      )}

      <div ref={resultRef} className="scroll-mt-24 pt-8">
        {thread && !running && (thread.versions.at(-1)!.claims.length ? (
          <ReportView key={thread.versions.length} thread={thread} onRecheck={() => analyze(thread)} rechecking={running} />
        ) : (
          <div className="card p-8 text-center">
            <p className="display text-3xl">No checkable claims found.</p>
            <p className="mx-auto mt-3 max-w-md text-base text-muted">{thread.versions.at(-1)!.warnings[0]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense><Analyzer /></Suspense>;
}
