import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "./use-toast";

afterEach(() => {
  vi.runAllTimers();
  vi.useRealTimers();
});

describe("toast notifications", () => {
  it("deduplicates visible errors without extending their three-second lifetime", () => {
    vi.useFakeTimers();
    const options = { description: "API unavailable", variant: "destructive" as const };
    const first = toast(options);
    vi.advanceTimersByTime(2000);
    expect(toast(options).id).toBe(first.id);
    vi.advanceTimersByTime(1000);
    expect(toast(options).id).not.toBe(first.id);
  });

  it("respects a custom duration and manual dismissal", () => {
    vi.useFakeTimers();
    const options = { description: "Saved", duration: 5000 };
    const first = toast(options);
    vi.advanceTimersByTime(3000);
    expect(toast(options).id).toBe(first.id);
    first.dismiss();
    const second = toast(options);
    expect(second.id).not.toBe(first.id);
    vi.advanceTimersByTime(5000);
    expect(toast(options).id).not.toBe(second.id);
  });
});
