"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    api
      .refresh()
      .then(() => setAuthed(true))
      .catch(() => {
        setAuthed(false);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      })
      .finally(() => setCheckingSession(false));
  }, [pathname, router]);

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-muted">
        Loading dashboard...
      </main>
    );
  }

  if (!authed) return null;

  return (
    <div className="h-screen overflow-hidden bg-canvas text-primary">
      <div className="grid h-full w-full md:grid-cols-sidebar">
        <Sidebar />
        <div className="flex min-w-0 flex-col overflow-y-auto">
          <Header />
          <main className="flex-1 min-h-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
