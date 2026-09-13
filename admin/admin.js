const form = document.querySelector("#publish-form");
const fileInput = document.querySelector("#files");
const fileList = document.querySelector("#file-list");
const publishButton = document.querySelector("#publish");
const updateProjectButton = document.querySelector("#update-project-btn");
const deployButton = document.querySelector("#deploy");
const dialog = document.querySelector("#result-dialog");
const output = document.querySelector("#result-output");
const title = document.querySelector("#result-title");
const jarParsedBadge = document.querySelector("#jar-parsed-badge");

const iconFileInput = document.querySelector("#icon-file");
const iconUrlInput = document.querySelector("#icon-url");
const iconPreview = document.querySelector("#icon-preview");
const iconHint = document.querySelector("#icon-hint");

const bannerFileInput = document.querySelector("#banner-file");
const bannerUrlInput = document.querySelector("#banner-url");
const bannerPreview = document.querySelector("#banner-preview");
const bannerHint = document.querySelector("#banner-hint");

const projectInput = document.querySelector("#project-input");
const versionInput = document.querySelector("#version-input");

let projects = [];

const size = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";

function showResult(ok, message) {
  title.textContent = ok ? "操作完成" : "操作失败";
  output.textContent = message;
  dialog.showModal();
}

function updateImagePreview(previewEl, url, emptyText = "无图片") {
  previewEl.replaceChildren();
  if (url) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "预览";
    previewEl.append(img);
  } else {
    const span = document.createElement("span");
    span.className = "preview-empty";
    span.textContent = emptyText;
    previewEl.append(span);
  }
}

function updateImageHints() {
  const slug = projectInput.value.trim() || "[id]";

  if (iconFileInput.files && iconFileInput.files[0]) {
    const file = iconFileInput.files[0];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase() || ".png";
    iconHint.textContent = `已选本地文件: ${file.name} ➡️ 将上传到 R2: images/${slug}-icon${ext}`;
    updateImagePreview(iconPreview, URL.createObjectURL(file));
  } else if (iconUrlInput.value.trim()) {
    iconHint.textContent = `当前图标 URL: ${iconUrlInput.value.trim()}`;
    updateImagePreview(iconPreview, iconUrlInput.value.trim());
  } else {
    iconHint.textContent = `选择本地图片上传到 R2 (images/${slug}-icon.ext)`;
    updateImagePreview(iconPreview, null, "无图标");
  }

  if (bannerFileInput.files && bannerFileInput.files[0]) {
    const file = bannerFileInput.files[0];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase() || ".png";
    bannerHint.textContent = `已选本地文件: ${file.name} ➡️ 将上传到 R2: images/${slug}-banner${ext}`;
    updateImagePreview(bannerPreview, URL.createObjectURL(file));
  } else if (bannerUrlInput.value.trim()) {
    bannerHint.textContent = `当前横幅 URL: ${bannerUrlInput.value.trim()}`;
    updateImagePreview(bannerPreview, bannerUrlInput.value.trim());
  } else {
    bannerHint.textContent = `选择本地图片上传到 R2 (images/${slug}-banner.ext)`;
    updateImagePreview(bannerPreview, null, "无横幅");
  }
}

async function inspectJarFile(file) {
  if (!jarParsedBadge) return;
  jarParsedBadge.style.display = "block";
  jarParsedBadge.innerHTML = "<em>正在自动解析 Fabric 模组信息…</em>";

  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/inspect-jar", { method: "POST", body: formData });
    if (!response.ok) throw new Error("无法解析 Jar 文件");
    const data = await response.json();

    if (!data.isFabric) {
      jarParsedBadge.style.display = "none";
      return;
    }

    if (!form.elements.project.value.trim() && data.id) {
      form.elements.project.value = data.id;
    }
    if (!form.elements.name.value.trim() && data.name) {
      form.elements.name.value = data.name;
    }
    if (!form.elements.description.value.trim() && data.description) {
      form.elements.description.value = data.description;
    }
    if (data.gameVersions && data.gameVersions.length) {
      form.elements.game.value = data.gameVersions.join(",");
    }
    if (data.loader) {
      form.elements.loader.value = data.loader;
    }
    if (data.version && !form.elements.version.value.trim()) {
      form.elements.version.value = data.version;
    }
    if (data.authors && data.authors.length && !form.elements.authors.value.trim()) {
      form.elements.authors.value = data.authors.join(", ");
    }
    if (data.source && !form.elements.source.value.trim()) {
      form.elements.source.value = data.source;
    }

    updateImageHints();

    jarParsedBadge.innerHTML = `<strong>✨ 已自动从 fabric.mod.json 提取模组信息：</strong>` +
      `模组: ${data.name || data.id} (${data.id}) · 游戏版本: ${data.gameVersions.join(", ") || "未指定"} · 加载器: ${data.loader}` +
      (data.authors.length ? ` · 作者: ${data.authors.join(", ")}` : "") +
      (data.source ? ` · 源码: <a href="${data.source}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);">${data.source}</a>` : "");
  } catch (error) {
    jarParsedBadge.style.display = "none";
    console.warn("解析 jar 失败:", error);
  }
}

function renderFiles() {
  fileList.replaceChildren();
  const files = [...fileInput.files];
  files.forEach((file) => {
    const item = document.createElement("li");
    item.textContent = file.name + " · " + size(file.size);
    if (file.size > 10 * 1024 * 1024) item.className = "invalid";
    fileList.append(item);
  });

  const firstJar = files.find((f) => f.name.toLowerCase().endsWith(".jar"));
  if (firstJar) {
    inspectJarFile(firstJar);
  } else if (jarParsedBadge) {
    jarParsedBadge.style.display = "none";
  }
}

