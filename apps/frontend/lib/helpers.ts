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
