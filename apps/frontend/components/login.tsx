"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input } from "@support-hub/ui";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../lib/api";

const schema = z.object({ email: z.email(), password: z.string().min(8) });
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    defaultValues: { email: "admin@gmail.com", password: "Password@123" }
  });
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm p-5">
        <h1 className="text-xl font-semibold">SupportHub</h1>
        <form
          className="mt-5 space-y-3"
          onSubmit={form.handleSubmit(async (v) => {
            try {
              await api.login(v.email, v.password);
              onDone();
            } catch (error) {
              form.setError("root", {
                message: error instanceof Error ? error.message : "Unable to sign in"
              });
            }
          })}
        >
          <Input className="h-10" placeholder="Email" {...form.register("email")} />
          <div className="relative">
            <Input
              className="h-10 pr-10"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...form.register("password")}
            />
            <button
              type="button"
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-800"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Button className="w-full bg-brand text-white" disabled={form.formState.isSubmitting}>
            Sign in
          </Button>
          {form.formState.errors.email && <p className="text-sm text-red-700">Enter a valid email.</p>}
          {form.formState.errors.root && <p className="text-sm text-red-700">{form.formState.errors.root.message}</p>}
        </form>
      </Card>
    </main>
  );
}
