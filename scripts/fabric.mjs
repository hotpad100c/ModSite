import AdmZip from "adm-zip";
import { extname } from "node:path";

export function parseFabricModJson(modJson = {}, filename = "") {
  // 1. 源码链接
  const contact = modJson.contact || {};
  const source = contact.sources || contact.source || contact.homepage || contact.github || modJson.custom?.sources || "";

  // 2. 作者列表
  let authors = [];
  if (Array.isArray(modJson.authors)) {
    authors = modJson.authors
      .map((item) => (typeof item === "string" ? item.trim() : (item?.name || "").trim()))
      .filter(Boolean);
  } else if (typeof modJson.authors === "string" && modJson.authors.trim()) {
    authors = [modJson.authors.trim()];
  }

  // 3. 支持的游戏版本
  const gameVersions = [];
  const mcDep = modJson.depends?.minecraft;
  if (Array.isArray(mcDep)) {
    mcDep.forEach((v) => {
      const matches = String(v).match(/\d+\.\d+(?:\.\d+)?/g);
      if (matches) gameVersions.push(...matches);
    });
  } else if (typeof mcDep === "string") {
    const matches = mcDep.match(/\d+\.\d+(?:\.\d+)?/g);
    if (matches) gameVersions.push(...matches);
  }

  // 若 depends.minecraft 未指定具体版本，从文件名尝试提取（如 lucidity-2.0.2+1.21.1.jar）
  if (!gameVersions.length && filename) {
    const fnMatch = filename.match(/\+(\d+\.\d+(?:\.\d+)?)/) || filename.match(/mc(\d+\.\d+(?:\.\d+)?)/i);
    if (fnMatch) gameVersions.push(fnMatch[1]);
  }

  // 4. 模组基本信息
  const id = modJson.id || "";
  const name = modJson.name || "";
  const version = modJson.version || "";
  const description = modJson.description || "";
  const iconPath = typeof modJson.icon === "string" ? modJson.icon : (modJson.icon?.["128"] || modJson.icon?.["64"] || "");

  return {
    isFabric: true,
    id,
    name,
    version,
    description,
    authors: [...new Set(authors)],
    source,
    gameVersions: [...new Set(gameVersions)],
    loader: "Fabric",
    iconPath
  };
}

export function inspectFabricJar(filePathOrBuffer, filename = "") {
  try {
    const zip = new AdmZip(filePathOrBuffer);
    const modJsonEntry = zip.getEntry("fabric.mod.json");
    if (!modJsonEntry) return null;

    const modJsonText = zip.readAsText(modJsonEntry);
    const modJson = JSON.parse(modJsonText);
    const result = parseFabricModJson(modJson, filename);

    // 尝试提取内嵌图标
    if (result.iconPath) {
      const cleanPath = result.iconPath.replace(/^\/+/, "");
      const iconEntry = zip.getEntry(cleanPath) || zip.getEntry(`assets/${result.id}/icon.png`);
      if (iconEntry) {
        const ext = (extname(cleanPath) || ".png").toLowerCase().replace(".", "");
        const mime = ext === "webp" ? "image/webp" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
        const iconBuf = zip.readFile(iconEntry);
        if (iconBuf && iconBuf.length) {
          result.iconDataUrl = `data:${mime};base64,${iconBuf.toString("base64")}`;
        }
      }
    }

    return result;
  } catch (error) {
    console.error("解析 Jar 文件失败:", error.message);
    return null;
  }
}
