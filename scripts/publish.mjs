import { createHash } from "node:crypto";
import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { inspectFabricJar } from "./fabric.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const CONFIG_PATH = resolve(ROOT, "site/config.json");
const CATALOG_PATH = resolve(ROOT, "site/catalog.json");
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function parseArgs(argv) {
  const options = { files: [] };
  const booleans = new Set(["dry-run", "help", "update-project-only", "allow-overwrite", "overwrite"]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      options.files.push(argument);
      continue;
    }
    const name = argument.slice(2);
    if (booleans.has(name)) {
      options[name] = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`参数 --${name} 缺少值`);
    options[name] = value;
    index += 1;
  }
  return options;
}

const csv = (value = "") => value.split(",").map((item) => item.trim()).filter(Boolean);
const encodeKey = (key) => key.split("/").map(encodeURIComponent).join("/");

export function getMimeType(filePath) {
  const ext = (extname(filePath) || "").toLowerCase();
  const map = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".avif": "image/avif"
  };
  return map[ext] || "application/octet-stream";
}

export async function imageRecord(filePath, project, type, downloadBaseUrl) {
  const absolutePath = resolve(filePath);
  const details = await stat(absolutePath);
  if (!details.isFile()) throw new Error(`${filePath} 不是有效图片文件`);
  if (details.size > MAX_FILE_SIZE) throw new Error(`${filePath} 超过 10MB`);
  const ext = (extname(absolutePath) || ".png").toLowerCase();
  const key = `images/${project}-${type}${ext}`;
  const mime = getMimeType(absolutePath);
  return {
    path: absolutePath,
    key,
    mime,
    url: `${downloadBaseUrl.replace(/\/$/, "")}/${encodeKey(key)}`
  };
}

export function applyProjectMetadata(catalog, options) {
  let project = catalog.projects.find((item) => item.slug === options.project);
  const authorsList = options.authors !== undefined
    ? (Array.isArray(options.authors) ? options.authors : csv(options.authors))
    : undefined;

  if (!project) {
    if (!options.name) throw new Error("新项目必须提供 --name");
    project = {
      slug: options.project,
      name: options.name,
      name_zh: options["name-zh"] || "",
      description: options.description || "",
      description_zh: options["description-zh"] || "",
      longDescription: options["long-description"] || "",
      longDescription_zh: options["long-description-zh"] || "",
      icon: options.icon || "",
      banner: options.banner || "",
      source: options.source || "",
      authors: authorsList || [],
      releases: []
    };
    catalog.projects.push(project);
  } else {
    if (options.name) project.name = options.name;
    if (options["name-zh"] !== undefined) project.name_zh = options["name-zh"];
    if (options.description !== undefined) project.description = options.description;
    if (options["description-zh"] !== undefined) project.description_zh = options["description-zh"];
    if (options["long-description"] !== undefined) project.longDescription = options["long-description"];
    if (options["long-description-zh"] !== undefined) project.longDescription_zh = options["long-description-zh"];
    if (options.icon !== undefined) project.icon = options.icon;
    if (options.banner !== undefined) project.banner = options.banner;
    if (options.source !== undefined) project.source = options.source;
    if (authorsList !== undefined) project.authors = authorsList;
  }
  catalog.projects.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  return project;
}

export function applyRelease(catalog, options, release) {
  let project = catalog.projects.find((item) => item.slug === options.project);
  if (project?.releases.some((item) => item.version === options.version)) {
    if (!options.overwrite && !options["allow-overwrite"]) {
      throw new Error(`项目 ${options.project} 已存在版本 ${options.version}`);
    }
    project.releases = project.releases.filter((item) => item.version !== options.version);
  }
  project = applyProjectMetadata(catalog, options);
  project.releases.unshift(release);
  return catalog;
}

export function removeProject(catalog, projectSlug) {
  const initialLength = catalog.projects.length;
  catalog.projects = catalog.projects.filter((item) => item.slug !== projectSlug);
  if (catalog.projects.length === initialLength) {
    throw new Error(`找不到项目 ${projectSlug}`);
  }
  return catalog;
}

