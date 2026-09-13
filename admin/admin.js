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
const multiJarTip = document.querySelector("#multi-jar-tip");
const switchToBatchBtn = document.querySelector("#switch-to-batch-btn");

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

// Batch Upload Components
const tabSingle = document.querySelector("#tab-single");
const tabBatch = document.querySelector("#tab-batch");
const batchSection = document.querySelector("#batch-section");
const batchFilesInput = document.querySelector("#batch-files-input");
const batchDropZone = document.querySelector("#batch-drop-zone");
const batchControl = document.querySelector("#batch-control");
const batchCountText = document.querySelector("#batch-count-text");
const batchDetailText = document.querySelector("#batch-detail-text");
const batchOverwriteCheck = document.querySelector("#batch-overwrite-check");
const batchDryrunCheck = document.querySelector("#batch-dryrun-check");
const batchClearBtn = document.querySelector("#batch-clear-btn");
const batchUploadBtn = document.querySelector("#batch-upload-btn");
const batchProgressBox = document.querySelector("#batch-progress-box");
const batchProgressLabel = document.querySelector("#batch-progress-label");
const batchProgressPercent = document.querySelector("#batch-progress-percent");
const batchProgressBar = document.querySelector("#batch-progress-bar");
const batchQueueList = document.querySelector("#batch-queue-list");

// Manage Releases Components
const tabManage = document.querySelector("#tab-manage");
const manageSection = document.querySelector("#manage-section");
const manageProjectSelect = document.querySelector("#manage-project-select");
const manageProjectBadge = document.querySelector("#manage-project-badge");
const manageReleasesList = document.querySelector("#manage-releases-list");

let projects = [];
let batchQueue = [];
let isBatchUploading = false;

const size = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";

function showResult(ok, message) {
  title.textContent = ok ? "操作完成" : "操作失败";
  output.textContent = message;
  dialog.showModal();
}

function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
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

  const jarFiles = files.filter((f) => f.name.toLowerCase().endsWith(".jar"));
  if (jarFiles.length > 1) {
    multiJarTip.style.display = "block";
  } else {
    multiJarTip.style.display = "none";
  }

  const firstJar = jarFiles[0];
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
      if (tabManage.classList.contains("active")) {
        manageProjectSelect.value = project.slug;
        renderManageReleases(project.slug);
        return;
      }
      switchMode("single");
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

function updateManageProjectSelect() {
  const currentVal = manageProjectSelect.value;
  manageProjectSelect.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- 请选择模组 --";
  manageProjectSelect.append(defaultOption);

  projects.forEach((proj) => {
    const opt = document.createElement("option");
    opt.value = proj.slug;
    opt.textContent = `${proj.name} (${proj.slug}) - ${proj.releases.length} 个版本`;
    manageProjectSelect.append(opt);
  });

  if (currentVal && projects.some((p) => p.slug === currentVal)) {
    manageProjectSelect.value = currentVal;
  } else if (projectInput.value && projects.some((p) => p.slug === projectInput.value.trim())) {
    manageProjectSelect.value = projectInput.value.trim();
  } else if (projects.length === 1) {
    manageProjectSelect.value = projects[0].slug;
  }

  renderManageReleases(manageProjectSelect.value);
}