function renderProjects() {
  const root = document.querySelector("#existing-projects");
  const list = document.querySelector("#projects-list");
  root.replaceChildren();
  list.replaceChildren();
  document.querySelector("#project-count").textContent = projects.length + " 个项目";
  if (!projects.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "还没有发布项目。";
    root.append(empty);
    return;
  }
  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.slug;
    option.label = project.name;
    list.append(option);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-choice";
    const name = document.createElement("strong");
    name.textContent = project.name;
    const meta = document.createElement("span");
    meta.textContent = project.slug + " · " + project.releases.length + " 个版本";
    button.append(name, meta);
    button.addEventListener("click", () => {
      form.elements.project.value = project.slug;
      form.elements.name.value = project.name || "";
      form.elements.description.value = project.description || "";
      form.elements["long-description"].value = project.longDescription || "";
      form.elements.icon.value = project.icon || "";
      form.elements.banner.value = project.banner || "";
      form.elements.authors.value = (project.authors || []).join(", ");
      form.elements.source.value = project.source || "";
      iconFileInput.value = "";
      bannerFileInput.value = "";
      updateImageHints();
      form.elements.version.focus();
    });
    root.append(button);
  });
}

async function refreshProjects() {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  projects = (await response.json()).projects;
  renderProjects();
}

fileInput.addEventListener("change", renderFiles);
iconFileInput.addEventListener("change", updateImageHints);
bannerFileInput.addEventListener("change", updateImageHints);
iconUrlInput.addEventListener("input", updateImageHints);
bannerUrlInput.addEventListener("input", updateImageHints);
projectInput.addEventListener("input", updateImageHints);

// 仅更新项目信息与图片
updateProjectButton.addEventListener("click", async () => {
  const projectSlug = projectInput.value.trim();
  if (!projectSlug || !/^[a-z0-9][a-z0-9-]*$/.test(projectSlug)) {
    return showResult(false, "请填写有效的项目标识（由小写字母、数字和连字符组成）。");
  }

  const existingProject = projects.find((p) => p.slug === projectSlug);
  if (!existingProject && !form.elements.name.value.trim()) {
    return showResult(false, "新项目必须提供项目名称。");
  }

  updateProjectButton.disabled = true;
  updateProjectButton.textContent = form.elements.dryRun.checked ? "正在验证…" : "正在保存项目资料与上传图片…";

  try {
    const formData = new FormData(form);
    formData.set("updateProjectOnly", "true");
    const response = await fetch("/api/project/update", { method: "POST", body: formData });
    const result = await response.json();
    showResult(response.ok, result.message || result.error);
    if (response.ok && !form.elements.dryRun.checked) {
      await refreshProjects();
      const updated = projects.find((p) => p.slug === projectSlug);
      if (updated) {
        form.elements.icon.value = updated.icon || "";
        form.elements.banner.value = updated.banner || "";
        form.elements.authors.value = (updated.authors || []).join(", ");
        form.elements.source.value = updated.source || "";
        iconFileInput.value = "";
        bannerFileInput.value = "";
        updateImageHints();
      }
    }
  } catch (error) {
    showResult(false, error.message);
  } finally {
    updateProjectButton.disabled = false;
    updateProjectButton.textContent = "仅更新模组资料与图片";
  }
});

// 发布新版本
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const projectSlug = projectInput.value.trim();
  if (!projectSlug || !/^[a-z0-9][a-z0-9-]*$/.test(projectSlug)) {
    return showResult(false, "请填写有效的项目标识。");
  }

  const version = versionInput.value.trim();
  if (!version || !/^[A-Za-z0-9][A-Za-z0-9._+\-]*$/.test(version)) {
    return showResult(false, "请填写有效的版本号。");
  }

  if (!fileInput.files || !fileInput.files.length) {
    return showResult(false, "发布版本请在第 3 步选择至少一个版本文件（如 .jar）。");
  }

  if ([...fileInput.files].some((file) => file.size > 10 * 1024 * 1024)) {
    return showResult(false, "存在超过 10MB 的发布文件。");
  }

  publishButton.disabled = true;
  publishButton.textContent = form.elements.dryRun.checked ? "正在验证…" : "正在上传…";

  try {
    const response = await fetch("/api/publish", { method: "POST", body: new FormData(form) });
    const result = await response.json();
    showResult(response.ok, result.message || result.error);
    if (response.ok && !form.elements.dryRun.checked) {
      await refreshProjects();
      fileInput.value = "";
      iconFileInput.value = "";
      bannerFileInput.value = "";
      if (jarParsedBadge) jarParsedBadge.style.display = "none";
      renderFiles();
      updateImageHints();
    }
  } catch (error) {
    showResult(false, error.message);
  } finally {
    publishButton.disabled = false;
    publishButton.textContent = "发布版本";
  }
});

deployButton.addEventListener("click", async () => {
  deployButton.disabled = true;
  deployButton.textContent = "正在部署…";
  try {
    const response = await fetch("/api/deploy", { method: "POST" });
    const result = await response.json();
    showResult(response.ok, result.message || result.error);
  } catch (error) {
    showResult(false, error.message);
  } finally {
    deployButton.disabled = false;
    deployButton.textContent = "部署公开网站";
  }
});

refreshProjects().catch((error) => showResult(false, error.message));
