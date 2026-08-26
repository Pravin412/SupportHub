"use client";
import { Menu, Search } from "lucide-react";
import { Button, Input } from "@support-hub/ui";
import { useUiStore } from "../lib/store";
import { useProjects } from "../lib/queries";

export function Header() {
  const ui = useUiStore();
  const projects = useProjects(true); // Wait, this needs auth? Let's assume auth is handled at layout

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-6 border-b border-border bg-white px-4">
      <Button className="h-9 w-9 px-0 md:hidden" onClick={() => ui.setSidebar(true)}>
        <Menu size={18} />
      </Button>
      <div className="relative ml-auto w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" size={15} />
        <Input className="h-9 border-none bg-input pl-9 text-xs shadow-none" placeholder="Search..." />
      </div>
    </header>
  );
}