function renderManageReleases(slug) {
  manageReleasesList.replaceChildren();

  if (!slug) {
    manageProjectBadge.className = "batch-badge batch-badge--pending";
    manageProjectBadge.textContent = "请选择模组";
    const emptyP = document.createElement("p");
    emptyP.className = "empty";
    emptyP.textContent = "请先在上方选择一个模组以浏览其版本列表。";
    manageReleasesList.append(emptyP);
    return;
  }

  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    manageProjectBadge.className = "batch-badge batch-badge--error";
    manageProjectBadge.textContent = "未找到模组";
    return;
  }

  manageProjectBadge.className = "batch-badge batch-badge--success";
  manageProjectBadge.textContent = `${project.name} · ${project.releases.length} 个版本`;

  if (!project.releases || project.releases.length === 0) {
    const emptyP = document.createElement("p");
    emptyP.className = "empty";
    emptyP.textContent = `模组 ${project.name} (${project.slug}) 暂无发布版本。`;
    manageReleasesList.append(emptyP);
    return;
  }

  project.releases.forEach((release) => {
    const card = document.createElement("div");
    card.className = "release-manage-card";

    // Header
    const header = document.createElement("div");
    header.className = "release-manage-card__header";

    const titleBox = document.createElement("div");
    titleBox.className = "release-manage-card__title";

    const verStrong = document.createElement("strong");
    verStrong.textContent = `v${release.version}`;
    titleBox.append(verStrong);

    const releaseDate = release.publishedAt || release.releasedAt;
    if (releaseDate) {
      const dateSpan = document.createElement("span");
      dateSpan.className = "release-manage-card__date";
      dateSpan.textContent = new Date(releaseDate).toLocaleString();
      titleBox.append(dateSpan);
    }

    const tagsBox = document.createElement("div");
    tagsBox.className = "release-manage-card__tags";

    const gameList = release.gameVersions || release.game || [];
    if (gameList.length) {
      const gBadge = document.createElement("span");
      gBadge.className = "batch-badge batch-badge--pending";
      gBadge.textContent = gameList.join(", ");
      tagsBox.append(gBadge);
    }
    if (release.loaders && release.loaders.length) {
      const lBadge = document.createElement("span");
      lBadge.className = "batch-badge batch-badge--info";
      lBadge.textContent = release.loaders.join(", ");
      tagsBox.append(lBadge);
    }
    if (release.authors && release.authors.length) {
      const aBadge = document.createElement("span");
      aBadge.className = "batch-badge";
      aBadge.style.borderColor = "var(--line)";
      aBadge.textContent = `作者: ${release.authors.join(", ")}`;
      tagsBox.append(aBadge);
    }
    titleBox.append(tagsBox);

    // Delete entire release button
    const deleteReleaseBtn = document.createElement("button");
    deleteReleaseBtn.type = "button";
    deleteReleaseBtn.className = "btn-delete-danger";
    deleteReleaseBtn.textContent = "🗑️ 删除此版本";
    deleteReleaseBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `确定要删除模组 "${project.name}" 的版本 "${release.version}" 吗？\n\n此操作将从发布清单中彻底移除该版本记录。`
      );
      if (!confirmed) return;

      deleteReleaseBtn.disabled = true;
      deleteReleaseBtn.textContent = "正在删除…";

      try {
        const formData = new FormData();
        formData.append("project", project.slug);
        formData.append("version", release.version);

        const res = await fetch("/api/release/delete", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "删除版本失败");

        showResult(true, data.message || "版本删除成功");
        await refreshProjects();
      } catch (err) {
        showResult(false, err.message);
        deleteReleaseBtn.disabled = false;
        deleteReleaseBtn.textContent = "🗑️ 删除此版本";
      }
    });

    header.append(titleBox, deleteReleaseBtn);
    card.append(header);

    // Files list
    const filesList = document.createElement("ul");
    filesList.className = "release-files-list";

    if (!release.files || release.files.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty";
      emptyLi.textContent = "此版本内暂无任何关联文件。";
      filesList.append(emptyLi);
    } else {
      release.files.forEach((file) => {
        const row = document.createElement("li");
        row.className = "release-file-row";

        const info = document.createElement("div");
        info.className = "release-file-info";

        const fName = document.createElement("span");
        fName.className = "release-file-name";
        fName.textContent = file.name;

        let r2Path = file.path;
        if (!r2Path && file.url) {
          try {
            r2Path = decodeURIComponent(new URL(file.url).pathname.replace(/^\/+/, ""));
          } catch {
            r2Path = file.url;
          }
        }

        const fMeta = document.createElement("span");
        fMeta.className = "release-file-meta";
        const shaShort = file.sha256 ? file.sha256.slice(0, 10) + "..." : "无哈希";
        fMeta.textContent = `${size(file.size)} · SHA256: ${shaShort} · R2: ${r2Path || "已上传"}`;

        info.append(fName, fMeta);

        const actions = document.createElement("div");
        actions.className = "release-file-actions";

        if (file.url) {
          const dlLink = document.createElement("a");
          dlLink.href = file.url;
          dlLink.target = "_blank";
          dlLink.rel = "noopener";
          dlLink.className = "btn-subaction";
          dlLink.style.textDecoration = "none";
          dlLink.style.fontSize = "0.76rem";
          dlLink.textContent = "下载";
          actions.append(dlLink);
        }

        const deleteFileBtn = document.createElement("button");
        deleteFileBtn.type = "button";
        deleteFileBtn.className = "btn-delete-danger";
        deleteFileBtn.textContent = "移除文件";
        deleteFileBtn.addEventListener("click", async () => {
          const confirmed = window.confirm(
            `确定要从版本 "${release.version}" 中移除文件 "${file.name}" 吗？`
          );
          if (!confirmed) return;

          deleteFileBtn.disabled = true;
          deleteFileBtn.textContent = "正在移除…";

          try {
            const formData = new FormData();
            formData.append("project", project.slug);
            formData.append("version", release.version);
            formData.append("fileName", file.name);

            const res = await fetch("/api/release/file/delete", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "移除文件失败");

            showResult(true, data.message || "文件已移除");
            await refreshProjects();
          } catch (err) {
            showResult(false, err.message);
            deleteFileBtn.disabled = false;
            deleteFileBtn.textContent = "移除文件";
          }
        });

        actions.append(deleteFileBtn);
        row.append(info, actions);
        filesList.append(row);
      });
    }

    card.append(filesList);

    // Add file box
    const addFileBox = document.createElement("div");
    addFileBox.className = "release-add-file-box";

    const addLabel = document.createElement("label");
    addLabel.innerHTML = `<strong>追加新文件：</strong>`;

    const addInput = document.createElement("input");
    addInput.type = "file";
    addInput.className = "release-add-file-input";
    addLabel.append(addInput);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-add-file";
    addBtn.textContent = "➕ 上传并加入版本";

    const statusSpan = document.createElement("span");
    statusSpan.style.fontSize = "0.78rem";
    statusSpan.style.fontFamily = "ui-monospace, monospace";
    statusSpan.style.color = "var(--muted)";

    addBtn.addEventListener("click", async () => {
      if (!addInput.files || !addInput.files.length) {
        statusSpan.style.color = "#ffb4ab";
        statusSpan.textContent = "请先选择一个文件";
        return;
      }

      const fileToAdd = addInput.files[0];
      if (fileToAdd.size > 10 * 1024 * 1024) {
        statusSpan.style.color = "#ffb4ab";
        statusSpan.textContent = "文件超过 10MB 限制";
        return;
      }

      if (release.files && release.files.some((f) => f.name === fileToAdd.name)) {
        const proceed = window.confirm(
          `版本 "${release.version}" 中已存在同名文件 "${fileToAdd.name}"。继续操作将会覆盖该文件，是否继续？`
        );
        if (!proceed) return;
      }

      addBtn.disabled = true;
      addInput.disabled = true;
      statusSpan.style.color = "var(--accent)";
      statusSpan.textContent = `正在上传 ${fileToAdd.name} 至 R2 并登记版本…`;

      try {
        const formData = new FormData();
        formData.append("project", project.slug);
        formData.append("version", release.version);
        formData.append("file", fileToAdd);

        const res = await fetch("/api/release/file/add", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "添加文件失败");

        showResult(true, data.message || "文件添加成功");
        await refreshProjects();
      } catch (err) {
        statusSpan.style.color = "#ffb4ab";
        statusSpan.textContent = `失败: ${err.message}`;
        showResult(false, err.message);
        addBtn.disabled = false;
        addInput.disabled = false;
      }
    });

    addFileBox.append(addLabel, addBtn, statusSpan);
    card.append(addFileBox);

    manageReleasesList.append(card);
  });
}

