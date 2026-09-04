"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@support-hub/ui";

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative group bg-slate-950 text-slate-200 p-4 rounded-md overflow-x-auto text-xs leading-relaxed font-mono">
      <button
        type="button"
        className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        title="Copy code"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export function TabButton({ children, active, onClick, icon }: any) {
  return (
    <Button
      onClick={onClick}
      className={`h-auto rounded-none border-0 border-b-2 bg-transparent px-4 py-2 text-sm font-medium shadow-none transition-colors whitespace-nowrap ${
        active 
          ? "border-teal-600 text-teal-700" 
          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
      }`}
    >
      {icon}
      {children}
    </Button>
  );
}
