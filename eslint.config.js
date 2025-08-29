// eslint.config.js
import js from "@eslint/js";

export default [
  // Ignore built artifacts and dependencies
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  // Base recommended rules from ESLint
  js.configs.recommended,

  // Source code (browser, ESM)
  {
    files: ["src/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
      },
    },
    rules: {
      "no-var": "error",
      "prefer-const": ["error", { destructuring: "all" }],
      "eqeqeq": ["error", "smart"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "curly": ["error", "all"],
      "no-implicit-globals": "error",
    },
  },

  // Build scripts (Node, ESM)
  {
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // Repo root scripts (optional): treat as Node too
  {
    files: ["*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // Linter behavior tweaks
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
];
