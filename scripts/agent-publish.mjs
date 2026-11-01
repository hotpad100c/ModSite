import { createHash, createHmac } from "node:crypto";
import { appendFile, mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import AdmZip from "adm-zip";
import { parseFabricModJson } from "./fabric.mjs";
import { applyRelease, fileRecord, parseArgs } from "./publish.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const CONFIG_PATH = resolve(ROOT, "site/config.json");
const CATALOG_PATH = resolve(ROOT, "site/catalog.json");
const AGENT_DIR = process.env.MODSITE_AGENT_DIR || resolve(homedir(), ".modsite");
const ENV_PATH = resolve(AGENT_DIR, "agent.env");
const LOG_PATH = resolve(AGENT_DIR, "agent-publish.log");
const MAX_FILES = 4;
const DEFAULT_DAILY_LIMIT = 20;
const ALLOWED_OPTIONS = new Set(["project", "version", "game", "loader", "notes", "dry-run", "help", "files"]);

export function readJarModId(filePath) {
  const zip = new AdmZip(filePath);
  const fabric = zip.getEntry("fabric.mod.json");
  if (fabric) {
    const info = parseFabricModJson(JSON.parse(zip.readAsText(fabric)), basename(filePath));
    return { id: info.id, version: info.version, gameVersions: info.gameVersions, loader: "Fabric" };
  }
  for (const [entryName, loader] of [["META-INF/neoforge.mods.toml", "NeoForge"], ["META-INF/mods.toml", "Forge"]]) {
    const entry = zip.getEntry(entryName);
    if (!entry) continue;
    const toml = zip.readAsText(entry);
    const id = toml.match(/^\s*modId\s*=\s*"([^"]+)"/m)?.[1] || "";
    const version = toml.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1] || "";
    return { id, version, gameVersions: [], loader };
  }
  return null;
}

export function jarMatchesProject(modId, project) {
  if (!modId) return false;
  const accepted = [project.slug, project.slug.replace(/-/g, ""), project.slug.replace(/-/g, "_"), ...(project.modIds || [])];
  return accepted.includes(modId);
}

export function validateRequest(options, catalog) {
  for (const key of Object.keys(options)) {
    if (!ALLOWED_OPTIONS.has(key)) throw new Error(`agent-publish 不支持参数 --${key}`);
  }
  if (!options.project || !/^[a-z0-9][a-z0-9-]*$/.test(options.project)) throw new Error("--project 必须由小写字母、数字和连字符组成");
  if (!options.version || !/^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(options.version)) throw new Error("--version 缺失或包含不支持的字符");
  const project = catalog.projects.find((item) => item.slug === options.project);
  if (!project) throw new Error(`项目 ${options.project} 不存在；新项目请由站长手动创建`);
  if (project.releases.some((item) => item.version === options.version)) throw new Error(`项目 ${options.project} 已存在版本 ${options.version}，agent 不能覆盖`);
  if (!options.files.length) throw new Error("至少需要提供一个 .jar 文件");
  if (options.files.length > MAX_FILES) throw new Error(`每次最多上传 ${MAX_FILES} 个文件`);
  for (const file of options.files) {
    if (!file.toLowerCase().endsWith(".jar")) throw new Error(`${file} 不是 .jar 文件`);
  }
  if (options.notes && options.notes.length > 4000) throw new Error("--notes 过长");
  return project;
}

export async function loadAgentEnv(path = ENV_PATH) {
  let content;
  try {
    content = await readFile(path, "utf8");
  } catch {
    throw new Error(`找不到 agent 凭证文件 ${path}`);
  }
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  for (const key of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]) {
    if (!env[key]) throw new Error(`${path} 缺少 ${key}`);
  }
  return env;
}

const sha256Hex = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
const encodeKey = (key) => key.split("/").map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");

export function signV4({ method, host, path, region, accessKeyId, secretAccessKey, headers, payloadHash, amzDate }) {
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${region}/s3/aws4_request`;
  const all = { ...headers, host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  const lower = Object.fromEntries(Object.entries(all).map(([name, value]) => [name.toLowerCase(), String(value).trim()]));
  const names = Object.keys(lower).sort();
  const canonical = [method, path, "", ...names.map((name) => `${name}:${lower[name]}`), "", names.join(";"), payloadHash].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonical)].join("\n");
  const signingKey = [region, "s3", "aws4_request"].reduce((acc, part) => hmac(acc, part), hmac(`AWS4${secretAccessKey}`, date));
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");
  delete lower.host;
  return { ...lower, authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}` };
}

export function signPutRequest({ accountId, accessKeyId, secretAccessKey, bucket, key, body, headers, now = new Date() }) {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const path = `/${bucket}/${encodeKey(key)}`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    url: `https://${host}${path}`,
    headers: signV4({ method: "PUT", host, path, region: "auto", accessKeyId, secretAccessKey, headers, payloadHash: sha256Hex(body), amzDate })
  };
}