export function updateReleaseGameVersions(catalog, projectSlug, version, gameVersions) {
  const project = catalog.projects.find((item) => item.slug === projectSlug);
  if (!project) throw new Error(`找不到项目 ${projectSlug}`);
  const release = project.releases.find((item) => item.version === version);
  if (!release) throw new Error(`项目 ${projectSlug} 中未找到版本 ${version}`);

  const versionsArray = Array.isArray(gameVersions)
    ? gameVersions.map((v) => String(v).trim()).filter(Boolean)
    : String(gameVersions || "")
        .split(/[,，\s]+/)
        .map((v) => v.trim())
        .filter(Boolean);

  if (!versionsArray.length) {
    throw new Error("游戏版本范围不能为空");
  }

  release.gameVersions = versionsArray;
  return catalog;
}

export function syncModrinthProject(catalog, modrinthProject, versions = [], options = {}) {
  const slug = modrinthProject.slug || modrinthProject.id;
  let project = catalog.projects.find((p) => p.slug === slug);

  let bannerUrl = "";
  if (modrinthProject.gallery && Array.isArray(modrinthProject.gallery) && modrinthProject.gallery.length > 0) {
    const featured = modrinthProject.gallery.find((g) => g.featured) || modrinthProject.gallery[0];
    bannerUrl = featured.raw_url || featured.url || "";
  }

  let authorsList = [];
  if (modrinthProject.authors && Array.isArray(modrinthProject.authors)) {
    authorsList = modrinthProject.authors;
  } else if (modrinthProject.author) {
    authorsList = [modrinthProject.author];
  } else if (modrinthProject.team_members && Array.isArray(modrinthProject.team_members)) {
    authorsList = modrinthProject.team_members.map((m) => m.user?.username || m.user?.name).filter(Boolean);
  }

  const projectMetadata = {
    slug,
    name: modrinthProject.title || modrinthProject.name || slug,
    description: modrinthProject.description || "",
    longDescription: modrinthProject.body || "",
    icon: modrinthProject.icon_url || "",
    banner: bannerUrl,
    source: modrinthProject.source_url || "",
    authors: authorsList
  };

  if (!project) {
    project = {
      ...projectMetadata,
      releases: []
    };
    catalog.projects.push(project);
  } else {
    project.name = projectMetadata.name;
    if (projectMetadata.description) project.description = projectMetadata.description;
    if (projectMetadata.longDescription) project.longDescription = projectMetadata.longDescription;
    if (projectMetadata.icon) project.icon = projectMetadata.icon;
    if (projectMetadata.banner) project.banner = projectMetadata.banner;
    if (projectMetadata.source) project.source = projectMetadata.source;
    if (projectMetadata.authors.length) project.authors = projectMetadata.authors;
  }

  if (options.syncVersions !== false && Array.isArray(versions) && versions.length > 0) {
    const releasesMap = new Map();

    for (const v of versions) {
      const verNum = v.version_number;
      const loaders = (v.loaders || []).map((l) => l.charAt(0).toUpperCase() + l.slice(1));
      const files = (v.files || []).map((f) => ({
        name: f.filename,
        size: f.size,
        sha256: f.hashes?.sha256 || "",
        sha512: f.hashes?.sha512 || "",
        url: f.url
      }));

      if (!releasesMap.has(verNum)) {
        releasesMap.set(verNum, {
          version: verNum,
          publishedAt: v.date_published || new Date().toISOString(),
          gameVersions: [...(v.game_versions || [])],
          loaders: [...loaders],
          notes: v.changelog || "",
          files: [...files]
        });
      } else {
        const existing = releasesMap.get(verNum);
        for (const gv of v.game_versions || []) {
          if (!existing.gameVersions.includes(gv)) {
            existing.gameVersions.push(gv);
          }
        }
        for (const ld of loaders) {
          if (!existing.loaders.includes(ld)) {
            existing.loaders.push(ld);
          }
        }
        for (const file of files) {
          const existingFileIdx = existing.files.findIndex((f) => f.name === file.name);
          if (existingFileIdx >= 0) {
            existing.files[existingFileIdx] = file;
          } else {
            existing.files.push(file);
          }
        }
        if (v.date_published && new Date(v.date_published) > new Date(existing.publishedAt)) {
          existing.publishedAt = v.date_published;
        }
        if (!existing.notes && v.changelog) {
          existing.notes = v.changelog;
        }
      }
    }

    const newReleases = Array.from(releasesMap.values());

    if (options.overwrite) {
      newReleases.forEach((newRel) => {
        const idx = project.releases.findIndex((r) => r.version === newRel.version);
        if (idx >= 0) {
          project.releases[idx] = newRel;
        } else {
          project.releases.push(newRel);
        }
      });
    } else {
      newReleases.forEach((newRel) => {
        if (!project.releases.some((r) => r.version === newRel.version)) {
          project.releases.push(newRel);
        }
      });
    }

    project.releases.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  }

  catalog.projects.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  return project;
}

