"use client";
import { Gauge, HelpCircle, Inbox, LogOut, Folder } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "../lib/store";
import { NavButton, NavLink } from "./shared";
import { api } from "../lib/api";
import { Button } from "@support-hub/ui";

export function Sidebar() {
  const ui = useUiStore();
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    await api.logout().catch(() => undefined);
    api.setToken("");
    router.replace("/login");
  };

  return (
    <>
      {ui.sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => ui.setSidebar(false)} />
      )}
      <aside
        className={`${
          ui.sidebarOpen ? "fixed inset-y-0 left-0 z-50 flex w-64 shadow-xl" : "hidden"
        } border-r border-border bg-white md:flex md:flex-col md:shadow-none`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="grid h-8 w-8 place-items-center rounded bg-brand text-xs font-bold text-white">S</span>
          <div>
            <div className="text-sm font-bold leading-tight text-brand">SupportHub</div>
            <div className="text-3xs font-medium text-muted-light">Customer Support</div>
          </div>
        </div>
        <nav className="space-y-1 py-3 pr-3">
          <NavLink active={pathname === "/" || pathname === "/dashboard"} href="/dashboard" icon={<Gauge size={15} />}>
            Dashboard
          </NavLink>
          <NavLink active={pathname === "/inbox"} href="/inbox" icon={<Inbox size={15} />}>
            Inbox
          </NavLink>

          <NavLink active={pathname === "/projects"} href="/projects" icon={<Folder size={15} />}>
            Projects
          </NavLink>
          <NavLink active={pathname === "/documentation"} href="/documentation" icon={<HelpCircle size={15} />}>
            Documentation
          </NavLink>
        </nav>

        <div className="mt-auto border-t border-border p-3">
          <NavButton active={false} icon={<LogOut size={15} />} onClick={() => setShowLogoutModal(true)}>
            Logout
          </NavButton>
        </div>
      </aside>
      {showLogoutModal && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-red-50 text-red-600">
                <LogOut size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Confirm logout</h2>
                <p className="mt-1 text-sm text-muted">Are you sure you want to logout from SupportHub?</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                className="h-9 border-slate-200 bg-white px-4 text-sm text-slate-900"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-9 bg-red-600 px-4 text-sm text-white hover:bg-red-700"
                disabled={isLoggingOut}
                onClick={logout}
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
