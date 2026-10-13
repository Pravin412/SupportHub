import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { 
        border: "#e3e7eb",
        muted: "#66717e",
        "muted-light": "#7b8797",
        "muted-dark": "#8b97a8",
        brand: "#087f73",
        canvas: "#f4f6f8",
        input: "#f8fafc",
        hover: "#f1f5f5",
        chat: "#f5f7f8",
        primary: "#20262f",
        "primary-light": "#344154",
        secondary: "#405066",
        tertiary: "#536174",
        "tertiary-light": "#66758a",
        "chat-pane": "#f1f5f4",
        "chat-bubble-bg": "#087f73",
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
        "chat-header": "72px"
      },
      minHeight: {
        preview: "360px",
      },
      maxWidth: {
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
