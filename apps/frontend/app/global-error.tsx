"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="en"><body>
      <main className="grid min-h-screen place-content-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button type="button" onClick={reset} className="rounded-md border px-4 py-2">Try again</button>
      </main>
    </body></html>
  );
}
