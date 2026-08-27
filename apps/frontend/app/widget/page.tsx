"use client";

import { Suspense } from "react";
import { WidgetContainer } from "../../components/widget-container";
import { WidgetLoadingSkeleton } from "../../components/widget-form-and-loading";

export default function WidgetPage() {
  return (
    <Suspense fallback={<WidgetLoadingSkeleton themeColor="#0f4c42" />}>
      <WidgetContainer />
    </Suspense>
  );
}
