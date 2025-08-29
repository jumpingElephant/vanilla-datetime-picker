# Vanilla DateTime Picker

Zero-dependency, vanilla JS date-time picker with ESM and IIFE builds. Includes an external CSS file (CSP-friendly) and an optional “with CSS” variant that injects styles at runtime.

## Install

- npm: `npm i vanilla-datetime-picker`
- CDN: `https://cdn.jsdelivr.net/npm/vanilla-datetime-picker/dist/index.iife.min.js`

## Builds

- `dist/index.esm.js` — ESM module
- `dist/index.iife.min.js` — IIFE (global `DateTimePicker`)
- `dist/style.css` — external stylesheet
- `dist/index.with-css.*` — optional auto-injected CSS variants

## Development

- `npm ci`
- `npm run build`
- `npm run dev:esm` or `npm run dev:iife`
- `npm run lint`

## Release

- `npm ci`
- `npm run lint`
- `npm run build`
- perform sanity checks
- `npm version patch` or `npm version minor` or `npm version major`

## License

MIT