export function removeRelease(catalog, projectSlug, version) {
  const project = catalog.projects.find((item) => item.slug === projectSlug);
  if (!project) throw new Error(`找不到项目 ${projectSlug}`);
  const initialLength = project.releases.length;
  project.releases = project.releases.filter((item) => item.version !== version);
  if (project.releases.length === initialLength) {
    throw new Error(`项目 ${projectSlug} 中未找到版本 ${version}`);
  }
  return catalog;
}

export function removeReleaseFile(catalog, projectSlug, version, fileName) {
  const project = catalog.projects.find((item) => item.slug === projectSlug);
  if (!project) throw new Error(`找不到项目 ${projectSlug}`);
  const release = project.releases.find((item) => item.version === version);
  if (!release) throw new Error(`项目 ${projectSlug} 中未找到版本 ${version}`);
  const initialLength = release.files.length;
  release.files = release.files.filter((item) => item.name !== fileName);
  if (release.files.length === initialLength) {
    throw new Error(`版本 ${version} 中未找到文件 ${fileName}`);
  }
  return catalog;
}

export function addReleaseFile(catalog, projectSlug, version, filePublicRecord) {
  const project = catalog.projects.find((item) => item.slug === projectSlug);
  if (!project) throw new Error(`找不到项目 ${projectSlug}`);
  const release = project.releases.find((item) => item.version === version);
  if (!release) throw new Error(`项目 ${projectSlug} 中未找到版本 ${version}`);
  const existingIndex = release.files.findIndex((item) => item.name === filePublicRecord.name);
  if (existingIndex >= 0) {
    release.files[existingIndex] = filePublicRecord;
  } else {
    release.files.push(filePublicRecord);
  }
  return catalog;
}

export async function fileRecord(filePath, project, version, downloadBaseUrl) {
  const absolutePath = resolve(filePath);
  const details = await stat(absolutePath);
  if (!details.isFile()) throw new Error(`${filePath} 不是文件`);
  if (details.size > MAX_FILE_SIZE) throw new Error(`${filePath} 超过 10MB`);
  const name = basename(absolutePath);
  const sha256 = createHash("sha256").update(await readFile(absolutePath)).digest("hex");
  const key = `releases/${project}/${version}/${sha256.slice(0, 12)}-${name}`;
  return {
    path: absolutePath,
    key,
    public: { name, size: details.size, sha256, url: `${downloadBaseUrl.replace(/\/$/, "")}/${encodeKey(key)}` }
  };
}

