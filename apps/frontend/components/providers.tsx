"use client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { displayToast } from "../lib/display-toast";
import { Toaster } from "./toaster";
import { GlobalConfirmationModal } from "./confirmation-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({
      queryCache: new QueryCache({ onError: handleQueryError }),
      defaultOptions: { queries: { staleTime: 30000, gcTime: 300000, retry: 1 } }
    })
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
      <Toaster />
      <GlobalConfirmationModal />
      {children}
    </QueryClientProvider>
  );
}

function handleQueryError(error: Error) {
  displayToast(error.message || "Failed to load data", "destructive");
}
