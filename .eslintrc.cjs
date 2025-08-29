module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  extends: [
    "eslint:recommended"
  ],
  rules: {
    "no-unused-vars": ["warn", {"argsIgnorePattern": "^_", "varsIgnorePattern": "^_"}],
    "no-constant-binary-expression": "off"
  }
};
