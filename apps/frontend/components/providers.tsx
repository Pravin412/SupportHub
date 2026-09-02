"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useUiStore } from "../lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30000, gcTime: 300000, retry: 1 } } })
  );
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js");
      return;
    }
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }, []);
  return (
    <QueryClientProvider client={client}>
      <ToastContainer />
      {children}
    </QueryClientProvider>
  );
}

function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex min-w-[280px] max-w-md items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-xs ${
              toast.type === "error"
                ? "border-red-200 bg-red-50/95 text-red-800"
                : toast.type === "info"
                ? "border-blue-200 bg-blue-50/95 text-blue-800"
                : "border-emerald-200 bg-emerald-50/95 text-emerald-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "error" ? (
                <AlertCircle size={18} className="text-red-600 shrink-0" />
              ) : toast.type === "info" ? (
                <Info size={18} className="text-blue-600 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              )}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="rounded p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

