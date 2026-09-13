import AdmZip from "adm-zip";
import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const scratchDir = resolve("scratch");
try { mkdirSync(scratchDir, { recursive: true }); } catch {}

// 1. Create lucidity-2.0.3+1.21.12.jar
const zip1 = new AdmZip();
zip1.addFile("fabric.mod.json", Buffer.from(JSON.stringify({
  schemaVersion: 1,
  id: "lucidity",
  name: "Lucidity",
  version: "2.0.3-1.21.12",
  description: "Next gen visual assistance mod",
  authors: ["Ryan100c"],
  contact: {
    sources: "https://github.com/Ryan100c/Lucidity"
  },
  depends: {
    minecraft: "1.21.12"
  }
})));
const path1 = resolve(scratchDir, "lucidity-2.0.3+1.21.12.jar");
writeFileSync(path1, zip1.toBuffer());

// 2. Create zoom-extra-1.0.0+1.21.jar
const zip2 = new AdmZip();
zip2.addFile("fabric.mod.json", Buffer.from(JSON.stringify({
  schemaVersion: 1,
  id: "zoom-extra",
  name: "Zoom Extra",
  version: "1.0.0",
  description: "Lightweight optical zoom mod",
  authors: ["Ryan100c", "ModderTwo"],
  contact: {
    sources: "https://github.com/Ryan100c/ZoomExtra"
  },
  depends: {
    minecraft: "1.21"
  }
})));
const path2 = resolve(scratchDir, "zoom-extra-1.0.0+1.21.jar");
writeFileSync(path2, zip2.toBuffer());

console.log("Created test jars:", path1, path2);
