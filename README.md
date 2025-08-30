# Vanilla DateTime Picker

Zero-dependency, vanilla JS date-time picker with ESM and IIFE builds. Includes an external CSS file (CSP-friendly) and an optional “with CSS” variant that injects styles at runtime.

## Install

- npm: `npm i vanilla-datetime-picker`
- CDN: `https://cdn.jsdelivr.net/npm/vanilla-datetime-picker/dist/index.iife.min.js`

## Builds

- `dist/index.esm.js` — ESM module
- `dist/index.iife.min.js` — IIFE (global `DateTimePicker`)
- `dist/style.css` — external stylesheet

## Development

- `npm run build`
- `npm run dev:esm` or `npm run dev:iife`
- `python -m http.server`
- `npm run lint`

## Release

- `npm run audit`
- perform sanity checks
- `npm version patch` or `npm version minor` or `npm version major`
- `git push`
- `git push --follow-tags`

## TODOs

- [ ] Explain usage in README
- [ ] Add more examples
- [ ] Calendar grid highlights previous and current month days
- [ ] Add tests

## License

MIT
