"use client";

import { Check, ChevronDown } from "lucide-react";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@support-hub/ui";
import { TicketStatus, ticketStatusOptions } from "@/lib/ticket-status";

export const StatusDropdown = ({ value, onChange }: { value: TicketStatus; onChange: (status: TicketStatus) => void }) => {
  const selected = ticketStatusOptions.find((status) => status.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          className="group h-9 w-full justify-between gap-2 border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <span className="truncate">{selected?.label ?? value}</span>
          <ChevronDown size={14} className="transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {ticketStatusOptions.map((status) => (
          <DropdownMenuItem
            key={status.value}
            className="rounded text-slate-700 hover:bg-blue-50 hover:text-blue-800"
            onSelect={() => {
              if (status.value !== value) onChange(status.value);
            }}
          >
            {status.label}
            {status.value === value ? <Check size={13} /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
