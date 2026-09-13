import { createServer } from "node:http";
import { readFile, mkdtemp, rm, writeFile, rename } from "node:fs/promises";
import { basename, extname, join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { inspectFabricJar } from "./fabric.mjs";
import { removeRelease, removeReleaseFile, addReleaseFile, removeProject, updateReleaseGameVersions, syncModrinthProject, fileRecord, upload } from "./publish.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const ADMIN_ROOT = resolve(ROOT, "admin");
const SITE_ROOT = resolve(ROOT, "site");
const CONFIG_PATH = resolve(ROOT, "site/config.json");
const CATALOG_PATH = resolve(ROOT, "site/catalog.json");
const PORT = 4173;
const MAX_REQUEST_SIZE = 80 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

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
    if (form.get("overwrite") === "true" || form.get("allowOverwrite") === "true") args.push("--allow-overwrite");
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

async function deleteReleaseHandler(request, response) {
  try {
    const webRequest = new Request("http://127.0.0.1" + request.url, { method: "POST", headers: request.headers, body: Readable.toWeb(request), duplex: "half" });
    const form = await webRequest.formData();
    const project = form.get("project");
    const version = form.get("version");
    if (!project || !version) return json(response, 400, { error: "缺少 project 或 version 参数" });

    const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
    removeRelease(catalog, project, version);

    const temporaryPath = `${CATALOG_PATH}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    await rename(temporaryPath, CATALOG_PATH);

    return json(response, 200, { message: `已成功删除项目 ${project} 的版本 ${version}` });
  } catch (error) {
    return json(response, 400, { error: error.message });
  }
}

async function deleteReleaseFileHandler(request, response) {
  try {
    const webRequest = new Request("http://127.0.0.1" + request.url, { method: "POST", headers: request.headers, body: Readable.toWeb(request), duplex: "half" });
    const form = await webRequest.formData();
    const project = form.get("project");
    const version = form.get("version");
    const fileName = form.get("fileName");
    if (!project || !version || !fileName) return json(response, 400, { error: "缺少 project、version 或 fileName 参数" });

    const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
    removeReleaseFile(catalog, project, version, fileName);

    const temporaryPath = `${CATALOG_PATH}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    await rename(temporaryPath, CATALOG_PATH);

    return json(response, 200, { message: `已成功从版本 ${version} 中移除文件 ${fileName}` });
  } catch (error) {
    return json(response, 400, { error: error.message });
  }
}

async function addReleaseFileHandler(request, response) {
  await loadEnv();
  const webRequest = new Request("http://127.0.0.1" + request.url, { method: "POST", headers: request.headers, body: Readable.toWeb(request), duplex: "half" });
  const form = await webRequest.formData();
  const project = form.get("project");
  const version = form.get("version");
  const file = form.get("file");

  if (!project || !version || !file || typeof file === "string" || !file.size) {
    return json(response, 400, { error: "缺少有效的文件、项目或版本参数" });
  }
  if (file.size > MAX_FILE_SIZE) {
    return json(response, 400, { error: `${file.name} 超过 10MB 上限` });
  }

  const directory = await mkdtemp(join(tmpdir(), "modsite-file-"));
  try {
    const safeName = basename(file.name).replace(/[\x00-\x1f]/g, "_");
    const tempPath = join(directory, safeName);
    await writeFile(tempPath, Buffer.from(await file.arrayBuffer()));

    const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
    const record = await fileRecord(tempPath, project, version, config.downloadBaseUrl);

    upload(config.r2Bucket, record);

    const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
    addReleaseFile(catalog, project, version, record.public);

    const temporaryPath = `${CATALOG_PATH}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    await rename(temporaryPath, CATALOG_PATH);

    return json(response, 200, { message: `已成功将 ${file.name} 添加至版本 ${version}`, file: record.public });
  } catch (error) {
    return json(response, 400, { error: error.message });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function deleteProjectHandler(request, response) {
  try {
    const webRequest = new Request("http://127.0.0.1" + request.url, { method: "POST", headers: request.headers, body: Readable.toWeb(request), duplex: "half" });
    const form = await webRequest.formData();
    const project = form.get("project");
    if (!project) return json(response, 400, { error: "缺少 project 参数" });

    const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
    removeProject(catalog, project);

    const temporaryPath = `${CATALOG_PATH}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    await rename(temporaryPath, CATALOG_PATH);

    return json(response, 200, { message: `已成功删除模组项目 ${project}` });
  } catch (error) {
    return json(response, 400, { error: error.message });
  }
}

async function updateGameVersionsHandler(request, response) {
  try {
    const webRequest = new Request("http://127.0.0.1" + request.url, { method: "POST", headers: request.headers, body: Readable.toWeb(request), duplex: "half" });
    const form = await webRequest.formData();
    const project = form.get("project");
    const version = form.get("version");
    const gameVersions = form.get("gameVersions");
    if (!project || !version) return json(response, 400, { error: "缺少 project 或 version 参数" });

    const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
    updateReleaseGameVersions(catalog, project, version, gameVersions);

    const temporaryPath = `${CATALOG_PATH}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    await rename(temporaryPath, CATALOG_PATH);

    const updatedProject = catalog.projects.find((p) => p.slug === project);
    const updatedRelease = updatedProject?.releases.find((r) => r.version === version);

    return json(response, 200, { message: `已成功更新版本 ${version} 的适用游戏版本范围`, gameVersions: updatedRelease?.gameVersions || [] });
  } catch (error) {
    return json(response, 400, { error: error.message });
  }
}

const MODRINTH_USER_AGENT = "hotpad100c/ModSite/1.0.0 (contact@ryan100c.party)";

async function getModrinthProjectsHandler(request, response) {
  const url = new URL(request.url, "http://127.0.0.1");
  const username = url.searchParams.get("user")?.trim() || "Ryan100c";
  const token = url.searchParams.get("token")?.trim();

  const headers = { "User-Agent": MODRINTH_USER_AGENT };
  if (token) headers["Authorization"] = token;

  try {
    const res = await fetch(`https://api.modrinth.com/v2/user/${encodeURIComponent(username)}/projects`, { headers });
    if (!res.ok) {
      const errText = await res.text();
      return json(response, res.status, { error: `Modrinth API 错误 (${res.status}): ${errText || res.statusText}` });
    }

    const projects = await res.json();
    const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));

    const enriched = projects.map((p) => {
      const existing = catalog.projects.find((cp) => cp.slug === p.slug || cp.slug === p.id);
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        icon_url: p.icon_url,
        downloads: p.downloads,
        followers: p.followers,
        versionsCount: p.versions?.length || 0,
        galleryCount: p.gallery?.length || 0,
        source_url: p.source_url,
        published: p.published,
        updated: p.updated,
        isExisting: !!existing,
        existingReleasesCount: existing?.releases?.length || 0
      };
    });

    return json(response, 200, { username, projects: enriched });
  } catch (error) {
    return json(response, 500, { error: error.message });
  }
}

