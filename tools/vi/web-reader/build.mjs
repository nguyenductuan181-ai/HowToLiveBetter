#!/usr/bin/env node
// Builds the web reader into dist/web-reader/, laid out exactly as the R2 object keys
// of bucket howtolivebetter-public (served at https://sach.thantamtue.vn/).
//   how-to-live-better              → index.html (R2 has no index documents, so the page is its own key)
//   how-to-live-better/             → index.html (same page, for the trailing-slash URL)
//   how-to-live-better/assets/...   → css, js, images, vendored epub.js + JSZip
// The EPUB itself lives at /HowToLiveBetter-vi.epub and is uploaded separately (see README.md).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../../../dist/web-reader");
const require = createRequire(join(here, "package.json"));

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "how-to-live-better/assets"), { recursive: true });

const css = readFileSync(join(here, "reader.css"));
const js = readFileSync(join(here, "reader.js"));
const v = createHash("sha256").update(css).update(js).digest("hex").slice(0, 10);
const html = readFileSync(join(here, "index.html"), "utf8").replaceAll("__V__", v);

writeFileSync(join(out, "how-to-live-better.html"), html);
const a = join(out, "how-to-live-better/assets");
writeFileSync(join(a, "reader.css"), css);
writeFileSync(join(a, "reader.js"), js);
copyFileSync(join(here, "icon.png"), join(a, "icon.png"));
copyFileSync(join(here, "og.jpg"), join(a, "og.jpg"));
copyFileSync(require.resolve("epubjs/dist/epub.min.js"), join(a, "epub.min.js"));
copyFileSync(require.resolve("jszip/dist/jszip.min.js"), join(a, "jszip.min.js"));
console.log(`built ${out} (asset version ${v})`);
