import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

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
      // Ensure global DateTimePicker is the constructor (not a namespace)
      (function (g) {
        var ns = g.DateTimePicker;
        if (ns && (ns.default || ns.DateTimePicker)) {
          g.DateTimePicker = ns.default || ns.DateTimePicker;
        }
      })(typeof window !== 'undefined' ? window : globalThis);
      `
    }
});

// // 3) Optional “with CSS” variants (auto-injected CSS)
// if (fs.existsSync("src/index-inject.js")) {
//     await build({
//         entryPoints: ["src/index-inject.js"],
//         outfile: "dist/index.with-css.esm.js",
//         bundle: true,
//         format: "esm",
//         sourcemap: true,
//     minify: false,
//     target: ["es2019"]
//     });
//
//     await build({
//         entryPoints: ["src/index-inject.js"],
//         outfile: "dist/index.with-css.iife.min.js",
//         bundle: true,
//         format: "iife",
//         globalName: "DateTimePicker",
//         sourcemap: false,
//     minify: true,
//     target: ["es2019"]
//     });
// }

console.log("Build complete.");
