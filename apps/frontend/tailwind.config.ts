import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { 
        border: "#e2e8f0",
        muted: "#64748b",
        "muted-light": "#7b8797",
        "muted-dark": "#8b97a8",
        brand: "#2563EB",
        "brand-soft": "#eff6ff",
        "brand-border": "#bfdbfe",
        widget: "#2563EB",
        canvas: "#f8fafc",
        input: "#f8fafc",
        hover: "#f3f4f6",
        chat: "#f3f4f6",
        primary: "#1f2937",
        "primary-light": "#344154",
        secondary: "#405066",
        tertiary: "#536174",
        "tertiary-light": "#66758a",
        "chat-pane": "#f3f4f6",
        "chat-bubble-bg": "#2563EB",
        error: "#dc2626",
        "error-muted": "#b91c1c",
        "error-strong": "#991b1b",
        "error-surface": "#fef2f2",
        "error-surface-overlay": "rgb(254 242 242 / 0.95)",
        "error-border": "#fecaca"
      },
      fontSize: {
        "2xs": "11px",
        "3xs": "10px",
      },
      boxShadow: {
        sm: "0 1px 2px rgb(32 38 47 / 0.03), 0 3px 10px rgb(32 38 47 / 0.025)",
        md: "0 4px 16px rgb(32 38 47 / 0.06), 0 1px 3px rgb(32 38 47 / 0.04)",
        xl: "0 16px 48px rgb(32 38 47 / 0.12), 0 4px 12px rgb(32 38 47 / 0.04)"
      },
      gridTemplateColumns: {
        sidebar: "220px 1fr",
        inbox: "320px 1fr",
        preview: "1fr 360px",
        alert: "12px 1fr auto",
      },
      height: {
        main: "calc(100vh - 56px)",
        settings: "calc(100dvh - 64px)",
        "widget-preview": "600px",
        "chat-header": "72px"
      },
      minHeight: {
        preview: "360px",
      },
      maxWidth: {
        widget: "380px",
        message: "78%",
        "chat-msg": "86%",
        "chat-reply": "82%",
        "chat-bubble": "320px"
      },
      width: {
        widget: "300px",
      },
      transitionDuration: {
        loader: "1.25s",
      }
    }
  },
  plugins: []
};

export default config;
