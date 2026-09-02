"use client";
import { useState } from "react";
import { Overview } from "../../components/overview";
import { useDashboardSummary } from "../../lib/queries";
import { useRouter } from "next/navigation";
import type { DashboardRange } from "../../lib/types";

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("today");
  const summary = useDashboardSummary(range, true);
  const router = useRouter();

  return (
    <Overview
      summary={summary.data}
      isLoading={summary.isLoading}
      range={range}
      onRangeChange={setRange}
      onInbox={() => router.push("/inbox")}
    />
  );
}