manageProjectSelect.addEventListener("change", () => {
  renderManageReleases(manageProjectSelect.value);
});

async function refreshProjects() {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  projects = (await response.json()).projects;
  renderProjects();
  updateManageProjectSelect();
  if (batchQueue.length) {
    updateQueueConflicts();
    renderBatchQueue();
  }
}

// Mode Switcher
function switchMode(mode) {
  if (mode === "batch") {
    tabBatch.classList.add("active");
    tabSingle.classList.remove("active");
    tabManage.classList.remove("active");
    form.style.display = "none";
    batchSection.style.display = "block";
    manageSection.style.display = "none";
  } else if (mode === "manage") {
    tabManage.classList.add("active");
    tabSingle.classList.remove("active");
    tabBatch.classList.remove("active");
    form.style.display = "none";
    batchSection.style.display = "none";
    manageSection.style.display = "block";
    updateManageProjectSelect();
  } else {
    tabSingle.classList.add("active");
    tabBatch.classList.remove("active");
    tabManage.classList.remove("active");
    form.style.display = "grid";
    batchSection.style.display = "none";
    manageSection.style.display = "none";
  }
}

tabSingle.addEventListener("click", () => switchMode("single"));
tabBatch.addEventListener("click", () => switchMode("batch"));
tabManage.addEventListener("click", () => switchMode("manage"));

