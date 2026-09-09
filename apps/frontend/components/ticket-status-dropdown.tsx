"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@support-hub/ui";
import { TicketStatus, ticketStatusOptions } from "@/lib/ticket-status";

export const StatusDropdown = ({ value, onChange }: { value: TicketStatus; onChange: (status: TicketStatus) => void }) => {
  const [open, setOpen] = useState(false);
  const selected = ticketStatusOptions.find((status) => status.value === value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-9 w-full justify-between gap-2 border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm hover:bg-slate-50"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </Button>
      {open && (
        <div role="menu" className="absolute left-0 top-10 z-50 w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          {ticketStatusOptions.map((status) => (
            <button
              key={status.value}
              type="button"
              role="menuitem"
              className="flex h-8 w-full items-center justify-between rounded px-2 text-left text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800"
              onClick={() => {
                setOpen(false);
                if (status.value !== value) onChange(status.value);
              }}
            >
              {status.label}
              {status.value === value ? <Check size={13} /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
