"use client";
import { useState } from "react";
import { Button } from "@support-hub/ui";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative group bg-slate-950 text-slate-200 p-4 rounded-md overflow-x-auto text-xs leading-relaxed font-mono">
      <Button variant="ghost" size="none"
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
      </Button>
      <pre><code>{code}</code></pre>
    </div>
  );
}
