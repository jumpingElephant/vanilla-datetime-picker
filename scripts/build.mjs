import {build} from "esbuild";
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
if (fs.existsSync(dist)) fs.rmSync(dist, {recursive: true, force: true});
fs.mkdirSync(dist, {recursive: true});

// Copy external CSS if present
if (fs.existsSync("src/style.css")) {
  fs.copyFileSync("src/style.css", path.join(dist, "style.css"));
}

// 1) ESM build (no auto-injected CSS)
await build({
  entryPoints: ["src/index.js"],
  outfile: "dist/index.esm.js",
  bundle: true,
  format: "esm",
  sourcemap: true,
  minify: false,
  target: ["es2019"]
});

// 2) IIFE minified build (no auto-injected CSS)
await build({
  entryPoints: ["src/index.js"],
  outfile: "dist/index.iife.min.js",
  bundle: true,
  format: "iife",
  globalName: "DateTimePicker",
  sourcemap: false,
  minify: true,
  target: ["es2019"],
  footer: {
    js: `
      (function (g) {
        var ns = g.DateTimePicker;
        if (ns && (ns.default || ns.DateTimePicker)) {
          g.DateTimePicker = ns.default || ns.DateTimePicker;
        }
      })(typeof window !== 'undefined' ? window : globalThis);
      `
  }
});

// Create descriptive aliases without breaking existing paths
const aliasMap = [
  ["index.esm.js", "vanilla-datetime-picker.esm.js"],
  ["index.iife.min.js", "vanilla-datetime-picker.iife.min.js"],
  ["style.css", "vanilla-datetime-picker.css"],
];

for (const [from, to] of aliasMap) {
  const src = path.join(dist, from);
  const dst = path.join(dist, to);
  if (fs.existsSync(src)) fs.copyFileSync(src, dst);
}

console.log("Build complete with descriptive aliases.");
