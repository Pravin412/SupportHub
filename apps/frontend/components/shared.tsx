import React from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function NavLink({
  active,
  icon,
  children,
  href
}: {
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`flex h-9 w-full items-center gap-3 rounded-r-full px-4 text-left text-sm font-semibold transition-colors ${
        active 
          ? "border-l-4 border-brand bg-teal-50 text-brand" 
          : "border-l-4 border-transparent text-secondary hover:bg-hover"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

export function NavButton({
  active,
  icon,
  children,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className={`flex h-9 w-full items-center gap-3 rounded-r-full px-4 text-left text-sm font-semibold transition-colors ${
        active 
          ? "border-l-4 border-brand bg-teal-50 text-brand" 
          : "border-l-4 border-transparent text-secondary hover:bg-hover"
      }`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

export function MetricCard({
  title,
  value,
  delta,
  icon,
  negative,
  neutral
}: {
  title: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  negative?: boolean;
  neutral?: boolean;
}) {
  return (
    <section className="flex flex-col justify-between rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold text-secondary">{title}</div>
        <span className="grid h-7 w-7 place-items-center rounded bg-input text-secondary">{icon}</span>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-primary">{value}</div>
        <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${neutral ? "text-tertiary" : negative ? "text-red-600" : "text-brand"}`}>
          {neutral ? null : negative ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-45" />}
          {delta}
        </div>
      </div>
    </section>
  );
}
