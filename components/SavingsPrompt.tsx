"use client";
import { useState } from "react";
import Link from "next/link";
import { addSaving, usd } from "@/lib/savings";

/** Shown under a verdict: lets the user log a purchase they decided to skip. */
export default function SavingsPrompt({ label }: { label: string }) {
  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState<number | null>(null);
  const value = Number(amount);

  if (saved !== null) {
    return (
      <p className="text-base">
        <b className="text-success">{usd(saved * 12)} a year kept.</b>{" "}
        <Link href="/ledger" className="text-rose underline">See your total</Link>
      </p>
    );
  }
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => { e.preventDefault(); if (value > 0) { addSaving({ source: "claim", label, monthly_usd: value }); setSaved(value); } }}
    >
      <label className="flex-1">
        <span className="mb-1.5 block text-sm font-medium">Skipping a purchase because of this? Monthly cost</span>
        <span className="relative block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
          <input inputMode="decimal" type="number" min="1" max="10000" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="40" className="field !pl-8" />
        </span>
      </label>
      <button disabled={!(value > 0)} className="btn-primary">I&apos;ll skip it</button>
    </form>
  );
}
