export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildWidgetSnippet(channelId = "your-channel-id") {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_WIDGET_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `<script 
  id="supporthub-script"
  src="${origin}/widget.js?v=${Date.now()}" 
  data-channel-id="${channelId}"
></script>`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("");
}

export function displayAtLeast(value: number, minimum: number) {
  return Math.max(value, minimum);
}

export function parseEmailList(value?: string | null) {
  return Array.from(
    new Set(
      (value ?? "")
        .split(/[\s,;]+/)
        .map((email) => email.trim())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
  );
}

export function normalizePhoneNumber(countryCode?: string | number, phoneNumber?: string | number | bigint): string | null {
  const cleanCC = String(countryCode ?? "").replace(/\D/g, "");
  let cleanNum = String(phoneNumber ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (!cleanNum) return null;
  if (cleanCC && cleanNum.startsWith(cleanCC) && cleanNum.length > cleanCC.length + 6) {
    return cleanNum;
  }
  const full = `${cleanCC}${cleanNum}`;
  return full.length >= 9 ? full : null;
}

// Same rule as the project access member form: digits only, country code required, 9-15 digits.
export const PHONE_PATTERN = /^[1-9]\d{8,14}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()+-]/g, "");
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(value));
}

export function parsePhoneList(value?: string | string[] | null): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : value.split(/[,;\n]+/))
        .map(normalizePhone)
        .filter((phone) => PHONE_PATTERN.test(phone))
    )
  );
}