switchToBatchBtn.addEventListener("click", () => {
  switchMode("batch");
  if (fileInput.files && fileInput.files.length) {
    handleBatchFiles([...fileInput.files]);
  }
});

// Batch Functions
async function inspectJarBufferOrFile(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/inspect-jar", { method: "POST", body: formData });
    if (!response.ok) return { isFabric: false, filename: file.name };
    const data = await response.json();
    return { ...data, filename: file.name };
  } catch {
    return { isFabric: false, filename: file.name };
  }
}

async function handleBatchFiles(filesList) {
  const jarFiles = filesList.filter((f) => f.name.toLowerCase().endsWith(".jar"));
  if (!jarFiles.length) {
    showResult(false, "未选择任何 .jar 模组文件。");
    return;
  }

  batchControl.style.display = "flex";
  batchCountText.textContent = `正在并发解析 ${jarFiles.length} 个模组包…`;
  batchDetailText.textContent = `请稍候，系统正并发读取各包中的 fabric.mod.json…`;
  batchUploadBtn.disabled = true;

  // Concurrent parsing via /api/inspect-jar
  const results = await Promise.all(jarFiles.map((file) => inspectJarBufferOrFile(file)));

  // Group files by (id, version)
  const groupMap = new Map();

  results.forEach((info, index) => {
    const file = jarFiles[index];
    const rawId = info.id || file.name.replace(/\.jar$/i, "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const id = rawId.replace(/^[^a-z0-9]+/, "").replace(/[^a-z0-9-]+/g, "-") || "mod";
    const version = info.version || "1.0.0";
    const groupKey = `${id}@@${version}`;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        id,
        name: info.name || id,
        version,
        description: info.description || "",
        gameVersions: info.gameVersions || [],
        loader: info.loader || "Fabric",
        authors: info.authors || [],
        source: info.source || "",
        iconDataUrl: info.iconDataUrl || "",
        files: [file],
        status: "pending",
        errorMessage: "",
        isFabric: Boolean(info.isFabric)
      });
    } else {
      const existing = groupMap.get(groupKey);
      existing.files.push(file);
      if (!existing.description && info.description) existing.description = info.description;
      if (!existing.source && info.source) existing.source = info.source;
      if (!existing.iconDataUrl && info.iconDataUrl) existing.iconDataUrl = info.iconDataUrl;
      if (info.gameVersions?.length) {
        existing.gameVersions = [...new Set([...existing.gameVersions, ...info.gameVersions])];
      }
      if (info.authors?.length) {
        existing.authors = [...new Set([...existing.authors, ...info.authors])];
      }
    }
  });

  // Merge into batchQueue
  groupMap.forEach((newItem, key) => {
    const existingIndex = batchQueue.findIndex((item) => `${item.id}@@${item.version}` === key);
    if (existingIndex >= 0) {
      batchQueue[existingIndex] = newItem;
    } else {
      batchQueue.push(newItem);
    }
  });

  updateQueueConflicts();
  renderBatchQueue();
  batchUploadBtn.disabled = false;
}

function updateQueueConflicts() {
  const allowOverwrite = batchOverwriteCheck.checked;
  batchQueue.forEach((item) => {
    const existingProject = projects.find((p) => p.slug === item.id);
    const versionExists = existingProject?.releases?.some((r) => r.version === item.version);
    item.alreadyExists = Boolean(versionExists);

    if (item.status === "pending" || item.status === "exists") {
      if (item.alreadyExists && !allowOverwrite) {
        item.status = "exists";
      } else {
        item.status = "pending";
      }
    }
  });
}

