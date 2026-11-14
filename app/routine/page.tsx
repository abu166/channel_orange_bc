"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ScanLine, Plus, X, ArrowUpRight } from "lucide-react";
import { Reveal, SectionTitle } from "@/components/ui";
import { analyzeRoutine, ingredientById, type RoutineProduct } from "@/lib/ingredients";

const demo: RoutineProduct[] = [
  {id:"demo-1",name:"Synthetic / Night serum",type:"skincare",timeOfDay:"pm",ingredientsText:"Retinol 0.2%, niacinamide, water"},
  {id:"demo-2",name:"Synthetic / Renewal cream",type:"skincare",timeOfDay:"pm",ingredientsText:"Retinal 0.05%, glycolic acid 5%, niacinamide"},
  {id:"demo-3",name:"Synthetic / Daily multi",type:"supplement",timeOfDay:"am",ingredientsText:"Vitamin D3, zinc gluconate, biotin, iron"},
  {id:"demo-4",name:"Synthetic / Daily blend",type:"supplement",timeOfDay:"am",ingredientsText:"Cholecalciferol, zinc picolinate, calcium citrate, green tea extract, guarana"}
];
function isProduct(p:unknown): p is RoutineProduct {
  if(!p || typeof p!=="object") return false;
  const v=p as Record<string,unknown>;
  return typeof v.id==="string" && typeof v.name==="string" && typeof v.ingredientsText==="string" && ["skincare","supplement"].includes(String(v.type)) && ["am","pm","both"].includes(String(v.timeOfDay));
}
export default function RoutinePage() {
  const [products,setProducts]=useState<RoutineProduct[]>([]);
  const [ready,setReady]=useState(false);
  const [storageNote,setStorageNote]=useState("");
  const [name,setName]=useState(""); const [type,setType]=useState<RoutineProduct["type"]>("skincare");
  const [time,setTime]=useState<RoutineProduct["timeOfDay"]>("pm"); const [text,setText]=useState("");
  const [ocr,setOcr]=useState<{status:"idle"|"pending"|"success"|"error";message:string;progress:number}>({status:"idle",message:"",progress:0});
  const input=useRef<HTMLInputElement>(null); const lastFile=useRef<File|null>(null);
  const reduced=useReducedMotion();
  useEffect(()=>{try {const saved=JSON.parse(localStorage.getItem("veto:routine")??"[]");if(Array.isArray(saved)) setProducts(saved.filter(isProduct));}catch {setStorageNote("Saved shelf could not be read. You can still check a new shelf.");}setReady(true);},[]);
  useEffect(()=>{if(ready)try{localStorage.setItem("veto:routine",JSON.stringify(products));}catch{setStorageNote("This browser could not save your shelf. Checks still work for this visit.");}},[products,ready]);
  const result=useMemo(()=>analyzeRoutine(products),[products]);
  const actives=new Set(result.items.flatMap(p=>p.ingredients.filter(i=>i.canonicalId && ingredientById.get(i.canonicalId)?.kind!=="other").map(i=>i.canonicalId))).size;
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
  return <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-96 grid-bg" />
    <SectionTitle eyebrow="02 / Routine check" title={<>Your shelf, <em className="text-signal">decoded.</em></>} sub="One shelf. A clearer picture of what overlaps. Check skincare actives and supplement labels, together." />
    <div className="grid items-start gap-8 lg:grid-cols-[360px_1fr]">
      <Reveal className="card p-5 sm:p-7">
        <p className="eyebrow mb-6">01 / Add to your shelf</p>
        <form className="space-y-5" onSubmit={e=>{e.preventDefault();setProducts(p=>[...p,{id:crypto.randomUUID(),name:name.trim(),type,timeOfDay:time,ingredientsText:text.trim()}]);setName("");setText("");setOcr({status:"idle",message:"",progress:0});}}>
          <div><label htmlFor="product-name" className="mb-2 block text-sm">Product name</label><input id="product-name" className="field" required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Your serum, daily multi…" /></div>
          <fieldset><legend className="mb-2 text-sm">Product type</legend><div className="flex gap-2">{(["skincare","supplement"] as const).map(v=><button type="button" aria-pressed={type===v} key={v} className={`chip capitalize ${type===v?"!bg-bone !text-ink":""}`} onClick={()=>setType(v)}>{v}</button>)}</div></fieldset>
          <fieldset><legend className="mb-2 text-sm">When do you use it?</legend><div className="flex gap-2">{(["am","pm","both"] as const).map(v=><button type="button" aria-pressed={time===v} key={v} className={`btn-ghost flex-1 !px-3 !py-2 uppercase ${time===v?"!border-signal !text-signal":""}`} onClick={()=>setTime(v)}>{v}</button>)}</div></fieldset>
          <div><div className="mb-2 flex items-center justify-between gap-2"><label htmlFor="ingredients" className="text-sm">Ingredients</label><button type="button" className="chip" disabled={ocr.status==="pending"} onClick={()=>input.current?.click()}><ScanLine size={16} strokeWidth={1.75}/> Scan label</button></div>
            <input ref={input} aria-label="Upload ingredient label" className="sr-only" type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)void scan(file);e.target.value="";}}/>
            <textarea id="ingredients" className="field min-h-40 resize-y" required value={text} onChange={e=>setText(e.target.value)} placeholder="Retinol 0.2%, niacinamide…" />
            <p className="mt-2 text-xs text-mute">Separate with commas, new lines or semicolons. Keep any amounts printed on your label.</p>
          </div>
          <div aria-live="polite" className="text-sm text-mute">{ocr.message}{ocr.status==="pending" && <progress className="mt-2 w-full accent-signal" value={ocr.progress} max={100}/ >}{ocr.status==="error" && <button type="button" className="btn-ghost mt-2" onClick={()=>{if(lastFile.current)void scan(lastFile.current);}}>Retry scan</button>}</div>
          <button disabled={!name.trim()||!text.trim()||ocr.status==="pending"||!ready} className="btn-primary w-full"><Plus size={16}/> Add product</button>
        </form>
        <button className="btn-ghost mt-3 w-full" disabled={!ready} onClick={()=>setProducts(p=>[...p.filter(x=>!x.id.startsWith("demo-")),...demo])}>Load demo shelf</button>
        <p className="mt-3 text-xs text-mute">Demo products are synthetic. Your shelf is saved in this browser.</p>
        {storageNote && <p role="status" className="mt-3 text-sm text-mute">{storageNote}</p>}
      </Reveal>
      <div className="min-w-0 space-y-6">
        <Reveal delay={0.08} className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Products",products.length],["Actives",actives],["Duplicates",result.duplicates.length],["Cautions",result.warnings.filter(w=>w.severity==="caution").length]].map(([label,value])=><div key={label} className="card p-4"><p className="eyebrow !tracking-wider">{label}</p><AnimatePresence mode="wait"><motion.p key={value} initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}} className="mt-3 font-mono text-3xl">{value}</motion.p></AnimatePresence></div>)}</Reveal>
        {!products.length && <Reveal className="card p-8"><p className="font-serif text-3xl">Meet your shelf.</p><p className="mt-3 text-mute">Add your first product, or explore the synthetic demo. We’ll make the overlaps visible.</p></Reveal>}
        <Reveal delay={0.16}><div className="space-y-3"><AnimatePresence initial={false}>{result.items.map(({product,ingredients})=><motion.article layout={!reduced} key={product.id} initial={reduced?false:{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.96}} transition={{type:"spring",stiffness:400,damping:30}} className="card p-5">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="eyebrow">{product.type} / {product.timeOfDay}</p><h3 className="mt-2 break-words text-xl">{product.name}</h3></div><button className="btn-ghost !p-2" aria-label={`Remove ${product.name}`} onClick={()=>setProducts(p=>p.filter(x=>x.id!==product.id))}><X size={16}/></button></div>
          <div className="mt-4 flex flex-wrap gap-2">{ingredients.map((item,i)=>{const ing=item.canonicalId?ingredientById.get(item.canonicalId):null;return <span key={i} title={ing?item.raw:"unrecognised — not assessed"} className={`chip max-w-full break-words ${!ing?"!border-dashed !text-mute":ing.kind!=="other"?"!border-signal/50 !text-bone":"!bg-bone !text-ink"}`}>{ing?.name??item.raw}{item.concentration && ing?` · ${item.concentration}`:""}{!ing && <span className="sr-only"> — not assessed</span>}</span>;})}</div>
        </motion.article>)}</AnimatePresence></div></Reveal>
        {!!products.length && <>
          <Reveal className="card p-5"><p className="eyebrow mb-4">Your AM / PM map</p><div className="grid grid-cols-2 gap-4">{(["am","pm"] as const).map(slot=><div key={slot} className="min-w-0 border-l border-signal/40 pl-3"><h3 className="font-mono uppercase text-signal">{slot}</h3><div className="mt-3 space-y-3">{result.items.filter(x=>x.product.timeOfDay===slot||x.product.timeOfDay==="both").map(({product,ingredients})=><div key={product.id}><p className="break-words text-sm">{product.name}</p><p className="mt-1 break-words text-xs text-mute">{ingredients.flatMap(i=>{const ing=i.canonicalId?ingredientById.get(i.canonicalId):null;return ing&&ing.kind!=="other"?[ing.name]:[];}).join(" · ")||"No recognised actives"}</p></div>)}</div></div>)}</div></Reveal>
          <Reveal><p className="eyebrow mb-4">02 / Overlaps & context</p><div className="space-y-3">{result.duplicates.map((d,i)=><div className="card p-5" key={i}><span className="eyebrow text-signal">Duplicate / {d.ingredient}</span><p className="mt-2 text-sm">{d.productNames.join(" + ")}</p><p className="mt-2 text-sm text-mute">{d.explanation}</p></div>)}{result.warnings.map((w,i)=><div className="card p-5" key={i}><p className={`eyebrow ${w.severity==="caution"?"!text-partial":""}`}>{w.severity}</p><h3 className="mt-2 text-lg">{w.title}</h3><p className="mt-2 text-sm text-mute">{w.explanation}</p><p className="mt-3 break-words text-xs text-mute">{w.products.join(" · ")}</p><a className="mt-3 inline-flex items-center gap-1 text-sm text-bone underline underline-offset-4" href={w.source.url} target="_blank" rel="noreferrer">{w.source.label}<ArrowUpRight size={16}/></a></div>)}{!result.duplicates.length&&!result.warnings.length&&<p className="card p-5 text-mute">No overlaps flagged by these rules. This is not a safety clearance.</p>}</div></Reveal>
          {!!result.unrecognized.length && <Reveal className="card p-5"><p className="eyebrow">Unrecognised — not assessed</p><p className="mt-3 break-words text-sm text-mute">{result.unrecognized.map(i=>`${i.productName}: ${i.raw}`).join(" · ")}</p></Reveal>}
        </>}
      </div>
    </div>
    <Reveal className="mt-12 max-w-3xl border-t border-line pt-6 text-sm text-mute">Educational only. This checker does not assess full formulations, total intake, medical conditions or medication interactions comprehensively. Missing amounts stay unknown. Ask a pharmacist or dermatologist about flagged combinations.</Reveal>
  </section>;
}
