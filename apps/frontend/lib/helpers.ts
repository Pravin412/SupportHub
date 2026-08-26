export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildWidgetSnippet(channelId = "your-channel-id") {
  return `<script 
  id="supporthub-script"
  src="http://localhost:3000/widget.js" 
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
