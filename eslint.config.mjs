import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: ["node_modules/**", "dist/**", ".next/**", "coverage/**", ".pnpm-store/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
      globals: { React: "readonly", process: "readonly", Buffer: "readonly", console: "readonly" }
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "off"
    }
  },
  {
    files: ["apps/web/public/**/*.js", "apps/frontend/public/**/*.js", "*.config.js"],
    languageOptions: {
      globals: {
        self: "readonly",
        caches: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        module: "readonly",
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        Date: "readonly",
        Math: "readonly",
        setTimeout: "readonly"
      }
    }
  }
];
