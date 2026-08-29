import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { 
        border: "#d9dee8", 
        muted: "#657083", 
        "muted-light": "#7b8797",
        "muted-dark": "#8b97a8",
        brand: "#0f766e",
        canvas: "#f3f6fa",
        input: "#f8fafc",
        hover: "#f5f7fa",
        chat: "#f6f8fb",
        primary: "#172033",
        "primary-light": "#344154",
        secondary: "#405066",
        tertiary: "#536174",
        "tertiary-light": "#66758a"
      },
      fontSize: {
        "2xs": "11px",
        "3xs": "10px",
      },
      gridTemplateColumns: {
        sidebar: "220px 1fr",
        inbox: "320px 1fr",
        preview: "1fr 360px",
        alert: "12px 1fr auto",
      },
      height: {
        main: "calc(100vh - 56px)",
      },
      minHeight: {
        preview: "360px",
      },
      maxWidth: {
        message: "78%",
        "chat-msg": "86%",
        "chat-reply": "82%",
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
