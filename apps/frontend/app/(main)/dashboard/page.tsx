"use client";
import { Overview } from "../../../components/overview";
import { useDashboardSummary } from "../../../lib/queries";
import { useRouter } from "next/navigation";

export default function DashboardRoutePage() {
  const summary = useDashboardSummary(true);
  const router = useRouter();

  return (
    <Overview
      summary={summary.data}
      isLoading={summary.isLoading}
      onInbox={() => router.push("/inbox")}
    />
  );
}
