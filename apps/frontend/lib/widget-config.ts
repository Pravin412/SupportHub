export let WIDGET_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
  WIDGET_API_URL = `${window.location.protocol}//${window.location.hostname}:4000`;
}

export function guestProfileStorageKey(channelId: string) {
  return `supporthub:guest-profile:${channelId}`;
}
