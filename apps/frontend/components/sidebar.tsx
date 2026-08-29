"use client";
import { Gauge, HelpCircle, Inbox, LogOut, Folder } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "../lib/store";
import { NavButton, NavLink } from "./shared";
import { api } from "../lib/api";
import { ConfirmationModal } from "./confirmation-modal";

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
      <ConfirmationModal
        open={showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout from SupportHub?"
        confirmLabel={isLoggingOut ? "Logging out..." : "Logout"}
        icon={<LogOut size={18} />}
        isLoading={isLoggingOut}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={logout}
      />
    </>
  );
}