export function runWranglerUpload(args, targetName) {
  const wrangler = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env
  });

  if (result.status !== 0) {
    const rawOutput = ((result.stderr || "") + "\n" + (result.stdout || "")).trim();
    const cleanedOutput = rawOutput
      .split(/\r?\n/)
      .filter((line) => !line.includes("UV_HANDLE_CLOSING") && !line.includes("Assertion failed:"))
      .join("\n")
      .trim();

    if (rawOutput.includes("CLOUDFLARE_API_TOKEN") || rawOutput.includes("not authenticated") || rawOutput.includes("wrangler login")) {
      throw new Error(
        `Cloudflare 凭证未授权：请先在电脑终端（PowerShell 或 CMD）运行一次 "npx wrangler login" 完成登录；或者在项目根目录创建 .env 文件并配置 CLOUDFLARE_API_TOKEN=你的Token。\n\n详细提示：\n${cleanedOutput}`
      );
    }
    throw new Error(`上传 ${targetName} 失败：\n${cleanedOutput || rawOutput}`);
  }
}

export function upload(bucket, file) {
  const dispositionName = file.public.name.replace(/["\\\r\n]/g, "_");
  runWranglerUpload([
    "r2", "object", "put", `${bucket}/${file.key}`,
    "--file", file.path,
    "--content-type", "application/octet-stream",
    "--content-disposition", `attachment; filename="${dispositionName}"`,
    "--cache-control", "public, max-age=31536000, immutable",
    "--remote"
  ], file.public.name);
}

export function uploadImage(bucket, image) {
  runWranglerUpload([
    "r2", "object", "put", `${bucket}/${image.key}`,
    "--file", image.path,
    "--content-type", image.mime,
    "--cache-control", "public, max-age=86400",
    "--remote"
  ], image.key);
}

function usage() {
  console.log(`用法：
  发布新版本：
    npm run publish -- --project <slug> --version <版本> [选项] <文件...>
  仅更新项目资料/图片：
    npm run publish -- --project <slug> --icon-file <图标文件> --banner-file <横幅文件> [选项]

选项：
  --name <名称>              新项目必填
  --description <简介>       项目简介
  --long-description <介绍>  详情页介绍
  --icon <URL>               项目图标地址
  --icon-file <文件路径>     本地图标图片文件（自动上传至 R2 images/<slug>-icon.<ext>）
  --banner <URL>             项目 banner 地址
  --banner-file <文件路径>   本地横幅图片文件（自动上传至 R2 images/<slug>-banner.<ext>）
  --source <URL>             项目源码仓库连接
  --authors <作者,作者>      项目作者列表（逗号分隔）
  --game <版本,版本>         支持的游戏版本（Fabric jar 会尝试自动提取）
  --loader <名称,名称>       例如 Fabric,Forge（Fabric jar 自动提取）
  --notes <说明>             版本说明
  --update-project-only      仅更新项目资料与图片，不发布新版本
  --dry-run                  仅验证和预览，不上传或修改清单

示例：
  发布版本并上传图标：
    npm run publish -- --project demo --name "示例模组" --version 1.0.0 --icon-file .\\icon.png .\\demo.jar
  仅更换 banner：
    npm run publish -- --project demo --banner-file .\\banner.webp`);
}

export async function loadEnv() {
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

async function main() {
  await loadEnv();
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();

  // 若传入了 .jar 文件，尝试自动从 fabric.mod.json 补全元数据
  for (const filePath of options.files) {
    if (filePath.toLowerCase().endsWith(".jar")) {
      const info = inspectFabricJar(filePath, basename(filePath));
      if (info) {
        if (!options.project && info.id) options.project = info.id;
        if (!options.name && info.name) options.name = info.name;
        if (!options.description && info.description) options.description = info.description;
        if (!options.version && info.version) options.version = info.version;
        if (!options.game && info.gameVersions.length) options.game = info.gameVersions.join(",");
        if (!options.loader) options.loader = info.loader;
        if (!options.source && info.source) options.source = info.source;
        if (!options.authors && info.authors.length) options.authors = info.authors.join(",");
        break;
      }
    }
  }

  if (!options.project || !/^[a-z0-9][a-z0-9-]*$/.test(options.project)) {
    throw new Error("--project 必须由小写字母、数字和连字符组成");
  }

  const [config, catalog] = await Promise.all([
    readFile(CONFIG_PATH, "utf8").then(JSON.parse),
    readFile(CATALOG_PATH, "utf8").then(JSON.parse)
  ]);
  if (!config.r2Bucket || !config.downloadBaseUrl) throw new Error("site/config.json 缺少 R2 配置");
  if (!options["dry-run"] && config.downloadBaseUrl.includes("example.com")) {
    throw new Error("请先把 site/config.json 中的 downloadBaseUrl 改为真实域名");
  }

  let iconImage = null;
  if (options["icon-file"]) {
    iconImage = await imageRecord(options["icon-file"], options.project, "icon", config.downloadBaseUrl);
    options.icon = iconImage.url;
  }

  let bannerImage = null;
  if (options["banner-file"]) {
    bannerImage = await imageRecord(options["banner-file"], options.project, "banner", config.downloadBaseUrl);
    options.banner = bannerImage.url;
  }

  const isUpdateProjectOnly = options["update-project-only"] || (!options.version && !options.files.length);

  if (isUpdateProjectOnly) {
    applyProjectMetadata(catalog, options);
    console.log(`准备更新模组项目信息：${options.project}`);
    if (options.source) console.log(`  源码: ${options.source}`);
    if (options.authors) console.log(`  作者: ${options.authors}`);
    if (iconImage) console.log(`  图标: ${iconImage.path} -> ${iconImage.key} (${iconImage.url})`);
    if (bannerImage) console.log(`  横幅: ${bannerImage.path} -> ${bannerImage.key} (${bannerImage.url})`);

    if (options["dry-run"]) {
      console.log("验证通过；dry-run 未写入任何内容。");
      return;
    }

    if (iconImage) uploadImage(config.r2Bucket, iconImage);
    if (bannerImage) uploadImage(config.r2Bucket, bannerImage);

    const temporaryPath = `${CATALOG_PATH}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    await rename(temporaryPath, CATALOG_PATH);
    console.log("模组项目资料与图片已更新完成。运行 npm run deploy 更新网站。");
    return;
  }

  if (!options.version || !/^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(options.version)) {
    throw new Error("--version 缺失或包含不支持的字符");
  }
  if (!options.files.length) throw new Error("发布新版本至少需要提供一个文件");

  const files = await Promise.all(options.files.map((file) => fileRecord(file, options.project, options.version, config.downloadBaseUrl)));
  if (new Set(files.map((file) => file.public.name)).size !== files.length) throw new Error("同一版本中不能包含同名文件");
  const release = {
    version: options.version,
    publishedAt: new Date().toISOString(),
    gameVersions: csv(options.game),
    loaders: csv(options.loader),
    notes: options.notes || "",
    files: files.map((file) => file.public)
  };
  applyRelease(catalog, options, release);

  console.log(`准备发布 ${options.project} ${options.version}（${files.length} 个版本文件）`);
  if (options.source) console.log(`  源码: ${options.source}`);
  if (options.authors) console.log(`  作者: ${options.authors}`);
  if (iconImage) console.log(`  图标: ${iconImage.path} -> ${iconImage.key} (${iconImage.url})`);
  if (bannerImage) console.log(`  横幅: ${bannerImage.path} -> ${bannerImage.key} (${bannerImage.url})`);
  files.forEach((file) => console.log(`  ${file.public.name} -> ${file.key}`));
  if (options["dry-run"]) return console.log("验证通过；dry-run 未写入任何内容。");

  if (iconImage) uploadImage(config.r2Bucket, iconImage);
  if (bannerImage) uploadImage(config.r2Bucket, bannerImage);
  files.forEach((file) => upload(config.r2Bucket, file));

  const temporaryPath = `${CATALOG_PATH}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await rename(temporaryPath, CATALOG_PATH);
  console.log("发布完成。运行 npm run deploy 更新网站。");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`发布失败：${error.message}`);
    process.exitCode = 1;
  });
}
