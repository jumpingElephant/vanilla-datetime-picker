# Vanilla DateTime Picker

Zero-dependency, vanilla JS date-time picker with ESM and IIFE builds. Includes an external CSS file (CSP-friendly) and an optional “with CSS” variant that injects styles at runtime.

## Install

- Assets are not published to npm or any CDN.
- Download the latest release from the GitHub Releases page:
  https://github.com/jumpingElephant/vanilla-datetime-picker/releases
- Use the files from the downloaded archive:
  - ESM: vanilla-datetime-picker.esm.js
  - IIFE (global DateTimePicker): vanilla-datetime-picker.iife.min.js
  - Styles: vanilla-datetime-picker.css

## Builds

- `dist/index.esm.js` — ESM module
- `dist/index.iife.min.js` — IIFE (global `DateTimePicker`)
- `dist/style.css` — external stylesheet


## Usage

- Copy the files from the release archive into your project (e.g., under ./dist or your public/assets folder).
- Include the stylesheet.
- Attach to one or more input[type="text"] elements. The picker opens on focus or click, and can also be opened with ArrowDown when focused.

ESM (module script in the browser)
```html
<!-- Place files from the release under ./dist -->
<link rel="stylesheet" href="./dist/style.css">

<input class="datetime" type="text" placeholder="YYYY-MM-DD HH:mm">

<script type="module">
  import DateTimePicker from './dist/index.esm.js';

  const picker = new DateTimePicker('.datetime', {
    minuteStep: 5,
    startOfWeek: 0,
    defaultHour: 9,
    defaultMinute: 0,
    min: '2020-01-01',  // Date or 'YYYY-MM-DD'
    max: null,
    highlightToday: true,
    showTimeHeaders: true,
    hourLabel: 'Hours',
    minuteLabel: 'Minutes',
    hourMin: 0,
    hourMax: 23,
    zIndex: 9999,
    format: (date) => {
      const p = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
    },
    parse: (str) => {
      const d = new Date(str);
      return isNaN(d) ? null : d;
    },
    initial: new Date()
  });
</script>
```

ESM (bundler)
```javascript
// Place dist files in your app’s served public folder (e.g., /public/dist)
// Then import by URL/path as your bundler allows:
import DateTimePicker from '/dist/index.esm.js';
// And include the CSS from the same served folder
// e.g., via your HTML <link> or CSS pipeline
```

IIFE (no bundler)
```html
<link rel="stylesheet" href="./dist/style.css">

<input class="datetime" type="text" placeholder="YYYY-MM-DD HH:mm">

<script src="./dist/index.iife.min.js"></script>
<script>
  // Global: window.DateTimePicker
  const picker = new DateTimePicker('.datetime', {
    minuteStep: 15,
    startOfWeek: 1
  });
</script>
```

Notes
- Multiple elements: pass a CSS selector; one picker instance manages all matched inputs internally.
- min/max can be Date objects or date-only strings 'YYYY-MM-DD'.
- hourMin/hourMax constrain the visible hour list in the time column (they do not change the parsing/formatting of arbitrary input text).
- Accessibility/UX: opens on focus/click; ArrowDown opens when focused. The panel includes Today, Now, Reset, and Clear actions.

### Small programmatic API

```javascript
// Single input example:
const picker = new DateTimePicker('#when');

picker.open();
picker.close();

const current = picker.getDate();      // Date|null
picker.setDate(new Date());

picker.setInitial(new Date('2025-01-01T09:00:00'));
const baseline = picker.getInitial();  // Date|null

picker.clear();
picker.destroy();
```

### Styling

- Use the provided CSS as-is or override classes prefixed with .vdtp- to fit your design system.
- The panel is absolutely positioned near the input and uses z-index (default 9999), configurable via the zIndex option.

## Development

- `npm run build`
- `npm run dev:esm` or `npm run dev:iife`
- `python -m http.server`
- `npm run lint`
  // ... existing code ...

## Release

- `npm run audit`
- perform sanity checks
- `npm version patch` or `npm version minor` or `npm version major`
- `git push`
- `git push --follow-tags`
  // ... existing code ...

## TODOs

- [x] Explain usage in README
- [ ] Add tests
- [ ] Calendar grid highlights previous and current month days
- [ ] Keyboard navigation does not work when input is empty or invalid

## License

MIT
