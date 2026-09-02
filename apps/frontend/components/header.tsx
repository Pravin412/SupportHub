"use client";
import { useState, useRef, useEffect } from "react";
import { Menu, Search, Loader2, Folder, Ticket, User, MessageSquare } from "lucide-react";
import { Button, Input } from "@support-hub/ui";
import { useUiStore } from "../lib/store";
import { useGlobalSearch } from "../lib/queries";
import Link from "next/link";
import { usePathname } from "next/navigation";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function Header() {
  const ui = useUiStore();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const search = useGlobalSearch(debouncedQuery);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(debouncedQuery.length > 1);
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setQuery("");
  }, [pathname]);

  const results = search.data;
  const hasResults = results && (results.projects?.length > 0 || results.tickets?.length > 0 || results.contacts?.length > 0 || results.conversations?.length > 0);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-6 border-b border-border bg-white px-4">
      <Button className="h-9 w-9 px-0 md:hidden" onClick={() => ui.setSidebar(true)}>
        <Menu size={18} />
      </Button>
      <div className="relative ml-auto w-full max-w-sm" ref={wrapperRef}>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" size={15} />
        <Input 
          className="h-9 border-slate-200 bg-slate-50 pl-9 text-xs shadow-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand" 
          placeholder="Search..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.length > 1) setIsOpen(true) }}
        />

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-full min-w-[320px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200 z-50">
            {search.isLoading ? (
              <div className="flex items-center justify-center p-4 text-sm text-slate-500">
                <Loader2 size={16} className="mr-2 animate-spin" /> Searching...
              </div>
            ) : search.isError ? (
              <div className="p-4 text-center text-sm text-red-500">
                Failed to load results.
              </div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No results found for "{query}".
              </div>
            ) : (
              <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
                {results.projects?.length > 0 && (
                  <div className="mb-2">
                    <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Projects</div>
                    {results.projects.map((project: any) => (
                      <Link href={`/projects/${project.id}/settings`} key={project.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 hover:text-brand">
                        <Folder size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{project.name}</span>
                        <span className="ml-auto text-xs text-slate-400">{project.key}</span>
                      </Link>
                    ))}
                  </div>
                )}
                
                {results.tickets?.length > 0 && (
                  <div className="mb-2">
                    <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tickets</div>
                    {results.tickets.map((ticket: any) => (
                      <Link href={`/tickets/${ticket.projectId}`} key={ticket.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 hover:text-brand">
                        <Ticket size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{ticket.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
                
                {results.contacts?.length > 0 && (
                  <div className="mb-2">
                    <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Contacts</div>
                    {results.contacts.map((contact: any) => (
                      <Link href="/inbox" key={contact.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 hover:text-brand">
                        <User size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{contact.name}</span>
                        <span className="ml-auto truncate text-xs text-slate-400">{contact.email || contact.phone}</span>
                      </Link>
                    ))}
                  </div>
                )}
                
                {results.conversations?.length > 0 && (
                  <div className="mb-2">
                    <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Conversations</div>
                    {results.conversations.map((conversation: any) => (
                      <Link href="/inbox" key={conversation.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 hover:text-brand">
                        <MessageSquare size={14} className="text-slate-400 shrink-0" />
                        <div className="flex flex-col truncate">
                          <span className="truncate font-medium">{conversation.contact?.name || "Customer"}</span>
                          <span className="truncate text-xs text-slate-500">{conversation.messages[0]?.content}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
