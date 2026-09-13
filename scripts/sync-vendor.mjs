import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const vendorDir = path.join(root, "site", "vendor");
fs.mkdirSync(vendorDir, { recursive: true });

const markedSrc = path.join(root, "node_modules", "marked", "lib", "marked.esm.js");
const markedDest = path.join(vendorDir, "marked.esm.js");
if (fs.existsSync(markedSrc)) {
  fs.copyFileSync(markedSrc, markedDest);
}

const purifySrc = path.join(root, "node_modules", "dompurify", "dist", "purify.es.mjs");
const purifyDest = path.join(vendorDir, "purify.es.mjs");
if (fs.existsSync(purifySrc)) {
  fs.copyFileSync(purifySrc, purifyDest);
}

console.log("Vendor dependencies successfully synchronized to site/vendor/");
