import { createServer } from "node:http";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { inspectFabricJar } from "./fabric.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const ADMIN_ROOT = resolve(ROOT, "admin");
const CATALOG_PATH = resolve(ROOT, "site/catalog.json");
const PORT = 4173;
const MAX_REQUEST_SIZE = 80 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

const json = (response, status, value) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
};

async function loadEnv() {
  try {
    const envPath = resolve(ROOT, ".env");
    const content = await readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (match) {
        const val = match[2].trim().replace(/^["']|["']$/g, "");
        if (val) {
          process.env[match[1]] = val;
        }
      }
    }
  } catch {}
}

const run = (command, args) => new Promise((resolveRun) => {
  const child = spawn(command, args, { cwd: ROOT, shell: false, env: process.env });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.on("error", (error) => resolveRun({ code: 1, output: error.message }));
  child.on("close", (code) => resolveRun({ code, output }));
});

async function publish(request, response) {
  await loadEnv();
  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > MAX_REQUEST_SIZE) return json(response, 413, { error: "一次选择的文件太多，请分批发布" });
  const webRequest = new Request("http://127.0.0.1" + request.url, { method: "POST", headers: request.headers, body: Readable.toWeb(request), duplex: "half" });
  const form = await webRequest.formData();

  const isUpdateProjectOnly = request.url === "/api/project/update" || form.get("updateProjectOnly") === "true";
  const files = form.getAll("files").filter((file) => typeof file !== "string" && file.size > 0);
  if (!isUpdateProjectOnly && !files.length) {
    return json(response, 400, { error: "发布新版本至少需要选择一个版本文件" });
  }

  const directory = await mkdtemp(join(tmpdir(), "modsite-"));
  try {
    const paths = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) throw new Error(file.name + " 超过 10MB");
      const safeName = basename(file.name).replace(/[\x00-\x1f]/g, "_");
      const path = join(directory, safeName);
      await writeFile(path, Buffer.from(await file.arrayBuffer()));
      paths.push(path);
    }

    const args = [resolve(ROOT, "scripts/publish.mjs")];
    for (const name of ["project", "name", "description", "long-description", "icon", "banner", "source", "authors", "version", "game", "loader", "notes"]) {
      const value = form.get(name);
      if (value) args.push("--" + name, String(value));
    }

    const iconFile = form.get("iconFile");
    if (iconFile && typeof iconFile !== "string" && iconFile.size > 0) {
      if (iconFile.size > MAX_FILE_SIZE) throw new Error("图标文件超过 10MB");
      const safeName = "icon-" + basename(iconFile.name).replace(/[\x00-\x1f]/g, "_");
      const path = join(directory, safeName);
      await writeFile(path, Buffer.from(await iconFile.arrayBuffer()));
      args.push("--icon-file", path);
    }

    const bannerFile = form.get("bannerFile");
    if (bannerFile && typeof bannerFile !== "string" && bannerFile.size > 0) {
      if (bannerFile.size > MAX_FILE_SIZE) throw new Error("横幅文件超过 10MB");
      const safeName = "banner-" + basename(bannerFile.name).replace(/[\x00-\x1f]/g, "_");
      const path = join(directory, safeName);
      await writeFile(path, Buffer.from(await bannerFile.arrayBuffer()));
      args.push("--banner-file", path);
    }

    if (isUpdateProjectOnly) args.push("--update-project-only");
    if (form.get("dryRun") === "true") args.push("--dry-run");
    args.push(...paths);

    const result = await run(process.execPath, args);
    if (result.code !== 0) return json(response, 400, { error: result.output.trim() || "操作失败" });
    return json(response, 200, { message: result.output.trim() });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function inspectJar(request, response) {
  try {
    const webRequest = new Request("http://127.0.0.1" + request.url, { method: "POST", headers: request.headers, body: Readable.toWeb(request), duplex: "half" });
    const form = await webRequest.formData();
    const file = form.get("file");
    if (!file || typeof file === "string" || !file.size) {
      return json(response, 400, { error: "请上传有效 jar 文件" });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const info = inspectFabricJar(buffer, file.name);
    if (!info) {
      return json(response, 200, { isFabric: false, message: "未检测到 fabric.mod.json" });
    }
    return json(response, 200, info);
  } catch (error) {
    return json(response, 500, { error: error.message });
  }
}

async function serveFile(request, response) {
  const relative = request.url === "/" ? "index.html" : request.url.slice(1);
  const path = resolve(ADMIN_ROOT, relative);
  if (!path.startsWith(ADMIN_ROOT + sep) && path !== join(ADMIN_ROOT, "index.html")) return response.writeHead(404).end();
  try {
    const content = await readFile(path);
    response.writeHead(200, {
      "Content-Type": TYPES[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: blob: https:; base-uri 'none'; frame-ancestors 'none'"
    });
    response.end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/api/catalog") return json(response, 200, JSON.parse(await readFile(CATALOG_PATH, "utf8")));
    if (request.method === "POST" && request.url === "/api/inspect-jar") return await inspectJar(request, response);
    if (request.method === "POST" && (request.url === "/api/publish" || request.url === "/api/project/update")) return await publish(request, response);
    if (request.method === "POST" && request.url === "/api/deploy") {
      const wrangler = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
      const result = await run(process.execPath, [wrangler, "pages", "deploy", "site", "--project-name", "modsite"]);
      return json(response, result.code === 0 ? 200 : 500, result.code === 0 ? { message: result.output.trim() } : { error: result.output.trim() });
    }
    if (request.method === "GET") return await serveFile(request, response);
    response.writeHead(405).end();
  } catch (error) {
    json(response, 500, { error: error.message });
  }
});

await loadEnv();
server.listen(PORT, "127.0.0.1", () => {
  console.log("模组管理界面：http://127.0.0.1:" + PORT);
  console.log("按 Ctrl+C 关闭。此服务只监听本机，不会暴露到公网。");
});