async function syncModrinthProjectsHandler(request, response) {
  await loadEnv();
  const webRequest = new Request("http://127.0.0.1" + request.url, { method: "POST", headers: request.headers, body: Readable.toWeb(request), duplex: "half" });

  let payload;
  const contentType = request.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    payload = await webRequest.json();
  } else {
    const form = await webRequest.formData();
    payload = {
      projectIds: form.getAll("projectIds"),
      syncVersions: form.get("syncVersions") !== "false",
      uploadToR2: form.get("uploadToR2") === "true",
      overwrite: form.get("overwrite") !== "false",
      token: form.get("token") || ""
    };
  }

  const { projectIds, syncVersions = true, uploadToR2 = false, overwrite = true, token = "" } = payload;
  if (!projectIds || !Array.isArray(projectIds) || !projectIds.length) {
    return json(response, 400, { error: "请至少选择一个要同步的 Modrinth 项目" });
  }

  const headers = { "User-Agent": MODRINTH_USER_AGENT };
  if (token) headers["Authorization"] = token;

  const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const results = [];

  for (const pid of projectIds) {
    try {
      // 1. Fetch project details
      const pRes = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(pid)}`, { headers });
      if (!pRes.ok) throw new Error(`获取项目 ${pid} 失败: ${pRes.statusText}`);
      const projectData = await pRes.json();

      let versionsData = [];
      if (syncVersions) {
        const vRes = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(pid)}/version`, { headers });
        if (vRes.ok) {
          versionsData = await vRes.json();
        }
      }

      // 2. If uploadToR2 is requested, download and upload files to R2
      if (uploadToR2 && versionsData.length > 0) {
        const directory = await mkdtemp(join(tmpdir(), "modsite-modrinth-"));
        try {
          for (const ver of versionsData) {
            for (const file of ver.files || []) {
              if (!file.url) continue;
              const fileRes = await fetch(file.url);
              if (!fileRes.ok) continue;
              const buffer = Buffer.from(await fileRes.arrayBuffer());
              const safeName = basename(file.filename).replace(/[\x00-\x1f]/g, "_");
              const tempPath = join(directory, safeName);
              await writeFile(tempPath, buffer);

              const record = await fileRecord(tempPath, projectData.slug || pid, ver.version_number, config.downloadBaseUrl);
              upload(config.r2Bucket, record);
              file.url = record.public.url;
              file.hashes = file.hashes || {};
              file.hashes.sha256 = record.public.sha256;
            }
          }
        } finally {
          await rm(directory, { recursive: true, force: true });
        }
      }

      // 3. Sync into catalog
      const synced = syncModrinthProject(catalog, projectData, versionsData, { syncVersions, overwrite });
      results.push({ id: pid, slug: synced.slug, name: synced.name, versionsCount: synced.releases.length, success: true });
    } catch (err) {
      results.push({ id: pid, success: false, error: err.message });
    }
  }

  // Atomic write to catalog.json
  const temporaryPath = `${CATALOG_PATH}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await rename(temporaryPath, CATALOG_PATH);

  const successCount = results.filter((r) => r.success).length;
  return json(response, 200, {
    message: `已成功同步 ${successCount} / ${projectIds.length} 个项目`,
    results
  });
}

async function serveFile(request, response) {
  const parsedUrl = new URL(request.url, "http://127.0.0.1");
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // Redirect /site or /preview to trailing slash for proper relative URL resolution
  if (pathname === "/site" || pathname === "/preview") {
    response.writeHead(302, { Location: pathname + "/" });
    return response.end();
  }

  // If requesting local site preview (/site/* or /preview/*)
  if (pathname === "/site/" || pathname === "/preview/") {
    try {
      const content = await readFile(join(SITE_ROOT, "index.html"));
      response.writeHead(200, { "Content-Type": TYPES[".html"], "Cache-Control": "no-store" });
      return response.end(content);
    } catch {
      return response.writeHead(404).end("Not found");
    }
  }

  if (pathname.startsWith("/site/") || pathname.startsWith("/preview/")) {
    const relative = pathname.replace(/^\/(?:site|preview)\//, "");
    const filePath = resolve(SITE_ROOT, relative);
    if (!filePath.startsWith(SITE_ROOT + sep) && filePath !== join(SITE_ROOT, "index.html")) return response.writeHead(404).end();
    try {
      const content = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": TYPES[extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      return response.end(content);
    } catch {
      return response.writeHead(404).end("Not found");
    }
  }

  // If front-end fetches /catalog.json or /config.json directly
  if (pathname === "/catalog.json") {
    try {
      const content = await readFile(CATALOG_PATH);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return response.end(content);
    } catch {
      return response.writeHead(404).end("Not found");
    }
  }

  if (pathname === "/config.json") {
    try {
      const content = await readFile(CONFIG_PATH);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return response.end(content);
    } catch {
      return response.writeHead(404).end("Not found");
    }
  }

  // Default: Check Admin files, fallback to Site files
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const adminPath = resolve(ADMIN_ROOT, relative);
  if (adminPath.startsWith(ADMIN_ROOT + sep) || adminPath === join(ADMIN_ROOT, "index.html")) {
    try {
      const content = await readFile(adminPath);
      response.writeHead(200, {
        "Content-Type": TYPES[extname(adminPath)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'self' 'unsafe-inline'; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; base-uri 'none'; frame-ancestors 'none'"
      });
      return response.end(content);
    } catch {
      // If not found in admin, try site fallback below
    }
  }

  const sitePath = resolve(SITE_ROOT, relative);
  if (sitePath.startsWith(SITE_ROOT + sep) || sitePath === join(SITE_ROOT, "index.html")) {
    try {
      const content = await readFile(sitePath);
      response.writeHead(200, {
        "Content-Type": TYPES[extname(sitePath)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      return response.end(content);
    } catch {
      // Not in site either
    }
  }

  response.writeHead(404).end("Not found");
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/api/catalog") return json(response, 200, JSON.parse(await readFile(CATALOG_PATH, "utf8")));
    if (request.method === "POST" && request.url === "/api/inspect-jar") return await inspectJar(request, response);
    if (request.method === "POST" && (request.url === "/api/publish" || request.url === "/api/project/update")) return await publish(request, response);
    if (request.method === "POST" && request.url === "/api/project/delete") return await deleteProjectHandler(request, response);
    if (request.method === "POST" && request.url === "/api/release/delete") return await deleteReleaseHandler(request, response);
    if (request.method === "POST" && request.url === "/api/release/file/delete") return await deleteReleaseFileHandler(request, response);
    if (request.method === "POST" && request.url === "/api/release/file/add") return await addReleaseFileHandler(request, response);
    if (request.method === "POST" && request.url === "/api/release/game-versions/update") return await updateGameVersionsHandler(request, response);
    if (request.method === "GET" && request.url.startsWith("/api/modrinth/projects")) return await getModrinthProjectsHandler(request, response);
    if (request.method === "POST" && request.url === "/api/modrinth/sync") return await syncModrinthProjectsHandler(request, response);
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
