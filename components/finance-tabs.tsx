"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function FinanceTabs({
  accounting,
  charges
}: {
  accounting: React.ReactNode;
  charges: React.ReactNode;
}) {
  const [tab, setTab] = useState<"accounting" | "charges">("accounting");

  return (
    <div className="mt-6">
      <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-semibold transition",
            tab === "accounting" ? "bg-field-600 text-white" : "text-slate-700 hover:bg-slate-50"
          )}
          onClick={() => setTab("accounting")}
        >
          Receita e despesa
        </button>
        <button
          type="button"
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-semibold transition",
            tab === "charges" ? "bg-field-600 text-white" : "text-slate-700 hover:bg-slate-50"
          )}
          onClick={() => setTab("charges")}
        >
          Cobranças e pagamentos
        </button>
      </div>

      <div className={tab === "accounting" ? "block" : "hidden"}>{accounting}</div>
      <div className={tab === "charges" ? "block" : "hidden"}>{charges}</div>
    </div>
  );
}
