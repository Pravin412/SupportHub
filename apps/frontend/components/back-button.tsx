"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@support-hub/ui";

export function BackButton({
  fallbackHref = "/dashboard",
  onClick,
  title = "Go back",
  className = "h-9 w-9"
}: {
  fallbackHref?: string;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      title={title}
      aria-label={title}
      className={`${className} shrink-0 border-slate-200 bg-white px-0 text-secondary shadow-none hover:bg-slate-50 hover:text-primary`}
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
    >
      <ArrowLeft size={18} />
    </Button>
  );
}