function renderBatchQueue() {
  batchQueueList.replaceChildren();
  const totalUnits = batchQueue.length;
  const totalFiles = batchQueue.reduce((acc, cur) => acc + cur.files.length, 0);

  batchCountText.textContent = `共 ${totalUnits} 个模组发布单元`;
  batchDetailText.textContent = `已聚合 ${totalFiles} 个版本文件`;

  if (!batchQueue.length) {
    batchControl.style.display = "none";
    return;
  }
  batchControl.style.display = "flex";

  batchQueue.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = `batch-card state-${item.status}`;

    // Icon
    if (item.iconDataUrl) {
      const img = document.createElement("img");
      img.className = "batch-card__icon";
      img.src = item.iconDataUrl;
      img.alt = item.name;
      card.append(img);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "batch-card__icon batch-card__icon--fallback";
      fallback.textContent = (item.name || item.id).slice(0, 1).toUpperCase();
      card.append(fallback);
    }

    // Content
    const content = document.createElement("div");
    content.className = "batch-card__content";

    const header = document.createElement("div");
    header.className = "batch-card__header";
    const titleEl = document.createElement("strong");
    titleEl.textContent = item.name || item.id;
    const idEl = document.createElement("code");
    idEl.textContent = item.id;
    header.append(titleEl, idEl);
    content.append(header);

    const meta = document.createElement("div");
    meta.className = "batch-card__meta";
    meta.textContent = `版本: ${item.version} · 游戏: ${item.gameVersions.join(", ") || "通用"} · 加载器: ${item.loader}`;
    if (item.authors.length) meta.textContent += ` · 作者: ${item.authors.join(", ")}`;
    if (item.source) meta.textContent += ` · 源码: ${item.source}`;
    content.append(meta);

    const filesLine = document.createElement("div");
    filesLine.className = "batch-card__files";
    filesLine.textContent = item.files.map((f) => `${f.name} (${size(f.size)})`).join("，");
    content.append(filesLine);

    if (item.errorMessage) {
      const errEl = document.createElement("div");
      errEl.className = "batch-card__error-msg";
      errEl.textContent = `错误: ${item.errorMessage}`;
      content.append(errEl);
    }

    card.append(content);

    // Actions & Badge
    const actions = document.createElement("div");
    actions.className = "batch-card__actions";

    const badge = document.createElement("span");
    badge.className = `batch-badge batch-badge--${item.status}`;
    if (item.status === "pending") badge.textContent = "待上传";
    else if (item.status === "parsing") badge.textContent = "解析中";
    else if (item.status === "uploading") badge.textContent = "正在上传…";
    else if (item.status === "success") badge.textContent = "✔ 已发布";
    else if (item.status === "error") badge.textContent = "❌ 失败";
    else if (item.status === "exists") badge.textContent = "⚠️ 版本已存在(跳过)";
    actions.append(badge);

    if (!isBatchUploading && item.status !== "uploading") {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn-remove-item";
      removeBtn.textContent = "移除";
      removeBtn.title = "从队列移除此项";
      removeBtn.addEventListener("click", () => {
        batchQueue.splice(index, 1);
        renderBatchQueue();
      });
      actions.append(removeBtn);
    }

    card.append(actions);
    batchQueueList.append(card);
  });
}

