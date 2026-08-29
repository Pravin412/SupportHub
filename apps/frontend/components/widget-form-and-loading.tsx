"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { UserRound } from "lucide-react";
import { Button, Input } from "@support-hub/ui";
import { LoadingIndicator } from "./loading-indicator";

type VisitorFormValues = {
  name: string;
  email: string;
  number: string;
};

export function WidgetVisitorForm({
  config,
  visitorForm,
  onSubmit,
  themeColor
}: {
  config: any;
  visitorForm: VisitorFormValues;
  onSubmit: (values: VisitorFormValues) => void;
  themeColor: string;
}) {
  const form = useForm<VisitorFormValues>({
    defaultValues: visitorForm
  });

  useEffect(() => {
    form.reset(visitorForm);
  }, [form, visitorForm]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mb-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <UserRound size={16} style={{ color: themeColor }} />
        Start a new conversation
      </div>
      <div className="space-y-2">
        {config?.visitorNameEnabled && (
          <label className="block">
            <Input
              {...form.register("name", {
                validate: (value) => !config?.visitorNameEnabled || Boolean(value.trim()) || "Name is required"
              })}
              placeholder="Name"
              className="h-9 text-sm"
            />
            <FieldError message={form.formState.errors.name?.message} />
          </label>
        )}
        {config?.visitorEmailEnabled && (
          <label className="block">
            <Input
              type="email"
              {...form.register("email", {
                validate: (value) => {
                  if (!config?.visitorEmailEnabled) return true;
                  if (!value.trim()) return "Email is required";
                  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Enter a valid email";
                }
              })}
              placeholder="Email"
              className="h-9 text-sm"
            />
            <FieldError message={form.formState.errors.email?.message} />
          </label>
        )}
        {config?.visitorPhoneEnabled && (
          <label className="block">
            <Input
              {...form.register("number", {
                validate: (value) => !config?.visitorPhoneEnabled || Boolean(value.trim()) || "Phone number is required"
              })}
              placeholder="Phone number"
              className="h-9 text-sm"
            />
            <FieldError message={form.formState.errors.number?.message} />
          </label>
        )}
      </div>
      <Button type="submit" style={{ backgroundColor: themeColor }} className="mt-3 h-9 w-full border-0 text-sm text-white">
        Continue
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function WidgetLoadingSkeleton({ themeColor }: { themeColor: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
      <LoadingIndicator themeColor={themeColor} />
    </div>
  );
}