async function putObject(env, bucket, file) {
  const body = await readFile(file.path);
  const dispositionName = file.public.name.replace(/["\\\r\n]/g, "_");
  const { url, headers } = signPutRequest({
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket,
    key: file.key,
    body,
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${dispositionName}"`,
      "cache-control": "public, max-age=31536000, immutable",
      "if-none-match": "*"
    }
  });
  const response = await fetch(url, { method: "PUT", headers, body });
  if (response.status === 412) return;
  if (!response.ok) throw new Error(`上传 ${file.public.name} 失败：HTTP ${response.status} ${await response.text()}`);
}

export async function uploadsToday(logPath = LOG_PATH, now = new Date()) {
  let content = "";
  try {
    content = await readFile(logPath, "utf8");
  } catch {}
  const today = now.toISOString().slice(0, 10);
  return content.split(/\r?\n/).filter(Boolean).reduce((count, line) => {
    try {
      const entry = JSON.parse(line);
      return entry.ok && entry.at?.startsWith(today) ? count + entry.files.length : count;
    } catch {
      return count;
    }
  }, 0);
}

async function withCatalogLock(action) {
  const lockPath = `${CATALOG_PATH}.lock`;
  let handle;
  for (let attempt = 0; attempt < 50 && !handle; attempt += 1) {
    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      await new Promise((done) => setTimeout(done, 200));
    }
  }
  if (!handle) throw new Error(`${lockPath} 被占用；如无其他发布在进行，可删除该文件`);
  try {
    return await action();
  } finally {
    await handle.close();
    await rm(lockPath, { force: true });
  }
}

function usage() {
  console.log(`供 AI agent 使用的受限发布命令：只能给已有项目追加新版本，不能覆盖、删除或修改项目资料。

用法：
  npm run agent-publish -- --project <slug> --version <版本> [--game 1.21.1,1.21.2] [--loader Fabric] [--notes <说明>] [--dry-run] <jar...>

凭证：${ENV_PATH}（R2_ACCOUNT_ID、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY，可选 AGENT_DAILY_LIMIT）
日志：${LOG_PATH}
完成后不会部署；由站长检查后运行 npm run deploy。`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();

  const [config, catalog] = await Promise.all([
    readFile(CONFIG_PATH, "utf8").then(JSON.parse),
    readFile(CATALOG_PATH, "utf8").then(JSON.parse)
  ]);
  const project = validateRequest(options, catalog);

  const jars = options.files.map((file) => ({ file, info: readJarModId(file) }));
  for (const { file, info } of jars) {
    if (!info) throw new Error(`${file} 不是 Fabric/NeoForge/Forge 模组`);
    if (!jarMatchesProject(info.id, project)) throw new Error(`${file} 的 mod id "${info.id}" 与项目 ${project.slug} 不符`);
  }

  const files = await Promise.all(options.files.map((file) => fileRecord(file, options.project, options.version, config.downloadBaseUrl)));
  if (new Set(files.map((file) => file.public.name)).size !== files.length) throw new Error("同一版本中不能包含同名文件");

  const detectedGames = [...new Set(jars.flatMap(({ info }) => info.gameVersions))];
  const detectedLoaders = [...new Set(jars.map(({ info }) => info.loader))];
  const csv = (value = "") => value.split(",").map((item) => item.trim()).filter(Boolean);
  const release = {
    version: options.version,
    publishedAt: new Date().toISOString(),
    gameVersions: options.game ? csv(options.game) : detectedGames,
    loaders: options.loader ? csv(options.loader) : detectedLoaders,
    notes: options.notes || "",
    files: files.map((file) => file.public),
    publishedBy: "agent"
  };

  console.log(`准备发布 ${options.project} ${options.version}（${files.length} 个文件）`);
  files.forEach((file) => console.log(`  ${file.public.name} -> ${file.key}`));
  if (options["dry-run"]) return console.log("验证通过；dry-run 未上传，也未修改清单。");

  const env = await loadAgentEnv();
  const limit = Number(env.AGENT_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT;
  if ((await uploadsToday()) + files.length > limit) throw new Error(`已达到每日上传上限 ${limit} 个文件`);

  await mkdir(AGENT_DIR, { recursive: true });
  const logEntry = { at: new Date().toISOString(), project: options.project, version: options.version, files: files.map((file) => file.key), ok: false };
  try {
    for (const file of files) await putObject(env, config.r2Bucket, file);
    await withCatalogLock(async () => {
      const fresh = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
      applyRelease(fresh, { project: options.project, version: options.version }, release);
      const temporaryPath = `${CATALOG_PATH}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify(fresh, null, 2)}\n`, "utf8");
      await rename(temporaryPath, CATALOG_PATH);
    });
    logEntry.ok = true;
  } catch (error) {
    logEntry.error = error.message;
    throw error;
  } finally {
    await appendFile(LOG_PATH, `${JSON.stringify(logEntry)}\n`, "utf8");
  }
  console.log("已上传并写入 site/catalog.json；未部署，等待站长检查后运行 npm run deploy。");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`agent 发布失败：${error.message}`);
    process.exitCode = 1;
  });
}