async function startBatchUpload() {
  if (isBatchUploading) return;
  const itemsToUpload = batchQueue.filter((item) => item.status === "pending");
  if (!itemsToUpload.length) {
    return showResult(false, "队列中没有待上传的模组（已存在版本的模组已被自动跳过；若需强行重新发布请勾选【允许覆盖已存在版本】）。");
  }

  isBatchUploading = true;
  batchUploadBtn.disabled = true;
  batchClearBtn.disabled = true;
  batchOverwriteCheck.disabled = true;
  batchDryrunCheck.disabled = true;
  batchProgressBox.style.display = "flex";

  const isDryRun = batchDryrunCheck.checked;
  const isOverwrite = batchOverwriteCheck.checked;

  let successCount = 0;
  let failCount = 0;
  let skipCount = batchQueue.filter((item) => item.status === "exists").length;

  const total = itemsToUpload.length;

  for (let i = 0; i < total; i++) {
    const item = itemsToUpload[i];
    item.status = "uploading";
    item.errorMessage = "";
    renderBatchQueue();

    const percent = Math.round((i / total) * 100);
    batchProgressLabel.textContent = `正在上传 (${i + 1}/${total}): ${item.name} ${item.version}...`;
    batchProgressPercent.textContent = `${percent}%`;
    batchProgressBar.style.width = `${percent}%`;

    try {
      const formData = new FormData();
      formData.append("project", item.id);
      formData.append("name", item.name);
      formData.append("description", item.description);
      formData.append("version", item.version);
      if (item.gameVersions.length) formData.append("game", item.gameVersions.join(","));
      if (item.loader) formData.append("loader", item.loader);
      if (item.authors.length) formData.append("authors", item.authors.join(", "));
      if (item.source) formData.append("source", item.source);
      if (isDryRun) formData.append("dryRun", "true");
      if (isOverwrite) formData.append("overwrite", "true");

      // Check if project exists in catalog; if new and has embedded icon, auto-attach iconFile
      const projectExists = projects.some((p) => p.slug === item.id);
      if (!projectExists && item.iconDataUrl) {
        try {
          const iconFile = dataURLtoFile(item.iconDataUrl, `${item.id}-icon.png`);
          formData.append("iconFile", iconFile);
        } catch {}
      }

      item.files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/publish", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "发布失败");
      }

      item.status = "success";
      successCount++;
    } catch (err) {
      item.status = "error";
      item.errorMessage = err.message;
      failCount++;
    }

    renderBatchQueue();
  }

  batchProgressLabel.textContent = "批量发布处理完毕";
  batchProgressPercent.textContent = "100%";
  batchProgressBar.style.width = "100%";

  isBatchUploading = false;
  batchUploadBtn.disabled = false;
  batchClearBtn.disabled = false;
  batchOverwriteCheck.disabled = false;
  batchDryrunCheck.disabled = false;

  await refreshProjects();
  showResult(
    failCount === 0,
    `批量处理完成！\n\n成功: ${successCount} 个\n失败: ${failCount} 个\n跳过(已存在): ${skipCount} 个${
      isDryRun ? "\n\n（本次为仅验证 Dry Run 模式，未实际上传到 R2 与清单）" : ""
    }`
  );
}

// Batch Event Listeners
batchFilesInput.addEventListener("change", () => {
  if (batchFilesInput.files && batchFilesInput.files.length) {
    handleBatchFiles([...batchFilesInput.files]);
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  batchDropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    batchDropZone.style.borderColor = "var(--accent)";
  });
});

["dragleave", "drop"].forEach((eventName) => {
  batchDropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    batchDropZone.style.borderColor = "";
  });
});

batchDropZone.addEventListener("drop", (e) => {
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length) {
    handleBatchFiles([...dt.files]);
  }
});

batchOverwriteCheck.addEventListener("change", () => {
  updateQueueConflicts();
  renderBatchQueue();
});

batchClearBtn.addEventListener("click", () => {
  batchQueue = [];
  batchFilesInput.value = "";
  batchProgressBox.style.display = "none";
  renderBatchQueue();
});

batchUploadBtn.addEventListener("click", startBatchUpload);

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
  updateProjectButton.textContent = "正在更新…";

  try {
    const formData = new FormData();
    formData.append("project", projectSlug);
    formData.append("name", form.elements.name.value.trim());
    formData.append("description", form.elements.description.value.trim());
    formData.append("long-description", form.elements["long-description"].value.trim());
    formData.append("authors", form.elements.authors.value.trim());
    formData.append("source", form.elements.source.value.trim());
    formData.append("updateProjectOnly", "true");

    if (iconFileInput.files && iconFileInput.files[0]) {
      formData.append("iconFile", iconFileInput.files[0]);
    } else if (iconUrlInput.value.trim()) {
      formData.append("icon", iconUrlInput.value.trim());
    }

    if (bannerFileInput.files && bannerFileInput.files[0]) {
      formData.append("bannerFile", bannerFileInput.files[0]);
    } else if (bannerUrlInput.value.trim()) {
      formData.append("banner", bannerUrlInput.value.trim());
    }

    const response = await fetch("/api/project/update", { method: "POST", body: formData });
    const result = await response.json();
    showResult(response.ok, result.message || result.error);
    if (response.ok) {
      await refreshProjects();
      iconFileInput.value = "";
      bannerFileInput.value = "";
      updateImageHints();
    }
  } catch (error) {
    showResult(false, error.message);
  } finally {
    updateProjectButton.disabled = false;
    updateProjectButton.textContent = "仅更新模组资料与图片";
  }
});

// 发布新版本（单模组模式）
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
