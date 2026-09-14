import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { inspectFabricJar } from "./fabric.mjs";

export function parseGradleProperties(content) {
  const props = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      props[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
  return props;
}

export async function inspectProjectDir(dirPath, catalogProjects = []) {
  let files = [];
  try {
    files = await readdir(dirPath);
  } catch {
    return null;
  }

  const hasGradleProps = files.includes("gradle.properties");
  const hasBuildGradle = files.includes("build.gradle") || files.includes("build.gradle.kts");
  const hasGradlew = files.includes("gradlew.bat") || files.includes("gradlew");

  if (!hasGradleProps && !hasBuildGradle) {
    return null;
  }

  const folderName = basename(dirPath);
  const result = {
    folderName,
    dirPath: resolve(dirPath),
    id: folderName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: folderName,
    version: "1.0.0",
    description: "",
    authors: [],
    gameVersions: [],
    loaders: ["Fabric"],
    iconDataUrl: "",
    source: "",
    hasGradlew,
    builtJars: [],
    primaryJar: null,
    isPublished: false,
    publishedReleasesCount: 0,
    latestPublishedVersion: "",
    isShelved: false
  };

  // 1. Parse gradle.properties
  let gradleProps = {};
  if (hasGradleProps) {
    try {
      const rawProps = await readFile(join(dirPath, "gradle.properties"), "utf8");
      gradleProps = parseGradleProperties(rawProps);
      if (gradleProps.archives_base_name || gradleProps.archivesBaseName) {
        result.id = gradleProps.archives_base_name || gradleProps.archivesBaseName;
      }
      if (gradleProps.mod_version || gradleProps.version) {
        result.version = gradleProps.mod_version || gradleProps.version;
      }
      if (gradleProps.minecraft_version) {
        result.gameVersions.push(gradleProps.minecraft_version);
      }
      if (gradleProps.mod_name) {
        result.name = gradleProps.mod_name;
      }
      if (gradleProps.mod_description) {
        result.description = gradleProps.mod_description;
      }
      if (gradleProps.mod_author || gradleProps.author) {
        result.authors.push(gradleProps.mod_author || gradleProps.author);
      }
    } catch {}
  }

  // 2. Parse fabric.mod.json
  const fabricJsonPath = join(dirPath, "src/main/resources/fabric.mod.json");
  try {
    const rawJson = await readFile(fabricJsonPath, "utf8");
    const json = JSON.parse(rawJson);
    if (json.id && (!result.id || result.id === folderName)) result.id = json.id;
    if (json.name && !json.name.startsWith("${")) result.name = json.name;
    if (json.version && !json.version.startsWith("${")) result.version = json.version;
    if (json.description) result.description = json.description;
    if (json.authors) {
      const parsedAuthors = Array.isArray(json.authors)
        ? json.authors.map((a) => (typeof a === "string" ? a : a.name)).filter(Boolean)
        : [String(json.authors)];
      if (parsedAuthors.length) result.authors = parsedAuthors;
    }
    if (json.contact?.sources) {
      result.source = json.contact.sources;
    }
    if (json.depends?.minecraft && !json.depends.minecraft.startsWith("${")) {
      const mcVer = String(json.depends.minecraft).replace(/^[~^>=<\s]+/, "");
      if (mcVer && !result.gameVersions.includes(mcVer)) result.gameVersions.push(mcVer);
    }

    // Try reading local icon file
    if (json.icon) {
      const iconFilePath = join(dirPath, "src/main/resources", json.icon);
      try {
        const iconBuf = await readFile(iconFilePath);
        result.iconDataUrl = `data:image/png;base64,${iconBuf.toString("base64")}`;
      } catch {}
    }
  } catch {}

  // Fallback search for icon if not found
  if (!result.iconDataUrl) {
    const candidateIconPaths = [
      join(dirPath, `src/main/resources/assets/${result.id}/icon.png`),
      join(dirPath, `src/main/resources/assets/${folderName.toLowerCase()}/icon.png`),
      join(dirPath, "src/main/resources/icon.png")
    ];
    for (const iconPath of candidateIconPaths) {
      try {
        const iconBuf = await readFile(iconPath);
        result.iconDataUrl = `data:image/png;base64,${iconBuf.toString("base64")}`;
        break;
      } catch {}
    }
  }

  // 3. Inspect build/libs
  const buildLibsPath = join(dirPath, "build/libs");
  try {
    const libFiles = await readdir(buildLibsPath);
    for (const f of libFiles) {
      if (f.endsWith(".jar") && !f.endsWith("-sources.jar") && !f.endsWith("-dev.jar") && !f.endsWith("-javadoc.jar")) {
        const jarPath = join(buildLibsPath, f);
        const jarStat = await stat(jarPath);
        result.builtJars.push({
          name: f,
          path: jarPath,
          size: jarStat.size,
          mtime: jarStat.mtime
        });
      }
    }

    // Sort built jars by newest mtime
    result.builtJars.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

    // If we have built jars, inspect the newest primary jar for exact runtime metadata
    if (result.builtJars.length > 0) {
      result.primaryJar = result.builtJars[0];
      try {
        const buf = await readFile(result.primaryJar.path);
        const jarInfo = inspectFabricJar(buf, result.primaryJar.name);
        if (jarInfo) {
          if (jarInfo.id) result.id = jarInfo.id;
          if (jarInfo.name) result.name = jarInfo.name;
          if (jarInfo.version) result.version = jarInfo.version;
          if (jarInfo.description) result.description = jarInfo.description;
          if (jarInfo.authors?.length) result.authors = jarInfo.authors;
          if (jarInfo.source) result.source = jarInfo.source;
          if (jarInfo.gameVersions?.length) result.gameVersions = jarInfo.gameVersions;
          if (jarInfo.loader) result.loaders = [jarInfo.loader];
          if (jarInfo.iconDataUrl) result.iconDataUrl = jarInfo.iconDataUrl;
        }
      } catch {}
    }
  } catch {}

  // 4. Compare with catalog
  const match = catalogProjects.find((p) => p.slug === result.id || p.slug === folderName.toLowerCase());
  if (match) {
    result.isPublished = true;
    result.publishedReleasesCount = match.releases?.length || 0;
    result.latestPublishedVersion = match.releases?.[0]?.version || "";
  }

  return result;
}

export async function scanWorkspace(rootDir = "c:\\coding", catalogProjects = []) {
  const root = resolve(rootDir);
  let entries = [];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (err) {
    throw new Error(`无法读取工作区目录 ${rootDir}: ${err.message}`);
  }

  const projects = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Skip node_modules, .git, .gradle, etc.
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

    const projectPath = join(root, entry.name);
    try {
      const proj = await inspectProjectDir(projectPath, catalogProjects);
      if (proj) {
        projects.push(proj);
      }
    } catch {}
  }

  // Sort: projects with built jars first, then alphabetical by name
  projects.sort((a, b) => {
    if (a.builtJars.length > 0 && b.builtJars.length === 0) return -1;
    if (a.builtJars.length === 0 && b.builtJars.length > 0) return 1;
    return a.name.localeCompare(b.name, "zh-CN");
  });

  return {
    rootDir: root,
    totalScanned: entries.filter((e) => e.isDirectory()).length,
    matchedCount: projects.length,
    projects
  };
}

export function executeGradleBuild(projectPath, task = "build -x test") {
  return new Promise((resolveRun) => {
    const isWindows = process.platform === "win32";
    const gradlewCmd = isWindows ? resolve(projectPath, "gradlew.bat") : resolve(projectPath, "gradlew");
    const args = task.trim().split(/\s+/).filter(Boolean);

    let child;
    if (isWindows) {
      // In Windows, run cmd.exe /c gradlew.bat ... to handle batch scripts cleanly
      child = spawn("cmd.exe", ["/c", gradlewCmd, ...args], {
        cwd: projectPath,
        shell: false,
        env: process.env
      });
    } else {
      child = spawn(gradlewCmd, args, {
        cwd: projectPath,
        shell: false,
        env: process.env
      });
    }

    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });

    child.on("error", (error) => {
      resolveRun({ code: 1, output: `启动构建进程失败: ${error.message}` });
    });

    child.on("close", (code) => {
      resolveRun({ code, output });
    });
  });
}
