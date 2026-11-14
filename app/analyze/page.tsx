"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clapperboard, ExternalLink, ImageUp, Loader2, Type, X } from "lucide-react";
import ReportView from "@/components/ReportView";
import { runAnalysis, saveReport, type Thread } from "@/lib/store";
import type { Claim, StreamEvent } from "@/lib/types";

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
  { id: "contradict", label: "Hunt counter-evidence" },
  { id: "assess", label: "Weigh & verdict" },
] as const;

function Analyzer() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [ocr, setOcr] = useState<{ busy: boolean; progress: number; name?: string; error?: string }>({ busy: false, progress: 0 });
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<{ id: string; message: string } | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [doneIdx, setDoneIdx] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const q = params.get("q"); if (q) setText(q); }, [params]);

  const onEvent = (e: StreamEvent) => {
    if (e.type === "stage") setStage({ id: e.stage, message: e.message });
    if (e.type === "claims") setClaims(e.claims);
    if (e.type === "claim_done") setDoneIdx((d) => [...d, e.index]);
  };

  async function analyze(existing?: Thread) {
    setRunning(true); setError(null); setClaims([]); setDoneIdx([]); setStage(null);
    if (!existing) setThread(null);
    const input = existing ? existing.versions[0].input : { text, content_type: mode === "screenshot" ? "screenshot_text" : mode === "reel" ? "transcript" : "text", source_url: mode === "reel" && url ? url : null };
    try {
      const report = await runAnalysis(input, onEvent);
      const t = saveReport(report, existing?.id);
      setThread({ ...t, versions: [...t.versions] });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRunning(false);
    }
  }

  async function runOcr(file: File) {
    if (!file.type.startsWith("image/")) return setOcr({ busy: false, progress: 0, error: "Please choose an image (PNG, JPG, WebP)." });
    if (file.size > 8 * 1024 * 1024) return setOcr({ busy: false, progress: 0, error: "Image is over 8 MB." });
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
    <div className="relative mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-bg" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative mb-10">
        <p className="eyebrow mb-4">01 / Claim check</p>
        <h1 className="display text-5xl sm:text-7xl">Paste the claim.<br /><em className="text-signal">We bring receipts.</em></h1>
        <p className="mt-5 max-w-xl text-mute">We split it into checkable claims, search PubMed live, deliberately look for studies that found <i>nothing</i>, then weigh what we found by study design.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="card relative p-3 sm:p-4">
        <div className="mb-3 flex gap-1 rounded-full bg-ink-3/80 p-1" role="tablist">
          {([["text", "Text", Type], ["screenshot", "Screenshot", ImageUp], ["reel", "Reel / TikTok", Clapperboard]] as const).map(([id, label, Icon]) => (
            <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs sm:text-sm ${mode === id ? "text-ink" : "text-bone/70 hover:text-bone"}`}>
              {mode === id && <motion.span layoutId="mode" className="absolute inset-0 rounded-full bg-bone" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <Icon size={16} strokeWidth={1.75} className="relative" /><span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
            {mode === "screenshot" && (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-ink-3/40 p-6 text-center transition hover:border-signal/50"
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) runOcr(f); }}>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && runOcr(e.target.files[0])} />
                {ocr.busy ? <Loader2 className="animate-spin text-signal" /> : <ImageUp className="text-signal" />}
                <span className="text-sm">{ocr.busy ? `Reading text… ${Math.round(ocr.progress * 100)}%` : ocr.name ? `Read “${ocr.name}” — edit the text below, then check` : "Drop a screenshot of a post, caption or label"}</span>
                <span className="text-xs text-mute">OCR runs in your browser; the image never leaves your device.</span>
                {ocr.busy && <span className="h-1 w-48 overflow-hidden rounded-full bg-white/10"><motion.span className="block h-full bg-signal" animate={{ width: `${ocr.progress * 100}%` }} /></span>}
                {ocr.error && <span className="text-xs text-contradict">{ocr.error}</span>}
              </label>
            )}
            {mode === "reel" && (
              <div className="grid gap-3 rounded-2xl border border-line bg-ink-3/40 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label htmlFor="reel-url" className="eyebrow mb-2 block">Reel / TikTok / Short link (kept as provenance)</label>
                  <input id="reel-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/…" className="field" />
                </div>
                <a href="https://reelgrab.ink/" target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">Get transcript <ExternalLink size={13} /></a>
                <p className="text-xs text-mute sm:col-span-2">We don't scrape platforms. Grab the transcript or captions with a tool you're allowed to use (e.g. ReelGrab), then paste it below.</p>
              </div>
            )}
            <div className="relative">
              <label htmlFor="claim" className="sr-only">Claim text</label>
              <textarea id="claim" value={text} onChange={(e) => setText(e.target.value)} rows={mode === "text" ? 5 : 4} maxLength={6000}
                placeholder={mode === "reel" ? "Paste the transcript here…" : "e.g. “Collagen supplements reduce wrinkles and improve skin elasticity.”"}
                className="field resize-none !rounded-2xl !border-transparent !bg-transparent text-lg leading-relaxed sm:text-xl"
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canRun) analyze(); }} />
              {text && <button aria-label="Clear" onClick={() => setText("")} className="absolute right-3 top-3 rounded-full p-1 text-mute hover:bg-white/5 hover:text-bone"><X size={16} /></button>}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-3 border-t border-line px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap">
            {SAMPLES.map((s) => <button key={s} onClick={() => { setMode("text"); setText(s); }} className="chip shrink-0 hover:border-signal/40 hover:text-bone">{s.length > 38 ? s.slice(0, 36) + "…" : s}</button>)}
          </div>
          <button disabled={!canRun} onClick={() => analyze()} className="btn-primary shrink-0">
            {running ? <><Loader2 size={16} className="animate-spin" /> Checking…</> : <>Veto it <span className="hidden font-mono text-[10px] opacity-60 sm:inline">⌘↵</span></>}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {running && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="card mt-6 p-5 sm:p-6" aria-live="polite">
              <div className="grid grid-cols-4 gap-2">
                {STAGES.map((s, i) => (
                  <div key={s.id}>
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div className="h-full bg-signal" initial={{ width: 0 }} animate={{ width: i < stageIdx ? "100%" : i === stageIdx ? "60%" : 0 }} transition={{ duration: 0.6 }} />
                    </div>
                    <p className={`mt-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider sm:text-[11px] ${i <= stageIdx ? "text-bone" : "text-mute/50"}`}>
                      {i < stageIdx ? <Check size={11} className="text-signal" /> : i === stageIdx ? <Loader2 size={11} className="animate-spin text-signal" /> : null}{s.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-bone/80">{stage?.message ?? "Connecting…"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {claims.map((c, i) => (
                  <motion.span key={c.claim_id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className={`chip ${doneIdx.includes(i) ? "!border-signal/50" : ""}`}>
                    {doneIdx.includes(i) ? <Check size={12} className="text-signal" /> : <Loader2 size={12} className="animate-spin" />} {c.normalized_text}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="card mt-6 flex flex-col items-start gap-3 border-contradict/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-contradict">{error}</p>
          <button onClick={() => analyze(thread ?? undefined)} className="btn-ghost !py-2 text-xs">Retry</button>
        </div>
      )}

      <div ref={resultRef} className="scroll-mt-24 pt-8">
        {thread && !running && (thread.versions.at(-1)!.claims.length ? (
          <ReportView key={thread.versions.length} thread={thread} onRecheck={() => analyze(thread)} rechecking={running} />
        ) : (
          <div className="card p-8 text-center">
            <p className="display text-3xl">Nothing to veto here.</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-mute">{thread.versions.at(-1)!.warnings[0]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense><Analyzer /></Suspense>;
}
