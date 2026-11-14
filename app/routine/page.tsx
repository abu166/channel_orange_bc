"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScanLine, Plus, X, ArrowUpRight, Sun, Moon, Info, ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui";
import { analyzeRoutine, overlapSpend, ingredientById, type RoutineProduct } from "@/lib/ingredients";

import { gradeShelf, proofSpend, type ProofGrades, type ProofProgress } from "@/lib/proof";
import { VERDICTS } from "@/lib/types";
import { addSaving, usd } from "@/lib/savings";

const demo: RoutineProduct[] = [
  {id:"demo-1",monthlyUsd:28,name:"Retinol night serum",type:"skincare",timeOfDay:"pm",ingredientsText:"Retinol 0.2%, niacinamide, water"},
  {id:"demo-2",monthlyUsd:34,name:"Retinal renewal cream",type:"skincare",timeOfDay:"pm",ingredientsText:"Retinal 0.05%, glycolic acid 5%, niacinamide"},
  {id:"demo-3",monthlyUsd:18,name:"Daily multivitamin",type:"supplement",timeOfDay:"am",ingredientsText:"Vitamin D3, zinc gluconate, biotin, iron"},
  {id:"demo-4",monthlyUsd:22,name:"Immune & energy blend",type:"supplement",timeOfDay:"am",ingredientsText:"Cholecalciferol, zinc picolinate, calcium citrate, green tea extract, guarana"}
];
const warningHeadlines: Record<string,string> = {
  "Retinoid + exfoliating acid in the same slot":"These skin treatments may irritate together",
  "Tretinoin + benzoyl peroxide":"One acne treatment may weaken another",
  "Vitamin C + benzoyl peroxide":"This pairing may weaken vitamin C",
  "Multiple sources: Vitamin A":"Vitamin A adds up across your supplements",
  "Multiple sources: Vitamin D":"Vitamin D adds up across your supplements",
  "Multiple sources: Zinc":"Zinc adds up across your supplements",
  "Multiple sources: Iron":"Iron adds up across your supplements",
  "Iron + calcium":"Calcium may reduce how much iron you absorb",
  "Biotin and blood tests":"Biotin may affect blood test results",
  "St John's wort interactions":"This herb can interact with medicines",
  "Green tea extract: liver reports":"Concentrated green tea extract has liver concerns",
  "Ashwagandha: liver reports":"Ashwagandha has liver concerns",
  "Turmeric: liver reports":"Some turmeric supplements have liver concerns",
  "Melatonin context":"Long-term melatonin safety is uncertain",
  "Multiple possible caffeine sources":"Caffeine may add up across your supplements"
};
function isProduct(p:unknown): p is RoutineProduct {
  if(!p || typeof p!=="object") return false;
  const v=p as Record<string,unknown>;
  return typeof v.id==="string" && typeof v.name==="string" && typeof v.ingredientsText==="string" && ["skincare","supplement"].includes(String(v.type)) && ["am","pm","both"].includes(String(v.timeOfDay));
}
export default function RoutinePage() {
  const [products,setProducts]=useState<RoutineProduct[]>([]);
  const [grades,setGrades]=useState<ProofGrades>({});
  const [proofProgress,setProofProgress]=useState<ProofProgress|null>(null);
  const [proofStatus,setProofStatus]=useState<"idle"|"pending"|"success"|"error">("idle");
  const [proofError,setProofError]=useState("");
  const proofRunning=useRef(false);
  const shelfVersion=useRef(products);
  shelfVersion.current=products;
  async function checkProof() {
    if(proofRunning.current)return;
    proofRunning.current=true;
    const shelf=products;
    setProofStatus("pending");setProofError("");setProofProgress(null);setGrades({});
    try {
      const checked=await gradeShelf(shelf,progress=>{if(shelfVersion.current===shelf){setProofProgress(progress);setGrades(progress.grades);}});
      if(shelfVersion.current===shelf){setGrades(checked);setProofStatus("success");}
    } catch {if(shelfVersion.current===shelf){setProofError("Check incomplete; remaining spending stays ungraded.");setProofStatus("error");}}
    finally{proofRunning.current=false;if(shelfVersion.current!==shelf){setProofStatus("idle");setProofProgress(null);}}
  }
  const proof=useMemo(()=>proofSpend(products,grades),[products,grades]);
  const proofTotal=proof.backedMonthly+proof.unprovenMonthly+proof.ungradedMonthly;
  const [monthlyCost,setMonthlyCost]=useState("");
  const [savingSelections,setSavingSelections]=useState<Record<string,string>>({});
  const [trackedSavings,setTrackedSavings]=useState<Record<string,{productId:string;yearly:number}>>({});
  const [formOpen,setFormOpen]=useState(false);
  const [expandedProduct,setExpandedProduct]=useState<string|null>(null);
  const [expandedFinding,setExpandedFinding]=useState<string|null>(null);
  const [selectedTab,setSelectedTab]=useState<string|null>(null);
  const [ready,setReady]=useState(false);
  const [storageNote,setStorageNote]=useState("");
  const [name,setName]=useState(""); const [type,setType]=useState<RoutineProduct["type"]>("skincare");
  const [time,setTime]=useState<RoutineProduct["timeOfDay"]>("pm"); const [text,setText]=useState("");
  const [ocr,setOcr]=useState<{status:"idle"|"pending"|"success"|"error";message:string;progress:number}>({status:"idle",message:"",progress:0});
  const input=useRef<HTMLInputElement>(null); const lastFile=useRef<File|null>(null);
  // An empty shelf gets the example shelf once (a one-time marker, because older versions saved an empty shelf on every
  // visit). After that, a shelf the user cleared stays empty. Old demo entries take the current example names.
  useEffect(()=>{try {const saved=JSON.parse(localStorage.getItem("veto:routine")??"[]");const list=Array.isArray(saved)?saved.filter(isProduct):[];if(!list.length&&localStorage.getItem("veto:shelf-example")!=="1"){localStorage.setItem("veto:routine",JSON.stringify(demo));localStorage.setItem("veto:shelf-example","1");setProducts(demo);}else setProducts(list.map(p=>p.id.startsWith("demo-")?demo.find(d=>d.id===p.id)??p:p));}catch {setStorageNote("Saved shelf unreadable. Add products again.");}setReady(true);},[]);
  useEffect(()=>{if(ready)try{localStorage.setItem("veto:routine",JSON.stringify(products));}catch{setStorageNote("Shelf not saved. Checks still work this visit.");}},[products,ready]);
  const isDemoShelf=products.length===demo.length && demo.every(d=>products.some(p=>p.id===d.id && p.name===d.name && p.type===d.type && p.timeOfDay===d.timeOfDay && p.ingredientsText===d.ingredientsText));
  const result=useMemo(()=>analyzeRoutine(products),[products]);
  const spend=useMemo(()=>overlapSpend(products,result),[products,result]);
  const hasCosts=products.some(p=>typeof p.monthlyUsd==="number" && Number.isFinite(p.monthlyUsd) && p.monthlyUsd>=0);
  const actives=new Set(result.items.flatMap(p=>p.ingredients.filter(i=>i.canonicalId && ingredientById.get(i.canonicalId)?.kind!=="other").map(i=>i.canonicalId))).size;
  const cautionCount=result.warnings.filter(w=>w.severity==="caution").length;
  async function scan(file:File) {
    lastFile.current=file;setOcr({status:"pending",message:"Loading label reader…",progress:0});
    let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>>|undefined;
    try {
      const {createWorker}=await import("tesseract.js");
      worker=await createWorker("eng",1,{logger:m=>setOcr({status:"pending",message:m.status,progress:Math.round((m.progress??0)*100)})});
      const {data}=await worker.recognize(file);
      if(!data.text.trim()) throw new Error("No readable text found. Try a sharper, well-lit photo.");
      setText(data.text);setOcr({status:"success",message:"Label read. Review and correct the text before adding.",progress:100});
    }catch(error){setOcr({status:"error",message:error instanceof Error?error.message:"Label reader unavailable. Retry or paste the ingredients.",progress:0});}
    finally{if(worker)await worker.terminate().catch(()=>{});}
  }
  const tab=selectedTab??(cautionCount ? "questions" : "overlaps");
  const findings=[...result.duplicates.map((d,i)=>({id:`duplicate-${i}`,tab:"overlaps",caution:false,title:d.ingredient==="RETINOID"?"Repeated vitamin A skin ingredients":`Repeated ${d.ingredient.toLowerCase()}`,products:d.productNames,costProducts:products.filter(p=>d.productIds.includes(p.id)&&typeof p.monthlyUsd==="number"&&Number.isFinite(p.monthlyUsd)&&p.monthlyUsd>=0),meaning:"Shared ingredients do not establish harm; amounts and formulations remain unassessed.",action:"Ask a pharmacist or dermatologist before changing products.",source:{url:`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(d.ingredient+" ingredient review")}`,label:"Explore PubMed research"}})),...result.warnings.map((w,i)=>({id:`warning-${i}`,tab:w.severity==="caution"?"questions":"overlaps",caution:w.severity==="caution",title:warningHeadlines[w.title]??w.title,products:w.products,costProducts:[] as RoutineProduct[],meaning:w.explanation,action:"Ask a pharmacist or dermatologist to review these labels and medicines.",source:w.source}))];
  const tabs=[{id:"overlaps",label:`Overlaps (${findings.filter(f=>f.tab==="overlaps").length})`},{id:"questions",label:`Worth asking (${cautionCount})`},{id:"proof",label:"Price of proof"},{id:"map",label:"AM / PM map"},{id:"unknown",label:`Not recognised (${result.unrecognized.length})`}];
  return <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-burgundy">
    <Reveal className="relative mb-6">
      
      <h1 className="display mt-2 text-5xl sm:text-6xl">Your shelf</h1>
      <p className="max-w-[65ch] mt-4 max-w-xl text-lg text-muted">Products you use, decoded.</p>
      {!!products.length && <button className={formOpen ? "btn-ghost mt-5" : "btn-primary mt-5"} onClick={()=>{setFormOpen(true);requestAnimationFrame(()=>document.getElementById("product-name")?.focus());}}>Add a product <Plus size={20}/></button>}

    </Reveal>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <Reveal className="border-y border-line py-5 lg:pr-6 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-auto">
        <div className="flex items-center justify-between gap-2"><h2 className="text-xl font-semibold">Your shelf</h2><button className="btn-ghost min-h-11 !px-3" aria-expanded={formOpen||!products.length} aria-controls="add-product-form" onClick={()=>setFormOpen(v=>!v)}><Plus size={20}/> Add a product</button></div>
        <AnimatePresence initial={false}>{(formOpen||!products.length)&&<motion.div id="add-product-form" key="form" initial={false} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0}} className="overflow-hidden"><div className="py-4">
        <form className="space-y-5" onSubmit={e=>{e.preventDefault();setProducts(p=>[...p,{id:crypto.randomUUID(),name:name.trim(),type,timeOfDay:time,ingredientsText:text.trim(),...(monthlyCost!==""?{monthlyUsd:Number(monthlyCost)}:{})}]);setFormOpen(false);setName("");setMonthlyCost("");setText("");setOcr({status:"idle",message:"",progress:0});}}>
          <div><label htmlFor="product-name" className="mb-2 block text-base">Product name</label><input id="product-name" className="field" required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Your serum, daily multi…" /></div>
          <div><label htmlFor="monthly-cost" className="mb-2 block text-base">Monthly cost ($) <span className="text-muted">(optional)</span></label><input id="monthly-cost" type="number" min="0" max="10000" step="0.01" inputMode="decimal" className="field" value={monthlyCost} onChange={e=>setMonthlyCost(e.target.value)} placeholder="28" /></div>
          <fieldset><legend className="mb-2 text-base">Product type</legend><div className="flex gap-2">{(["skincare","supplement"] as const).map(v=><button type="button" aria-pressed={type===v} key={v} className={`chip-lg !text-base capitalize ${type===v?"!border-rose !bg-blush-pale !text-burgundy":""}`} onClick={()=>setType(v)}>{v}</button>)}</div></fieldset>
          <fieldset><legend className="mb-2 text-base">When do you use it?</legend><div className="flex gap-2">{(["am","pm","both"] as const).map(v=><button type="button" aria-pressed={time===v} key={v} className={`btn-ghost min-h-11 flex-1 !px-3 uppercase ${time===v?"!border-rose !bg-blush-pale !text-burgundy":""}`} onClick={()=>setTime(v)}>{v}</button>)}</div></fieldset>
          <div><div className="mb-2 flex items-center justify-between gap-2"><label htmlFor="ingredients" className="text-base">Ingredients</label><button type="button" className="chip-lg !text-base" disabled={ocr.status==="pending"} onClick={()=>input.current?.click()}><ScanLine size={20} strokeWidth={1.75}/> Scan label</button></div>
            <input ref={input} aria-label="Upload ingredient label" className="sr-only" type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)void scan(file);e.target.value="";}}/>
            <textarea id="ingredients" className="field min-h-40 resize-y" required value={text} onChange={e=>setText(e.target.value)} placeholder="Retinol 0.2%, niacinamide…" />
            <p className="max-w-[65ch] mt-2 text-base text-muted">Separate ingredients with commas; keep printed amounts.</p>
          </div>
          <div aria-live="polite" className="text-base text-muted">{ocr.message}{ocr.status==="pending" && <progress className="mt-2 w-full accent-burgundy" value={ocr.progress} max={100}/ >}{ocr.status==="error" && <button type="button" className="btn-ghost mt-2" onClick={()=>{if(lastFile.current)void scan(lastFile.current);}}>Retry scan</button>}</div>
          <button disabled={!name.trim()||!text.trim()||ocr.status==="pending"||!ready} className="btn-primary w-full"><Plus size={20}/> Add a product</button>
        </form>
        </div></motion.div>}</AnimatePresence>
        <div className="mt-3 divide-y divide-line"><AnimatePresence initial={false}>{result.items.map(({product,ingredients})=><motion.article key={product.id} layout={false} initial={false} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0}}>
          <div className="flex items-center gap-1 py-2"><button className="min-h-11 min-w-0 flex-1 text-left" aria-expanded={expandedProduct===product.id} aria-controls={`product-${product.id}`} onClick={()=>setExpandedProduct(v=>v===product.id?null:product.id)}><span className="block break-words text-base font-semibold">{product.name}</span><span className="mt-1 flex flex-wrap items-center gap-2"><span className="text-base capitalize text-muted">{product.type}</span>{typeof product.monthlyUsd==="number"&&Number.isFinite(product.monthlyUsd)&&product.monthlyUsd>=0&&<span className="text-base tabular-nums text-muted">{usd(product.monthlyUsd)}/mo</span>}<span className="chip !text-base uppercase">{product.timeOfDay}</span><span className="text-base text-muted">{ingredients.filter(i=>i.canonicalId&&ingredientById.get(i.canonicalId)?.kind!=="other").length} actives</span><ChevronDown size={20}/></span></button><button className="flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-subtle" aria-label={`Remove ${product.name}`} onClick={()=>setProducts(p=>p.filter(x=>x.id!==product.id))}><X size={20}/></button></div>
          <AnimatePresence initial={false}>{expandedProduct===product.id&&<motion.div id={`product-${product.id}`} initial={false} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0}} className="overflow-hidden"><div className="pb-3">
          <div className="mt-4 flex flex-wrap gap-2">{ingredients.map((item,i)=>{const ing=item.canonicalId?ingredientById.get(item.canonicalId):null;return <details key={i} className="group max-w-full"><summary className={`chip !text-base min-h-11 cursor-pointer max-w-full break-words focus-visible:outline-2 focus-visible:outline-burgundy ${!ing?"!border-dashed !text-fg":ing.kind!=="other"?"!border-fg/40 !text-fg":"!bg-subtle !text-muted"}`}>{ing?.name??item.raw}{item.concentration && ing?` · ${item.concentration}`:""}<Info size={20} className="ml-1 inline"/><span className="sr-only">. ingredient explanation</span></summary><p className="max-w-[65ch] mt-2 max-w-64 border-t border-line py-3 text-base text-muted">{ing ? `${ing.name}. ${ing.plain}` : "Unrecognised; not assessed. Check spelling or ask a pharmacist."}</p></details>;})}</div>
          </div></motion.div>}</AnimatePresence>
        </motion.article>)}</AnimatePresence></div>
        {!isDemoShelf && <button className="btn-ghost mt-3 w-full" disabled={!ready} onClick={()=>setProducts(p=>[...p.filter(x=>!x.id.startsWith("demo-")),...demo])}>Load example shelf</button>}
        {isDemoShelf && <div className="mt-3 flex flex-wrap items-center gap-3"><span className="chip">Example shelf</span><button type="button" className="btn-ghost" onClick={()=>{if(confirm("Clear the example shelf and add your own products?"))setProducts([]);}}>Clear and add mine</button></div>}
        <p className="max-w-[65ch] mt-3 text-base text-muted">No sign-up. Your ledger stays on this device.</p>
        {storageNote && <p role="status" className="mt-3 text-base text-muted">{storageNote}</p>}

      </Reveal>
      <div className="min-w-0 space-y-4">
        {!!products.length && <Reveal className="border-t border-line py-5"><h2 className="display text-3xl" role="status">{result.duplicates.length} overlaps · {cautionCount} cautions</h2><p className="mt-2 text-base text-muted">Labels only; amounts, formulations and individual risk remain unassessed.</p></Reveal>}

        {!!products.length && <Reveal className="flex flex-wrap gap-x-5 gap-y-2 border-y border-line py-3">{[["Products",products.length],["Actives",actives],["Duplicates",result.duplicates.length],["Cautions",cautionCount]].map(([label,value])=><div key={label} className="flex items-baseline gap-2"><p className="max-w-[65ch] text-base text-muted">{label}</p><motion.p key={value} initial={false} animate={{opacity:1}} transition={{duration:0}} className="font-semibold tabular-nums">{value}</motion.p></div>)}<p className="text-base tabular-nums">Shelf cost: {hasCosts?`${usd(spend.shelfMonthly)}/mo`:"add costs to see"}</p><p className="text-base tabular-nums">In overlaps: {hasCosts?`${usd(spend.overlapMonthly)}/mo`:"add costs to see"}</p>{hasCosts&&Object.keys(grades).length>0&&<p className="text-base tabular-nums">Backed by evidence: {usd(proof.backedMonthly)}/mo · Unproven: {usd(proof.unprovenMonthly)}/mo</p>}</Reveal>}
        {!products.length&&<Reveal className="rounded-[10px] border border-line bg-subtle p-6 sm:p-8"><p className="max-w-[65ch] display text-3xl">Meet your shelf.</p><p className="max-w-[65ch] mt-2 text-base text-muted">Add products to check overlapping ingredients and spending.</p><div className="mt-3 flex flex-wrap gap-2"><button className="btn-ghost min-h-11" disabled={!ready} onClick={()=>setProducts(demo)}>Load example shelf</button><button className="btn-ghost min-h-11" onClick={()=>document.getElementById("product-name")?.focus()}>Add product</button></div></Reveal>}
        {!!products.length&&<Reveal>
          <div role="tablist" aria-label="Shelf results" onKeyDown={e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const index=tabs.findIndex(t=>t.id===tab);const next=e.key==="Home"?0:e.key==="End"?tabs.length-1:(index+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;setSelectedTab(tabs[next].id);setExpandedFinding(null);document.getElementById(`tab-${tabs[next].id}`)?.focus();}} className="flex flex-wrap gap-1 border-y border-line py-2">{tabs.map(t=><button key={t.id} id={`tab-${t.id}`} role="tab" tabIndex={tab===t.id?0:-1} aria-selected={tab===t.id} aria-controls={`panel-${t.id}`} onClick={()=>{setSelectedTab(t.id);setExpandedFinding(null);}} className="relative isolate min-h-11 shrink-0 rounded-md px-3 text-base"><span className={tab===t.id?"text-burgundy":"text-fg"}>{t.label}</span>{tab===t.id&&<motion.span className="absolute inset-0 -z-10 rounded-md bg-blush-pale" transition={{duration:0}}/>}</button>)}</div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-3 divide-y divide-line border-y border-line">
            {(tab==="overlaps"||tab==="questions")&&<>{findings.filter(f=>f.tab===tab).map(f=><div key={f.id} className="overflow-hidden bg-surface"><button aria-expanded={expandedFinding===f.id} aria-controls={`finding-${f.id}`} onClick={()=>setExpandedFinding(v=>v===f.id?null:f.id)} className="flex min-h-16 w-full items-center gap-2 px-3 py-2 text-left"><span className={`shrink-0 text-sm font-medium ${f.caution?"text-warning":"text-muted"}`}>{f.caution?"Caution":"Info"}</span><span className="min-w-0 flex-1"><span className="block text-base font-semibold" title={f.title}>{f.title}</span><span className="mt-1 flex gap-1 overflow-hidden">{f.products.map((name,i)=><span key={`${name}-${i}`} className="max-w-32 shrink truncate rounded-md border border-line px-2 text-base text-muted" title={name}>{name}</span>)}</span></span><span className="sr-only">{f.caution?"Worth asking":"Info"}</span><ChevronDown size={20} className={`shrink-0 transition-transform duration-200 ${expandedFinding===f.id?"rotate-180":""}`}/></button>
              <AnimatePresence initial={false}>{expandedFinding===f.id&&<motion.div id={`finding-${f.id}`} initial={false} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0}} className="overflow-hidden"><div className="space-y-3 border-t border-line p-4 text-base text-muted"><p>{f.action}</p><details><summary className="min-h-11 cursor-pointer">Details</summary><p>{f.meaning}</p></details>{f.id.startsWith("duplicate-")&&<div className="border-t border-line pt-3"><label htmlFor={`saving-${f.id}`} className="block text-base">Thinking of dropping one?</label><div className="mt-2 flex flex-wrap gap-2"><select id={`saving-${f.id}`} className="field min-w-0 flex-1" disabled={!f.costProducts.length} value={f.costProducts.find(p=>p.id===savingSelections[f.id])?.id??f.costProducts[0]?.id??""} onChange={e=>setSavingSelections(previous=>({...previous,[f.id]:e.target.value}))}>{!f.costProducts.length&&<option value="">Add product costs</option>}{f.costProducts.map(p=><option key={p.id} value={p.id}>{p.name} · {usd(p.monthlyUsd!)}/mo</option>)}</select><button type="button" className="btn-ghost" disabled={!f.costProducts.length} onClick={()=>{const product=f.costProducts.find(p=>p.id===savingSelections[f.id])??f.costProducts[0];if(!product)return;const entry=addSaving({source:"routine",label:product.name,monthly_usd:product.monthlyUsd!});setTrackedSavings(previous=>({...previous,[f.id]:{productId:product.id,yearly:entry.monthly_usd*12}}));}}>Track the saving</button></div>{trackedSavings[f.id]&&f.costProducts.some(p=>p.id===trackedSavings[f.id].productId)&&<p role="status" className="mt-2 text-base">{usd(trackedSavings[f.id].yearly)}/yr kept · <a href="/ledger" className="inline-flex min-h-11 items-center underline">Open Ledger</a></p>}</div>}<a className="inline-flex min-h-11 items-center gap-1 underline underline-offset-4" href={f.source.url} target="_blank" rel="noreferrer">{f.source.label}<ArrowUpRight size={20}/></a></div></motion.div>}</AnimatePresence>
            </div>)}{!findings.some(f=>f.tab===tab)&&<p className="max-w-[65ch] border-t border-line py-5 text-base text-muted">No {tab==="questions"?"things worth asking about":"overlaps"} flagged by these rules. Individual risk remains unassessed.</p>}</>}
            {tab==="proof"&&<div className="space-y-4 py-4">
              <h2 className="display text-3xl">Price of proof</h2>
              <p className="text-base text-muted">Ingredient evidence from your checks.</p>
              {!hasCosts&&<p className="text-base text-muted">Add monthly product costs to see spending by evidence.</p>}
              {!proof.perIngredient.length&&<p className="text-base text-muted">No recognised active claims to check.</p>}
              <button type="button" className="btn-ghost min-h-11" disabled={proofStatus==="pending"||!proof.perIngredient.length} onClick={()=>void checkProof()}>{proofStatus==="pending"?"Checking shelf…":proofStatus==="error"?"Retry grading":"Grade my shelf"}</button>
              <div aria-live="polite">
                {proofStatus==="pending"&&proofProgress&&<><p className="break-words text-base">Checking {proofProgress.current} of {proofProgress.total}: {proofProgress.claim.replace(/\.$/,"")}…</p><progress aria-label="Shelf evidence checks" className="mt-2 w-full accent-burgundy" max={proofProgress.total} value={Object.keys(proofProgress.grades).length}/></>}
                {proofStatus==="error"&&<p role="alert" className="text-base text-danger">{proofError}</p>}
                {proofStatus==="success"&&<p className="text-base text-muted">Checks complete; results saved on this device when available.</p>}
              </div>
              {hasCosts&&<>
                <div role="img" aria-label={`Monthly spending: backed ${usd(proof.backedMonthly)}, unproven ${usd(proof.unprovenMonthly)}, ungraded ${usd(proof.ungradedMonthly)}`} className="flex h-6 overflow-hidden rounded-md bg-subtle">
                  {proofTotal>0&&[[proof.backedMonthly,"bg-success"],[proof.unprovenMonthly,"bg-danger"],[proof.ungradedMonthly,"bg-muted"]].map(([amount,color])=><span key={String(color)} className={String(color)} style={{width:`${Number(amount)/proofTotal*100}%`}}/>)}
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-2 text-base tabular-nums"><li>Backed: {usd(proof.backedMonthly)}/mo</li><li>Unproven: {usd(proof.unprovenMonthly)}/mo</li><li>Ungraded: {usd(proof.ungradedMonthly)}/mo</li></ul>
              </>}
              {!!proof.perIngredient.length&&<div className="overflow-x-auto"><table className="w-full text-left text-base"><caption className="sr-only">Monthly ingredient spending from your checks</caption><thead><tr className="border-b border-line">{["Ingredient","Claim","Verdict","$/mo share","Report"].map(label=><th key={label} scope="col" className="p-2 font-medium">{label}</th>)}</tr></thead><tbody>{proof.perIngredient.map(row=><tr key={row.ingredient} className="border-b border-line align-top"><th scope="row" className="p-2 font-medium">{row.ingredient}</th><td className="min-w-44 p-2"><details><summary className="min-h-11 cursor-pointer">{row.claim}</summary>{grades[row.claim]&&<p className="mt-2 text-muted">{grades[row.claim].bottom_line}</p>}</details></td><td className="p-2"><span className="chip" style={row.verdict?{color:VERDICTS[row.verdict].color}:undefined}>{row.verdict?VERDICTS[row.verdict].label:"Ungraded"}</span></td><td className="p-2 tabular-nums">{usd(row.monthlyShare)}</td><td className="p-2"><a className="inline-flex min-h-11 items-center text-rose underline" href={`/check?q=${encodeURIComponent(row.claim)}&run=1`}>Open report</a></td></tr>)}</tbody></table></div>}
              <p className="text-base text-muted">Evidence for the ingredient's common claim, not for your exact product or dose.</p>
              <details className="text-base text-muted"><summary className="min-h-11 cursor-pointer">How spending is split</summary><p>Each product’s cost is split equally across recognised actives, including ungraded claims.</p><p className="mt-2">Backed includes partial support; unproven includes insufficient, misleading, and contradicted evidence.</p><p className="mt-2">Checks reuse seven-day results; incomplete checks remain ungraded.</p></details>
            </div>}
            {tab==="map"&&<div className="py-4"><h2 className="mb-3 text-lg">Your AM / PM map</h2><div className="grid grid-cols-2 gap-4">{(["am","pm"] as const).map(slot=><div key={slot} className="min-w-0 border-l border-fg/40 pl-3"><h3 className="flex items-center gap-2 text-lg text-fg">{slot==="am"?<Sun size={20}/>:<Moon size={20}/>} {slot==="am"?"AM · Morning":"PM · Evening"}</h3><div className="mt-3 space-y-3">{result.items.filter(x=>x.product.timeOfDay===slot||x.product.timeOfDay==="both").map(({product,ingredients})=><div key={product.id} className="border-t border-line py-3"><p className="max-w-[65ch] break-words text-base">{product.name}</p><p className="max-w-[65ch] mt-1 break-words text-base text-muted">{ingredients.flatMap(i=>{const ing=i.canonicalId?ingredientById.get(i.canonicalId):null;return ing&&ing.kind!=="other"?[ing.name]:[];}).join(" · ")||"No recognised actives"}</p></div>)}{!result.items.some(x=>x.product.timeOfDay===slot||x.product.timeOfDay==="both")&&<p className="max-w-[65ch] text-base text-muted">No products added here.</p>}</div></div>)}</div></div>}
            {tab==="unknown"&&<div className="py-4"><h2 className="text-lg">Unrecognised. not assessed</h2><p className="max-w-[65ch] mt-3 break-words text-base text-muted">{result.unrecognized.map(i=>`${i.productName}: ${i.raw}`).join(" · ")||"No unrecognised ingredients on this shelf."}</p></div>}
          </div>
        </Reveal>}
      </div>
    </div>
    <Reveal className="mt-6 max-w-3xl border-t border-line pt-4 text-base text-muted"><a href="/care" className="inline-flex min-h-11 items-center text-rose underline">Ask a pharmacist in Care</a><p>Educational only. Not medical advice.</p></Reveal>
  </section>;
}
