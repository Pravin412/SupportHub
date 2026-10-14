"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@support-hub/ui";

export function RouteError({ error, retry }: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => { Sentry.captureException(error); }, [error]);

  return (
    <section role="alert" className="flex min-h-80 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-error-surface text-error"><AlertTriangle size={24} /></span>
      <div className="max-w-md">
        <h1 className="text-xl font-semibold text-primary">Unable to load this page</h1>
        <p className="mt-2 text-sm text-muted">Something went wrong. Please try again.</p>
      </div>
      <Button type="button" onClick={retry} className="gap-2 bg-brand text-white">
        <RefreshCw size={16} /> Try again
      </Button>
    </section>
  );
}
