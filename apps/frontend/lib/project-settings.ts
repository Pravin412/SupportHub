export const settingsTabs = [
  { id: "general", label: "General" },
  { id: "bot", label: "Bot & Widget" },
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "integrations", label: "Integrations" }
] as const;

export type SettingsTab = (typeof settingsTabs)[number]["id"];
