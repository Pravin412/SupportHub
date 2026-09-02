"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";
import { LoadingIndicator } from "../../components/loading-indicator";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialPathname = useRef(pathname);
  const checkedSessionRef = useRef(false);
  const [authed, setAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (checkedSessionRef.current) return;
    checkedSessionRef.current = true;

    api
      .me()
      .then(() => setAuthed(true))
      .catch(() => {
        setAuthed(false);
        router.replace(`/login?redirect=${encodeURIComponent(initialPathname.current)}`);
      })
      .finally(() => setCheckingSession(false));
  }, [router]);

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <LoadingIndicator />
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
