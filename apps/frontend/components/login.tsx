"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input } from "@support-hub/ui";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../lib/api";
import { displayToast } from "../lib/display-toast";

const schema = z.object({ email: z.email(), password: z.string().min(8) });
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const router = useRouter();
  const redirectTo = "/";

  useEffect(() => {
    api
      .refresh()
      .then(() => router.replace(redirectTo))
      .catch(() => undefined);
  }, [redirectTo, router]);
  return <Login onDone={() => router.replace(redirectTo)} />;
}

export function Login({ onDone }: { onDone: () => void }) {

  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });
  return (
    <main className="login-surface grid min-h-screen place-items-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-sm border border-white/70 border-t-4 border-t-brand bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <h1 className="text-3xl font-bold leading-tight text-primary">SupportHub</h1>
        <form
          className="mt-8 space-y-4"
          onSubmit={form.handleSubmit(async (v) => {
            try {
              await api.login(v.email, v.password);
              onDone();
            } catch (error) {
              displayToast(error instanceof Error ? error.message : "Unable to sign in", "destructive");
            }
          })}
        >
          <Input className="h-12 border-slate-200 bg-slate-50/80 px-4 text-base shadow-none focus:bg-white" placeholder="Email" {...form.register("email")} />
          <div className="relative">
            <Input
              className="h-12 border-slate-200 bg-slate-50/80 pl-4 pr-12 text-base shadow-none focus:bg-white"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...form.register("password")}
            />
            <button
              type="button"
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-md text-slate-500 hover:bg-blue-50 hover:text-brand focus-visible:outline-offset-[-4px]"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Button className="h-12 w-full border-brand bg-brand text-base font-semibold text-white shadow-md hover:bg-blue-800" disabled={form.formState.isSubmitting}>
            Sign in
          </Button>
          {form.formState.errors.email && <p className="text-sm text-error-muted">Enter a valid email.</p>}
          {form.formState.errors.password && <p className="text-sm text-error-muted">Password must be at least 8 characters.</p>}
        </form>
      </Card>
    </main>
  );
}
