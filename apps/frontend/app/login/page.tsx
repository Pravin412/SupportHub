import { Suspense } from "react";
import { LoginPage } from "../../components/login";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}

