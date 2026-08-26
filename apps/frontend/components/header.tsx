"use client";
import { Bell, Clock3, HelpCircle, Menu, Search } from "lucide-react";
import { Button, Input } from "@central-support/ui";
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
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" size={15} />
        <Input className="h-9 border-none bg-input pl-9 text-xs shadow-none" placeholder="Search..." />
      </div>

      <div className="flex items-center gap-4 text-primary-light">
        <Button className="h-8 w-8 border-0 bg-transparent px-0 text-primary-light shadow-none hover:text-brand">
          <Bell size={17} />
        </Button>
        <Button className="h-8 w-8 border-0 bg-transparent px-0 text-primary-light shadow-none hover:text-brand">
          <Clock3 size={17} />
        </Button>
        <Button className="h-8 w-8 border-0 bg-transparent px-0 text-primary-light shadow-none hover:text-brand">
          <HelpCircle size={17} />
        </Button>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-2xs font-bold text-brand">
          US
        </span>
      </div>
    </header>
  );
}
