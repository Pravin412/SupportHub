import { Suspense } from "react";
import { LoadingIndicator } from "../../components/loading-indicator";
import { LoginPage } from "../../components/login";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><LoadingIndicator /></div>}>
      <LoginPage />
    </Suspense>
  );
}
