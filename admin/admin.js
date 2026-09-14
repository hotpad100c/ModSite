import { translateText, maskText, unmaskText, applyGlossary, isPlaceholderDesc } from "/i18n.js";

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
const manageCatalogView = document.querySelector("#manage-catalog-view");
const manageDetailView = document.querySelector("#manage-detail-view");
const manageProjectSelect = document.querySelector("#manage-project-select");
const manageProjectBadge = document.querySelector("#manage-project-badge");
const manageReleasesList = document.querySelector("#manage-releases-list");
const btnDeleteProject = document.querySelector("#btn-delete-project");
const manageProjectsGrid = document.querySelector("#manage-projects-grid");
const manageSearchInput = document.querySelector("#manage-search-input");
const manageFilterChips = document.querySelectorAll("#manage-filter-chips .filter-chip");
const manageTotalCount = document.querySelector("#manage-total-count");
const manageIncompleteCount = document.querySelector("#manage-incomplete-count");
const manageMissingDescCount = document.querySelector("#manage-missing-desc-count");
const manageMissingBannerCount = document.querySelector("#manage-missing-banner-count");
const manageCompleteCount = document.querySelector("#manage-complete-count");
const manageChipAllCount = document.querySelector("#manage-chip-all-count");
const manageChipIncompleteCount = document.querySelector("#manage-chip-incomplete-count");
const manageChipDescCount = document.querySelector("#manage-chip-desc-count");
const manageChipBannerCount = document.querySelector("#manage-chip-banner-count");
const manageChipCompleteCount = document.querySelector("#manage-chip-complete-count");
const btnBackToManageGrid = document.querySelector("#btn-back-to-manage-grid");
const btnEditCurrentProject = document.querySelector("#btn-edit-current-project");
const manageDetailIcon = document.querySelector("#manage-detail-icon");
const manageDetailName = document.querySelector("#manage-detail-name");
const manageDetailSlug = document.querySelector("#manage-detail-slug");

// Modrinth Sync Components
const tabModrinth = document.querySelector("#tab-modrinth");
const modrinthSection = document.querySelector("#modrinth-section");
const modrinthUsernameInput = document.querySelector("#modrinth-username-input");
const modrinthTokenInput = document.querySelector("#modrinth-token-input");
const btnFetchModrinth = document.querySelector("#btn-fetch-modrinth");
const modrinthControl = document.querySelector("#modrinth-control");
const modrinthSummaryCount = document.querySelector("#modrinth-summary-count");
const modrinthSelectedText = document.querySelector("#modrinth-selected-text");
const modrinthSyncVersionsCheck = document.querySelector("#modrinth-sync-versions-check");
const modrinthUploadR2Check = document.querySelector("#modrinth-upload-r2-check");
const modrinthOverwriteCheck = document.querySelector("#modrinth-overwrite-check");
const modrinthSelectAllBtn = document.querySelector("#modrinth-select-all-btn");
const modrinthDeselectAllBtn = document.querySelector("#modrinth-deselect-all-btn");
const modrinthSyncBtn = document.querySelector("#modrinth-sync-btn");
const modrinthProgressBox = document.querySelector("#modrinth-progress-box");
const modrinthProgressLabel = document.querySelector("#modrinth-progress-label");
const modrinthProgressPercent = document.querySelector("#modrinth-progress-percent");
const modrinthProgressBar = document.querySelector("#modrinth-progress-bar");
const modrinthGrid = document.querySelector("#modrinth-grid");

// Workspace Scanner Components
const tabWorkspace = document.querySelector("#tab-workspace");
const tabShelved = document.querySelector("#tab-shelved");
const tabShelvedCount = document.querySelector("#tab-shelved-count");
const workspaceSection = document.querySelector("#workspace-section");
const workspaceDirInput = document.querySelector("#workspace-dir-input");
const btnScanWorkspace = document.querySelector("#btn-scan-workspace");
const workspaceControl = document.querySelector("#workspace-control");
const workspaceActiveCount = document.querySelector("#workspace-active-count");
const workspaceTotalCount = document.querySelector("#workspace-total-count");
const workspaceBuiltCount = document.querySelector("#workspace-built-count");
const workspaceUnbuiltCount = document.querySelector("#workspace-unbuilt-count");
const workspaceUnpublishedCount = document.querySelector("#workspace-unpublished-count");
const workspaceShelvedCount = document.querySelector("#workspace-shelved-count");
const workspaceSearchInput = document.querySelector("#workspace-search-input");
const workspaceFilterChips = document.querySelectorAll(".workspace-filter-chips .filter-chip");
const chipAllCount = document.querySelector("#chip-all-count");
const chipBuiltCount = document.querySelector("#chip-built-count");
const chipUnbuiltCount = document.querySelector("#chip-unbuilt-count");
const chipUnpublishedCount = document.querySelector("#chip-unpublished-count");
const chipPublishedCount = document.querySelector("#chip-published-count");
const chipShelvedCount = document.querySelector("#chip-shelved-count");
const workspaceGrid = document.querySelector("#workspace-grid");

const workspaceBuildDialog = document.querySelector("#workspace-build-dialog");
const workspaceBuildTitle = document.querySelector("#workspace-build-title");
const workspaceBuildSubtitle = document.querySelector("#workspace-build-subtitle");
const workspaceBuildStatusBadge = document.querySelector("#workspace-build-status-badge");
const workspaceBuildOutput = document.querySelector("#workspace-build-output");
const workspaceBuildDuration = document.querySelector("#workspace-build-duration");
const btnCloseBuildDialog = document.querySelector("#btn-close-build-dialog");

// Translation & Glossary Components
const tabTranslations = document.querySelector("#tab-translations");
const translationsSection = document.querySelector("#translations-section");
const glossaryTermInput = document.querySelector("#glossary-term-input");
const glossaryTransInput = document.querySelector("#glossary-trans-input");
const btnAddGlossary = document.querySelector("#btn-add-glossary");
const btnSaveGlossary = document.querySelector("#btn-save-glossary");
const glossaryCountText = document.querySelector("#glossary-count-text");
const glossaryStatusMsg = document.querySelector("#glossary-status-msg");
const glossaryChipsGrid = document.querySelector("#glossary-chips-grid");
const btnBatchDraftMt = document.querySelector("#btn-batch-draft-mt");
const transSearchInput = document.querySelector("#trans-search-input");
const transFilterChips = document.querySelectorAll("#trans-filter-chips .filter-chip");
const transChipAllCount = document.querySelector("#trans-chip-all-count");
const transChipManualCount = document.querySelector("#trans-chip-manual-count");
const transChipUntranslatedCount = document.querySelector("#trans-chip-untranslated-count");
const modTranslationsList = document.querySelector("#mod-translations-list");

let currentGlossary = [];
let currentOverrides = {};
let currentTransFilter = "all";
let transSearchQuery = "";
let isBatchTranslatingDrafts = false;

let workspaceProjects = [];
let currentWorkspaceFilter = "all";
let workspaceSearchQuery = "";
let isWorkspaceScanning = false;
let isBuildingProject = false;

let modrinthProjects = [];
let selectedModrinthIds = new Set();
let isModrinthSyncing = false;

let projects = [];
let batchQueue = [];
let isBatchUploading = false;

let currentManageFilter = "all";
let manageSearchQuery = "";
let selectedManageSlug = null;

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
        openProjectReleasesDetail(project.slug);
        return;
      }
      loadProjectIntoSingleForm(project);
    });
    root.append(button);
  });
}

function checkProjectCompleteness(project) {
  const desc = (project.description || "").trim();
  const isDescMissing = !desc || desc.includes("This is an example description! Tell everyone what your mod is about!");
  const banner = (project.banner || "").trim();
  const isBannerMissing = !banner;
  const isIncomplete = isDescMissing || isBannerMissing;

  return {
    isDescMissing,
    isBannerMissing,
    isIncomplete,
    isComplete: !isIncomplete
  };
}

function loadProjectIntoSingleForm(project) {
  switchMode("single");
  form.elements.project.value = project.slug;
  form.elements.name.value = project.name || "";
  const ov = currentOverrides[project.slug] || {};
  if (form.elements.name_zh) form.elements.name_zh.value = project.name_zh || ov.name_zh || "";
  const status = checkProjectCompleteness(project);
  form.elements.description.value = (status.isDescMissing && project.description?.includes("This is an example description")) ? "" : (project.description || "");
  if (form.elements.description_zh) form.elements.description_zh.value = project.description_zh || ov.description_zh || "";
  form.elements["long-description"].value = project.longDescription || "";
  if (form.elements.long_description_zh) form.elements.long_description_zh.value = project.longDescription_zh || ov.longDescription_zh || "";
  form.elements.icon.value = project.icon || "";
  form.elements.banner.value = project.banner || "";
  form.elements.authors.value = (project.authors || []).join(", ");
  form.elements.source.value = project.source || "";
  iconFileInput.value = "";
  bannerFileInput.value = "";
  updateImageHints();

  if (status.isDescMissing) {
    form.elements.description.focus();
  } else if (status.isBannerMissing) {
    bannerFileInput.focus();
  } else {
    form.elements.version.focus();
  }
}

function updateManageCounts() {
  let incompleteCount = 0;
  let missingDescCount = 0;
  let missingBannerCount = 0;
  let completeCount = 0;

  projects.forEach((proj) => {
    const status = checkProjectCompleteness(proj);
    if (status.isIncomplete) incompleteCount++;
    if (status.isDescMissing) missingDescCount++;
    if (status.isBannerMissing) missingBannerCount++;
    if (status.isComplete) completeCount++;
  });

  const total = projects.length;
  if (manageTotalCount) manageTotalCount.textContent = total;
  if (manageIncompleteCount) manageIncompleteCount.textContent = incompleteCount;
  if (manageMissingDescCount) manageMissingDescCount.textContent = missingDescCount;
  if (manageMissingBannerCount) manageMissingBannerCount.textContent = missingBannerCount;
  if (manageCompleteCount) manageCompleteCount.textContent = completeCount;

  if (manageChipAllCount) manageChipAllCount.textContent = total;
  if (manageChipIncompleteCount) manageChipIncompleteCount.textContent = incompleteCount;
  if (manageChipDescCount) manageChipDescCount.textContent = missingDescCount;
  if (manageChipBannerCount) manageChipBannerCount.textContent = missingBannerCount;
  if (manageChipCompleteCount) manageChipCompleteCount.textContent = completeCount;
}

function createFallbackIcon(name) {
  const fallback = document.createElement("div");
  fallback.className = "manage-project-card__icon manage-project-card__icon--fallback";
  fallback.textContent = (name || "?").slice(0, 1).toUpperCase();
  return fallback;
}

function renderManageCatalogGrid() {
  updateManageCounts();
  if (!manageProjectsGrid) return;
  manageProjectsGrid.replaceChildren();

  const query = (manageSearchQuery || "").trim().toLowerCase();

  const filtered = projects.filter((proj) => {
    const status = checkProjectCompleteness(proj);

    if (currentManageFilter === "incomplete" && !status.isIncomplete) return false;
    if (currentManageFilter === "missing-desc" && !status.isDescMissing) return false;
    if (currentManageFilter === "missing-banner" && !status.isBannerMissing) return false;
    if (currentManageFilter === "complete" && !status.isComplete) return false;

    if (query) {
      const matchName = (proj.name || "").toLowerCase().includes(query);
      const matchSlug = (proj.slug || "").toLowerCase().includes(query);
      const matchDesc = (proj.description || "").toLowerCase().includes(query);
      const matchAuthors = (proj.authors || []).some((a) => a.toLowerCase().includes(query));
      if (!matchName && !matchSlug && !matchDesc && !matchAuthors) return false;
    }

    return true;
  });

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.style.gridColumn = "1 / -1";
    empty.style.padding = "2.5rem 1rem";
    empty.style.textAlign = "center";
    empty.textContent = query
      ? `未搜索到匹配 "${query}" 的模组。`
      : "当前筛选分类下暂无模组。";
    manageProjectsGrid.append(empty);
    return;
  }

  filtered.forEach((project) => {
    const status = checkProjectCompleteness(project);
    const card = document.createElement("div");
    card.className = `manage-project-card ${status.isIncomplete ? "is-incomplete" : "is-complete"}`;

    // Top section
    const top = document.createElement("div");
    top.className = "manage-project-card__top";

    if (project.icon) {
      const iconImg = document.createElement("img");
      iconImg.className = "manage-project-card__icon";
      iconImg.src = project.icon;
      iconImg.alt = project.name;
      iconImg.loading = "lazy";
      iconImg.onerror = () => {
        iconImg.replaceWith(createFallbackIcon(project.name));
      };
      top.append(iconImg);
    } else {
      top.append(createFallbackIcon(project.name));
    }

    const info = document.createElement("div");
    info.className = "manage-project-card__info";

    const titleH3 = document.createElement("h3");
    titleH3.className = "manage-project-card__title";
    titleH3.textContent = project.name;
    titleH3.title = project.name;

    const slugCode = document.createElement("code");
    slugCode.className = "manage-project-card__slug";
    slugCode.textContent = project.slug;

    const badgesBox = document.createElement("div");
    badgesBox.className = "manage-project-card__badges";

    if (status.isComplete) {
      const b = document.createElement("span");
      b.className = "manage-badge manage-badge--complete";
      b.textContent = "✔ 资料完备";
      badgesBox.append(b);
    } else {
      if (status.isDescMissing) {
        const b = document.createElement("span");
        b.className = "manage-badge manage-badge--missing";
        b.textContent = "⚠️ 缺简介";
        badgesBox.append(b);
      }
      if (status.isBannerMissing) {
        const b = document.createElement("span");
        b.className = "manage-badge manage-badge--missing";
        b.textContent = "⚠️ 缺横幅";
        badgesBox.append(b);
      }
    }

    const releaseBadge = document.createElement("span");
    releaseBadge.className = "manage-badge manage-badge--releases";
    releaseBadge.textContent = `📦 ${project.releases?.length || 0} 个版本`;
    badgesBox.append(releaseBadge);

    info.append(titleH3, slugCode, badgesBox);
    top.append(info);
    card.append(top);

    // Banner box
    const bannerBox = document.createElement("div");
    bannerBox.className = "manage-project-card__banner-box";
    if (project.banner && project.banner.trim()) {
      const bannerImg = document.createElement("img");
      bannerImg.className = "manage-project-card__banner-img";
      bannerImg.src = project.banner.trim();
      bannerImg.alt = `${project.name} banner`;
      bannerImg.loading = "lazy";
      bannerImg.onerror = () => {
        bannerBox.innerHTML = '<div class="manage-project-card__banner-missing"><span>⚠️ 横幅图片加载失败</span></div>';
      };
      bannerBox.append(bannerImg);
    } else {
      const missingBanner = document.createElement("div");
      missingBanner.className = "manage-project-card__banner-missing";
      missingBanner.innerHTML = "<span>🖼️ 缺少横幅图片 (Banner)</span>";
      bannerBox.append(missingBanner);
    }
    card.append(bannerBox);

    // Description snippet
    if (status.isDescMissing) {
      const missingDesc = document.createElement("div");
      missingDesc.className = "manage-project-card__desc manage-project-card__desc--missing";
      missingDesc.textContent = (!project.description || !project.description.trim())
        ? "⚠️ 模组简介未填写，建议补全"
        : "⚠️ 模组简介仍为模板占位符，建议补全";
      card.append(missingDesc);
    } else {
      const descEl = document.createElement("div");
      descEl.className = "manage-project-card__desc";
      descEl.textContent = project.description;
      card.append(descEl);
    }

    // Footer actions
    const footer = document.createElement("div");
    footer.className = "manage-project-card__footer";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = `btn-manage-edit ${status.isIncomplete ? "btn-manage-edit--warn" : ""}`;
    editBtn.textContent = status.isIncomplete ? "⚠️ 补全资料" : "📝 编辑资料";
    editBtn.addEventListener("click", () => {
      loadProjectIntoSingleForm(project);
    });

    const releasesBtn = document.createElement("button");
    releasesBtn.type = "button";
    releasesBtn.className = "btn-manage-releases";
    releasesBtn.textContent = `📦 管理版本与文件 (${project.releases?.length || 0}) ↗`;
    releasesBtn.addEventListener("click", () => {
      openProjectReleasesDetail(project.slug);
    });

    footer.append(editBtn, releasesBtn);
    card.append(footer);

    manageProjectsGrid.append(card);
  });
}

function openProjectReleasesDetail(slug) {
  selectedManageSlug = slug;
  manageProjectSelect.value = slug;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return;

  if (manageCatalogView) manageCatalogView.style.display = "none";
  if (manageDetailView) manageDetailView.style.display = "block";

  if (manageDetailName) manageDetailName.textContent = project.name;
  if (manageDetailSlug) manageDetailSlug.textContent = project.slug;
  if (manageDetailIcon) {
    if (project.icon) {
      manageDetailIcon.src = project.icon;
      manageDetailIcon.style.display = "block";
    } else {
      manageDetailIcon.style.display = "none";
    }
  }

  renderManageReleases(slug);
  window.scrollTo({ top: manageSection.offsetTop - 30, behavior: "smooth" });
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
}

function renderManageReleases(slug) {
  manageReleasesList.replaceChildren();

  if (!slug) {
    btnDeleteProject.style.display = "none";
    if (manageProjectBadge) manageProjectBadge.style.display = "none";
    const emptyP = document.createElement("p");
    emptyP.className = "empty";
    emptyP.textContent = "请先选择一个模组以浏览其版本列表。";
    manageReleasesList.append(emptyP);
    return;
  }

  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    btnDeleteProject.style.display = "none";
    if (manageProjectBadge) manageProjectBadge.style.display = "none";
    return;
  }

  if (manageDetailName) manageDetailName.textContent = project.name;
  if (manageDetailSlug) manageDetailSlug.textContent = project.slug;
  if (manageDetailIcon) {
    if (project.icon) {
      manageDetailIcon.src = project.icon;
      manageDetailIcon.style.display = "block";
    } else {
      manageDetailIcon.style.display = "none";
    }
  }

  btnDeleteProject.style.display = "inline-block";
  btnDeleteProject.onclick = async () => {
    const confirmed = window.confirm(
      `确定要彻底删除模组项目 "${project.name}" (${project.slug}) 吗？\n\n此操作将从发布清单中移除该模组及其所有 ${project.releases.length} 个版本的发布记录！`
    );
    if (!confirmed) return;

    btnDeleteProject.disabled = true;
    btnDeleteProject.textContent = "正在删除…";

    try {
      const formData = new FormData();
      formData.append("project", project.slug);

      const res = await fetch("/api/project/delete", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除模组失败");

      showResult(true, data.message || "模组已成功删除");
      selectedManageSlug = null;
      manageProjectSelect.value = "";
      if (manageDetailView) manageDetailView.style.display = "none";
      if (manageCatalogView) manageCatalogView.style.display = "block";
      await refreshProjects();
    } catch (err) {
      showResult(false, err.message);
    } finally {
      btnDeleteProject.disabled = false;
      btnDeleteProject.textContent = "🗑️ 删除此模组项目";
    }
  };

  if (manageProjectBadge) {
    manageProjectBadge.style.display = "inline-block";
    manageProjectBadge.className = "batch-badge batch-badge--success";
    manageProjectBadge.textContent = `${project.releases.length} 个版本`;
  }

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

    // Minecraft Game Versions Edit Box
    const gameEditBox = document.createElement("div");
    gameEditBox.className = "release-game-edit-box";

    const gameLabel = document.createElement("label");
    gameLabel.innerHTML = `<strong>🎮 适用游戏版本：</strong>`;

    const gameInput = document.createElement("input");
    gameInput.type = "text";
    gameInput.className = "release-game-input";
    gameInput.placeholder = "例如: 1.21.1, 1.21.2, 1.21.3";
    const currentGames = (release.gameVersions || release.game || []).join(", ");
    gameInput.value = currentGames;

    const saveGameBtn = document.createElement("button");
    saveGameBtn.type = "button";
    saveGameBtn.className = "btn-save-game";
    saveGameBtn.textContent = "💾 保存游戏版本";

    const gameStatusSpan = document.createElement("span");
    gameStatusSpan.style.fontSize = "0.78rem";
    gameStatusSpan.style.fontFamily = "ui-monospace, monospace";
    gameStatusSpan.style.color = "var(--muted)";

    const performSaveGameVersions = async () => {
      const newVal = gameInput.value.trim();
      if (!newVal) {
        gameStatusSpan.style.color = "#ffb4ab";
        gameStatusSpan.textContent = "游戏版本不能为空";
        return;
      }

      saveGameBtn.disabled = true;
      gameInput.disabled = true;
      gameStatusSpan.style.color = "var(--accent)";
      gameStatusSpan.textContent = "正在保存…";

      try {
        const formData = new FormData();
        formData.append("project", project.slug);
        formData.append("version", release.version);
        formData.append("gameVersions", newVal);

        const res = await fetch("/api/release/game-versions/update", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "更新游戏版本失败");

        gameStatusSpan.style.color = "var(--accent-hover)";
        gameStatusSpan.textContent = "已保存";
        showResult(true, data.message || "适用游戏版本已更新");
        await refreshProjects();
      } catch (err) {
        gameStatusSpan.style.color = "#ffb4ab";
        gameStatusSpan.textContent = `失败: ${err.message}`;
        showResult(false, err.message);
        saveGameBtn.disabled = false;
        gameInput.disabled = false;
      }
    };

    saveGameBtn.addEventListener("click", performSaveGameVersions);
    gameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSaveGameVersions();
      }
    });

    gameLabel.append(gameInput);
    gameEditBox.append(gameLabel, saveGameBtn, gameStatusSpan);
    card.append(gameEditBox);

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
        const shaShort = file.sha256
          ? `SHA256: ${file.sha256.slice(0, 10)}...`
          : (file.sha512 ? `SHA512: ${file.sha512.slice(0, 10)}...` : "无哈希");
        const storageSource = file.url && file.url.includes("cdn.modrinth.com")
          ? "Modrinth CDN"
          : (r2Path || "已上传");
        fMeta.textContent = `${size(file.size)} · ${shaShort} · ${storageSource}`;

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

if (manageSearchInput) {
  manageSearchInput.addEventListener("input", (e) => {
    manageSearchQuery = e.target.value;
    renderManageCatalogGrid();
  });
}

manageFilterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    manageFilterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentManageFilter = chip.dataset.manageFilter;
    renderManageCatalogGrid();
  });
});

if (btnBackToManageGrid) {
  btnBackToManageGrid.addEventListener("click", () => {
    selectedManageSlug = null;
    if (manageDetailView) manageDetailView.style.display = "none";
    if (manageCatalogView) manageCatalogView.style.display = "block";
    renderManageCatalogGrid();
  });
}

if (btnEditCurrentProject) {
  btnEditCurrentProject.addEventListener("click", () => {
    if (!selectedManageSlug) return;
    const project = projects.find((p) => p.slug === selectedManageSlug);
    if (!project) return;
    loadProjectIntoSingleForm(project);
  });
}

async function refreshProjects() {
  const [response] = await Promise.all([
    fetch("/api/catalog", { cache: "no-store" }),
    loadTranslations()
  ]);
  projects = (await response.json()).projects;
  renderProjects();
  updateManageProjectSelect();
  renderManageCatalogGrid();
  if (selectedManageSlug) {
    if (projects.some((p) => p.slug === selectedManageSlug)) {
      renderManageReleases(selectedManageSlug);
    } else {
      selectedManageSlug = null;
      if (manageDetailView) manageDetailView.style.display = "none";
      if (manageCatalogView) manageCatalogView.style.display = "block";
      renderManageCatalogGrid();
    }
  }
  if (batchQueue.length) {
    updateQueueConflicts();
    renderBatchQueue();
  }
  if (tabTranslations && tabTranslations.classList.contains("active")) {
    renderModTranslationsList();
  }
}

// Mode Switcher
function switchMode(mode) {
  tabSingle.classList.toggle("active", mode === "single");
  tabBatch.classList.toggle("active", mode === "batch");
  tabManage.classList.toggle("active", mode === "manage");
  tabModrinth.classList.toggle("active", mode === "modrinth");
  tabWorkspace.classList.toggle("active", mode === "workspace");
  tabShelved.classList.toggle("active", mode === "shelved");
  if (tabTranslations) tabTranslations.classList.toggle("active", mode === "translations");

  form.style.display = mode === "single" ? "grid" : "none";
  batchSection.style.display = mode === "batch" ? "block" : "none";
  manageSection.style.display = mode === "manage" ? "block" : "none";
  modrinthSection.style.display = mode === "modrinth" ? "block" : "none";
  workspaceSection.style.display = (mode === "workspace" || mode === "shelved") ? "block" : "none";
  if (translationsSection) translationsSection.style.display = mode === "translations" ? "block" : "none";

  if (mode === "manage") {
    updateManageProjectSelect();
    if (selectedManageSlug && projects.some((p) => p.slug === selectedManageSlug)) {
      openProjectReleasesDetail(selectedManageSlug);
    } else {
      selectedManageSlug = null;
      if (manageDetailView) manageDetailView.style.display = "none";
      if (manageCatalogView) manageCatalogView.style.display = "block";
      renderManageCatalogGrid();
    }
  } else if (mode === "modrinth") {
    if (!modrinthProjects.length) {
      fetchModrinthProjects();
    }
  } else if (mode === "workspace") {
    currentWorkspaceFilter = "all";
    workspaceFilterChips.forEach((c) => c.classList.toggle("active", c.dataset.filter === "all"));
    if (!workspaceProjects.length) {
      fetchWorkspaceProjects();
    } else {
      renderWorkspaceProjects();
    }
  } else if (mode === "shelved") {
    currentWorkspaceFilter = "shelved";
    workspaceFilterChips.forEach((c) => c.classList.toggle("active", c.dataset.filter === "shelved"));
    if (!workspaceProjects.length) {
      fetchWorkspaceProjects();
    } else {
      renderWorkspaceProjects();
    }
  } else if (mode === "translations") {
    loadAndRenderTranslations();
  }
}

tabSingle.addEventListener("click", () => switchMode("single"));
tabBatch.addEventListener("click", () => switchMode("batch"));
tabManage.addEventListener("click", () => switchMode("manage"));
tabModrinth.addEventListener("click", () => switchMode("modrinth"));
tabWorkspace.addEventListener("click", () => switchMode("workspace"));
tabShelved.addEventListener("click", () => switchMode("shelved"));
if (tabTranslations) tabTranslations.addEventListener("click", () => switchMode("translations"));

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
    if (form.elements.name_zh) formData.append("name_zh", form.elements.name_zh.value.trim());
    formData.append("description", form.elements.description.value.trim());
    if (form.elements.description_zh) formData.append("description_zh", form.elements.description_zh.value.trim());
    formData.append("long-description", form.elements["long-description"].value.trim());
    if (form.elements.long_description_zh) formData.append("long_description_zh", form.elements.long_description_zh.value.trim());
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

// Modrinth Sync Logic
async function fetchModrinthProjects() {
  const username = modrinthUsernameInput.value.trim() || "Ryan100c";
  const token = modrinthTokenInput.value.trim();

  localStorage.setItem("modrinth_username", username);
  if (token) localStorage.setItem("modrinth_token", token);

  btnFetchModrinth.disabled = true;
  btnFetchModrinth.textContent = "正在连接 Modrinth…";

  try {
    const params = new URLSearchParams({ user: username });
    if (token) params.set("token", token);

    const res = await fetch(`/api/modrinth/projects?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "获取 Modrinth 项目失败");

    modrinthProjects = data.projects || [];
    selectedModrinthIds.clear();
    modrinthControl.style.display = "block";
    modrinthSummaryCount.textContent = `已读取 ${modrinthProjects.length} 个 Modrinth 项目（用户: ${data.username}）`;
    updateModrinthSelectionUI();
    renderModrinthProjects();
  } catch (err) {
    showResult(false, err.message);
  } finally {
    btnFetchModrinth.disabled = false;
    btnFetchModrinth.textContent = "🔍 读取 Modrinth 项目";
  }
}

function updateModrinthSelectionUI() {
  modrinthSelectedText.textContent = `已选中 ${selectedModrinthIds.size} 项`;
  modrinthSyncBtn.disabled = selectedModrinthIds.size === 0 || isModrinthSyncing;
  modrinthSyncBtn.textContent = selectedModrinthIds.size > 0
    ? `⚡ 批量同步选中的 ${selectedModrinthIds.size} 个项目`
    : "⚡ 同步选中的项目";
}

function renderModrinthProjects() {
  modrinthGrid.replaceChildren();

  if (!modrinthProjects.length) {
    const emptyP = document.createElement("p");
    emptyP.className = "empty";
    emptyP.textContent = "该 Modrinth 用户名下暂无公开发布的模组项目。";
    modrinthGrid.append(emptyP);
    return;
  }

  modrinthProjects.forEach((proj) => {
    const card = document.createElement("div");
    card.className = "modrinth-card" + (selectedModrinthIds.has(proj.id) ? " is-selected" : "") + (proj.isExisting ? " is-existing" : "");

    // Top Section
    const top = document.createElement("div");
    top.className = "modrinth-card__top";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "modrinth-card__checkbox";
    chk.checked = selectedModrinthIds.has(proj.id);
    chk.addEventListener("change", () => {
      if (chk.checked) {
        selectedModrinthIds.add(proj.id);
        card.classList.add("is-selected");
      } else {
        selectedModrinthIds.delete(proj.id);
        card.classList.remove("is-selected");
      }
      updateModrinthSelectionUI();
    });

    let iconElem;
    if (proj.icon_url) {
      iconElem = document.createElement("img");
      iconElem.className = "modrinth-card__icon";
      iconElem.src = proj.icon_url;
      iconElem.alt = proj.title;
      iconElem.loading = "lazy";
    } else {
      iconElem = document.createElement("div");
      iconElem.className = "modrinth-card__icon modrinth-card__icon--fallback";
      iconElem.textContent = proj.title.charAt(0);
    }

    const titleBox = document.createElement("div");
    titleBox.className = "modrinth-card__title-box";

    const title = document.createElement("div");
    title.className = "modrinth-card__title";
    title.textContent = proj.title;
    title.title = proj.title;

    const slug = document.createElement("div");
    slug.className = "modrinth-card__slug";
    slug.textContent = proj.slug;

    titleBox.append(title, slug);
    top.append(chk, iconElem, titleBox);

    // Description
    const desc = document.createElement("div");
    desc.className = "modrinth-card__desc";
    desc.textContent = proj.description || "无简介";
    desc.title = proj.description || "";

    // Meta Row
    const meta = document.createElement("div");
    meta.className = "modrinth-card__meta";

    const dlSpan = document.createElement("span");
    dlSpan.textContent = `⬇️ ${(proj.downloads || 0).toLocaleString()}`;
    meta.append(dlSpan);

    const verSpan = document.createElement("span");
    verSpan.textContent = `📦 ${proj.versionsCount} 个版本`;
    meta.append(verSpan);

    if (proj.galleryCount > 0) {
      const gSpan = document.createElement("span");
      gSpan.textContent = `🖼️ ${proj.galleryCount} 张画廊`;
      meta.append(gSpan);
    }

    // Status Badge
    let statusBadge;
    if (proj.isExisting) {
      statusBadge = document.createElement("span");
      statusBadge.className = "batch-badge batch-badge--success";
      statusBadge.textContent = `本地已有 (${proj.existingReleasesCount} 版本)`;
    } else {
      statusBadge = document.createElement("span");
      statusBadge.className = "batch-badge batch-badge--pending";
      statusBadge.textContent = "本地未收录";
    }
    meta.append(statusBadge);

    // Footer
    const footer = document.createElement("div");
    footer.className = "modrinth-card__footer";

    const link = document.createElement("a");
    link.href = `https://modrinth.com/mod/${proj.slug}`;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "btn-subaction";
    link.style.fontSize = "0.74rem";
    link.style.textDecoration = "none";
    link.textContent = "在 Modrinth 打开 ↗";

    const syncSingleBtn = document.createElement("button");
    syncSingleBtn.type = "button";
    syncSingleBtn.className = "btn-sync-single";
    syncSingleBtn.textContent = "⚡ 立即同步";
    syncSingleBtn.addEventListener("click", () => {
      executeModrinthSync([proj.id]);
    });

    footer.append(link, syncSingleBtn);

    card.append(top, desc, meta, footer);
    modrinthGrid.append(card);
  });
}

async function executeModrinthSync(targetIds) {
  if (!targetIds || !targetIds.length || isModrinthSyncing) return;

  const syncVersions = modrinthSyncVersionsCheck.checked;
  const uploadToR2 = modrinthUploadR2Check.checked;
  const overwrite = modrinthOverwriteCheck.checked;
  const token = modrinthTokenInput.value.trim();

  if (uploadToR2) {
    const confirmR2 = window.confirm(
      `您勾选了【转存文件至私有 R2】。\n\n同步时将自动把所选模组的所有 jar 安装包下载并转存至您的 Cloudflare R2（生成专属独立域名）。若项目版本较多可能需要耗费一定时间。\n\n是否继续？`
    );
    if (!confirmR2) return;
  }

  isModrinthSyncing = true;
  modrinthSyncBtn.disabled = true;
  modrinthProgressBox.style.display = "block";
  modrinthProgressBar.style.width = "20%";
  modrinthProgressLabel.textContent = `正在连接 Modrinth 同步 ${targetIds.length} 个项目…`;
  modrinthProgressPercent.textContent = "20%";

  try {
    const payload = {
      projectIds: targetIds,
      syncVersions,
      uploadToR2,
      overwrite,
      token
    };

    modrinthProgressBar.style.width = "50%";
    modrinthProgressPercent.textContent = "50%";
    modrinthProgressLabel.textContent = "正在拉取详细图文与版本数据…";

    const res = await fetch("/api/modrinth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "同步失败");

    modrinthProgressBar.style.width = "100%";
    modrinthProgressPercent.textContent = "100%";
    modrinthProgressLabel.textContent = "同步完成！";

    let detailSummary = data.message + "\n\n";
    if (data.results) {
      data.results.forEach((r) => {
        detailSummary += r.success
          ? `✓ [${r.name || r.id}] 成功同步 (${r.versionsCount} 个版本)\n`
          : `✗ [${r.id}] 失败: ${r.error}\n`;
      });
    }

    showResult(true, detailSummary);
    await refreshProjects();
    await fetchModrinthProjects();
  } catch (err) {
    showResult(false, err.message);
  } finally {
    isModrinthSyncing = false;
    modrinthSyncBtn.disabled = selectedModrinthIds.size === 0;
    setTimeout(() => {
      modrinthProgressBox.style.display = "none";
      modrinthProgressBar.style.width = "0%";
    }, 2500);
  }
}

// Initialize saved Modrinth username / token
const savedUsername = localStorage.getItem("modrinth_username");
if (savedUsername) modrinthUsernameInput.value = savedUsername;
const savedToken = localStorage.getItem("modrinth_token");
if (savedToken) modrinthTokenInput.value = savedToken;

btnFetchModrinth.addEventListener("click", fetchModrinthProjects);
modrinthSelectAllBtn.addEventListener("click", () => {
  modrinthProjects.forEach((p) => selectedModrinthIds.add(p.id));
  updateModrinthSelectionUI();
  renderModrinthProjects();
});
modrinthDeselectAllBtn.addEventListener("click", () => {
  selectedModrinthIds.clear();
  updateModrinthSelectionUI();
  renderModrinthProjects();
});
modrinthSyncBtn.addEventListener("click", () => {
  executeModrinthSync([...selectedModrinthIds]);
});

// ==========================================================================
// Workspace Engineering Scanner & Build Logic
// ==========================================================================

const savedWorkspaceDir = localStorage.getItem("workspace_dir");
if (savedWorkspaceDir) workspaceDirInput.value = savedWorkspaceDir;

async function fetchWorkspaceProjects() {
  if (isWorkspaceScanning) return;
  const dir = workspaceDirInput.value.trim() || "c:\\coding";
  localStorage.setItem("workspace_dir", dir);

  isWorkspaceScanning = true;
  btnScanWorkspace.disabled = true;
  btnScanWorkspace.textContent = "🔍 正在扫描工程...";
  workspaceGrid.innerHTML = `<div class="empty" style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--muted);"><span style="display:inline-block; font-size: 1.5rem; animation: pulse 1s infinite;">🔍</span><p style="margin-top:0.5rem;">正在遍历目录 ${dir} 并分析 Gradle 模组工程与构建包...</p></div>`;

  try {
    const res = await fetch(`/api/workspace/projects?dir=${encodeURIComponent(dir)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "扫描工程失败");

    workspaceProjects = data.projects || [];
    workspaceControl.style.display = "flex";
    updateWorkspaceCounts();
    renderWorkspaceProjects();
  } catch (err) {
    showResult(false, err.message);
    workspaceGrid.innerHTML = `<div class="empty" style="grid-column: 1 / -1; color: #ffb4ab;"><p>扫描出错: ${err.message}</p></div>`;
  } finally {
    isWorkspaceScanning = false;
    btnScanWorkspace.disabled = false;
    btnScanWorkspace.textContent = "🔍 扫描本地工程";
  }
}

async function toggleShelveProject(project, shelved) {
  project.isShelved = Boolean(shelved);
  updateWorkspaceCounts();
  renderWorkspaceProjects();

  try {
    const res = await fetch("/api/workspace/shelve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: project.id,
        folderName: project.folderName,
        shelved: Boolean(shelved)
      })
    });
    if (!res.ok) {
      const data = await res.json();
      console.error("更新放置状态失败:", data.error);
    }
  } catch (err) {
    console.error("更新放置状态异常:", err);
  }
}

function updateWorkspaceCounts() {
  const shelvedList = workspaceProjects.filter((p) => p.isShelved);
  const activeList = workspaceProjects.filter((p) => !p.isShelved);

  const activeCount = activeList.length;
  const shelvedCount = shelvedList.length;
  const builtCount = activeList.filter((p) => p.builtJars && p.builtJars.length > 0).length;
  const unbuiltCount = activeCount - builtCount;
  const publishedCount = activeList.filter((p) => p.isPublished).length;
  const unpublishedCount = activeCount - publishedCount;

  if (workspaceActiveCount) workspaceActiveCount.textContent = activeCount;
  if (workspaceTotalCount) workspaceTotalCount.textContent = activeCount;
  if (workspaceBuiltCount) workspaceBuiltCount.textContent = builtCount;
  if (workspaceUnbuiltCount) workspaceUnbuiltCount.textContent = unbuiltCount;
  if (workspaceUnpublishedCount) workspaceUnpublishedCount.textContent = unpublishedCount;
  if (workspaceShelvedCount) workspaceShelvedCount.textContent = shelvedCount;

  if (chipAllCount) chipAllCount.textContent = activeCount;
  if (chipBuiltCount) chipBuiltCount.textContent = builtCount;
  if (chipUnbuiltCount) chipUnbuiltCount.textContent = unbuiltCount;
  if (chipUnpublishedCount) chipUnpublishedCount.textContent = unpublishedCount;
  if (chipPublishedCount) chipPublishedCount.textContent = publishedCount;
  if (chipShelvedCount) chipShelvedCount.textContent = shelvedCount;
  if (tabShelvedCount) tabShelvedCount.textContent = shelvedCount;
}

function renderWorkspaceProjects() {
  workspaceGrid.replaceChildren();

  const query = workspaceSearchQuery.trim().toLowerCase();
  const filtered = workspaceProjects.filter((p) => {
    if (currentWorkspaceFilter === "shelved") {
      if (!p.isShelved) return false;
    } else {
      if (p.isShelved) return false;
      if (currentWorkspaceFilter === "built" && (!p.builtJars || p.builtJars.length === 0)) return false;
      if (currentWorkspaceFilter === "unbuilt" && p.builtJars && p.builtJars.length > 0) return false;
      if (currentWorkspaceFilter === "published" && !p.isPublished) return false;
      if (currentWorkspaceFilter === "unpublished" && p.isPublished) return false;
    }

    if (query) {
      const matchName = (p.name || "").toLowerCase().includes(query);
      const matchId = (p.id || "").toLowerCase().includes(query);
      const matchFolder = (p.folderName || "").toLowerCase().includes(query);
      const matchDesc = (p.description || "").toLowerCase().includes(query);
      const matchJar = (p.primaryJar?.name || "").toLowerCase().includes(query);
      if (!matchName && !matchId && !matchFolder && !matchDesc && !matchJar) return false;
    }
    return true;
  });

  if (!filtered.length) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty";
    emptyDiv.style.gridColumn = "1 / -1";
    emptyDiv.style.padding = "2.5rem";
    emptyDiv.style.textAlign = "center";
    if (currentWorkspaceFilter === "shelved") {
      emptyDiv.textContent = query
        ? "没有找到符合搜索条件的已放置工程。"
        : "暂无放置中的工程。可在任何工程卡片右上角勾选【暂时放置】，将其移入此列表。";
    } else {
      emptyDiv.textContent = query || currentWorkspaceFilter !== "all"
        ? "没有找到符合当前筛选条件的本地工程。"
        : "该目录下未检测到任何包含 gradle.properties 或 build.gradle 的 Minecraft 模组工程。";
    }
    workspaceGrid.append(emptyDiv);
    return;
  }

  filtered.forEach((p) => {
    const card = document.createElement("div");
    const hasBuilt = p.builtJars && p.builtJars.length > 0;
    card.className = `workspace-card status-${p.isShelved ? "shelved" : (hasBuilt ? "built" : "unbuilt")}`;

    // Top: icon + titles + shelve toggle
    const top = document.createElement("div");
    top.className = "workspace-card__top";

    let iconElem;
    if (p.iconDataUrl) {
      iconElem = document.createElement("img");
      iconElem.className = "workspace-card__icon";
      iconElem.src = p.iconDataUrl;
      iconElem.alt = p.name;
    } else {
      iconElem = document.createElement("div");
      iconElem.className = "workspace-card__icon workspace-card__icon--fallback";
      iconElem.textContent = (p.name || p.id || "M").slice(0, 1).toUpperCase();
    }

    const titleBox = document.createElement("div");
    titleBox.className = "workspace-card__title-box";

    const title = document.createElement("div");
    title.className = "workspace-card__title";
    title.textContent = p.name || p.id;
    title.title = p.name || p.id;

    const idElem = document.createElement("code");
    idElem.className = "workspace-card__id";
    idElem.textContent = p.id;

    const folderElem = document.createElement("span");
    folderElem.className = "workspace-card__folder";
    folderElem.textContent = `📁 ${p.folderName}`;
    folderElem.title = p.dirPath;

    titleBox.append(title, idElem, folderElem);

    const shelveLabel = document.createElement("label");
    shelveLabel.className = `workspace-card__shelve-label ${p.isShelved ? "is-shelved" : ""}`;
    shelveLabel.title = p.isShelved ? "点击取消放置，恢复至活跃工程列表" : "勾选后暂时放置此工程，不再在常规列表中显示";

    const shelveCheckbox = document.createElement("input");
    shelveCheckbox.type = "checkbox";
    shelveCheckbox.checked = Boolean(p.isShelved);
    shelveCheckbox.addEventListener("change", (e) => {
      e.stopPropagation();
      toggleShelveProject(p, shelveCheckbox.checked);
    });

    const shelveText = document.createElement("span");
    shelveText.textContent = p.isShelved ? "已放置" : "暂时放置";

    shelveLabel.append(shelveCheckbox, shelveText);
    top.append(iconElem, titleBox, shelveLabel);

    // Badges Row
    const badgesRow = document.createElement("div");
    badgesRow.className = "workspace-card__badges";

    // Published status badge
    const pubBadge = document.createElement("span");
    if (p.isPublished) {
      pubBadge.className = "batch-badge batch-badge--success";
      pubBadge.textContent = `网站已发布 (${p.publishedReleasesCount}版本)`;
    } else {
      pubBadge.className = "batch-badge batch-badge--pending";
      pubBadge.textContent = "未在网站收录";
    }
    badgesRow.append(pubBadge);

    // Build status badge
    const buildBadge = document.createElement("span");
    if (hasBuilt) {
      buildBadge.className = "batch-badge batch-badge--success";
      buildBadge.textContent = `✔ 已构建 (${p.builtJars.length}个产物)`;
    } else {
      buildBadge.className = "batch-badge batch-badge--error";
      buildBadge.textContent = "⚠️ 未构建";
    }
    badgesRow.append(buildBadge);

    // Meta Details
    const meta = document.createElement("div");
    meta.className = "workspace-card__meta";

    const rowVer = document.createElement("div");
    rowVer.className = "workspace-card__meta-row";
    rowVer.innerHTML = `<span>解析版本:</span><strong class="workspace-card__meta-val">${p.version || "1.0.0"}</strong>`;

    const rowGame = document.createElement("div");
    rowGame.className = "workspace-card__meta-row";
    const gameListStr = (p.gameVersions || []).join(", ") || "未指定";
    rowGame.innerHTML = `<span>Minecraft:</span><span class="workspace-card__meta-val" title="${gameListStr}">${gameListStr}</span>`;

    const rowLoader = document.createElement("div");
    rowLoader.className = "workspace-card__meta-row";
    rowLoader.innerHTML = `<span>加载器:</span><span class="workspace-card__meta-val">${(p.loaders || ["Fabric"]).join(", ")}</span>`;

    if (p.authors && p.authors.length) {
      const rowAuthor = document.createElement("div");
      rowAuthor.className = "workspace-card__meta-row";
      rowAuthor.innerHTML = `<span>作者:</span><span class="workspace-card__meta-val" title="${p.authors.join(", ")}">${p.authors.join(", ")}</span>`;
      meta.append(rowVer, rowGame, rowLoader, rowAuthor);
    } else {
      meta.append(rowVer, rowGame, rowLoader);
    }

    // Built Jar Preview Box
    if (hasBuilt && p.primaryJar) {
      const jarBox = document.createElement("div");
      jarBox.className = "workspace-card__jar-box";

      const jarTitle = document.createElement("div");
      jarTitle.className = "workspace-card__jar-title";
      jarTitle.innerHTML = `<span>📦 编译产物 (.jar)</span><span>${size(p.primaryJar.size)}</span>`;

      const jarName = document.createElement("div");
      jarName.className = "workspace-card__jar-name";
      jarName.textContent = p.primaryJar.name;
      jarName.title = p.primaryJar.path;

      const jarMeta = document.createElement("div");
      jarMeta.className = "workspace-card__jar-meta";
      const mtimeStr = p.primaryJar.mtime ? new Date(p.primaryJar.mtime).toLocaleString("zh-CN") : "";
      jarMeta.textContent = `生成时间: ${mtimeStr}`;

      jarBox.append(jarTitle, jarName, jarMeta);
      meta.append(jarBox);
    }

    // Footer Actions
    const footer = document.createElement("div");
    footer.className = "workspace-card__footer";

    const buildBtn = document.createElement("button");
    buildBtn.type = "button";
    buildBtn.className = "btn-workspace-build";
    buildBtn.textContent = hasBuilt ? "🔨 重新构建" : "🔨 一键构建";
    buildBtn.title = "执行 gradlew.bat build -x test";
    buildBtn.addEventListener("click", () => triggerBuildProject(p));

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "btn-workspace-load";
    loadBtn.textContent = "📝 载入发布表单";
    loadBtn.title = "将此模组信息填入发布页面";
    loadBtn.addEventListener("click", () => loadProjectIntoForm(p));

    const publishBtn = document.createElement("button");
    publishBtn.type = "button";
    publishBtn.className = "btn-workspace-publish";
    publishBtn.textContent = "⚡ 直接发布";
    publishBtn.title = hasBuilt ? "直接将此 jar 文件登记并发布至清单" : "尚未构建 jar 包，请先执行构建";
    publishBtn.disabled = !hasBuilt;
    publishBtn.addEventListener("click", () => directPublishProject(p));

    if (p.isShelved) {
      const unshelveBtn = document.createElement("button");
      unshelveBtn.type = "button";
      unshelveBtn.className = "btn-workspace-load";
      unshelveBtn.textContent = "↩️ 恢复工程";
      unshelveBtn.title = "取消放置，恢复到活跃工程列表中";
      unshelveBtn.addEventListener("click", () => toggleShelveProject(p, false));
      footer.append(unshelveBtn, buildBtn, loadBtn, publishBtn);
    } else {
      footer.append(buildBtn, loadBtn, publishBtn);
    }

    card.append(top, badgesRow, meta, footer);
    workspaceGrid.append(card);
  });
}

let buildTimer = null;
async function triggerBuildProject(project) {
  if (isBuildingProject) return;
  isBuildingProject = true;

  workspaceBuildDialog.showModal();
  workspaceBuildTitle.textContent = `Gradle 构建 - ${project.name || project.id}`;
  workspaceBuildSubtitle.textContent = `目录: ${project.dirPath} | 任务: gradlew.bat build -x test`;
  workspaceBuildStatusBadge.className = "batch-badge batch-badge--pending";
  workspaceBuildStatusBadge.textContent = "🔨 构建执行中…";
  workspaceBuildOutput.textContent = `> cd "${project.dirPath}"\n> gradlew.bat build -x test\n\n正在启动 Gradle 构建进程，请稍候...\n`;
  btnCloseBuildDialog.disabled = true;

  const startTime = performance.now();
  workspaceBuildDuration.textContent = "计时: 0.0 秒";
  if (buildTimer) clearInterval(buildTimer);
  buildTimer = setInterval(() => {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    workspaceBuildDuration.textContent = `计时: ${elapsed} 秒`;
  }, 300);

  try {
    const res = await fetch("/api/workspace/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectPath: project.dirPath, task: "build -x test" })
    });
    const data = await res.json();

    if (buildTimer) clearInterval(buildTimer);
    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    workspaceBuildDuration.textContent = `总耗时: ${duration} 秒`;

    workspaceBuildOutput.textContent = data.output || (data.code === 0 ? "BUILD SUCCESSFUL (无控制台文本输出)" : "BUILD FAILED");
    workspaceBuildOutput.scrollTop = workspaceBuildOutput.scrollHeight;

    if (data.code === 0) {
      workspaceBuildStatusBadge.className = "batch-badge batch-badge--success";
      workspaceBuildStatusBadge.textContent = "✔ 构建成功";
      if (data.project) {
        Object.assign(project, data.project);
        updateWorkspaceCounts();
        renderWorkspaceProjects();
      }
    } else {
      workspaceBuildStatusBadge.className = "batch-badge batch-badge--error";
      workspaceBuildStatusBadge.textContent = `❌ 构建失败 (退出码 ${data.code})`;
    }
  } catch (err) {
    if (buildTimer) clearInterval(buildTimer);
    workspaceBuildStatusBadge.className = "batch-badge batch-badge--error";
    workspaceBuildStatusBadge.textContent = "❌ 请求失败";
    workspaceBuildOutput.textContent += `\n执行出错: ${err.message}`;
  } finally {
    isBuildingProject = false;
    btnCloseBuildDialog.disabled = false;
  }
}

function loadProjectIntoForm(project) {
  switchMode("single");
  projectInput.value = project.id;
  if (form.elements.name) form.elements.name.value = project.name || "";
  if (form.elements.description) form.elements.description.value = project.description || "";
  if (form.elements.version) form.elements.version.value = project.version || "";
  if (form.elements.game) form.elements.game.value = (project.gameVersions || []).join(",");
  if (form.elements.loader) form.elements.loader.value = (project.loaders || ["Fabric"]).join(",");
  if (form.elements.authors) form.elements.authors.value = (project.authors || []).join(", ");
  if (form.elements.source) form.elements.source.value = project.source || "";

  if (project.iconDataUrl) {
    iconPreview.innerHTML = `<img src="${project.iconDataUrl}" style="max-width:100%;max-height:100%;object-fit:contain;">`;
  }

  multiJarTip.style.display = "block";
  if (project.primaryJar) {
    multiJarTip.innerHTML = `✨ 已从本地工程 <strong>${project.name}</strong> 载入基础资料！检测到编译产物：<strong>${project.primaryJar.name}</strong> (${size(project.primaryJar.size)})。可在下方选择该 jar 上传或使用【💻 本地工程探测】页面的【⚡ 直接发布】。`;
  } else {
    multiJarTip.innerHTML = `✨ 已从本地工程 <strong>${project.name}</strong> 载入基础资料！`;
  }

  updateImageHints();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function directPublishProject(project) {
  if (!project.primaryJar) {
    return showResult(false, "该工程暂无编译产物，请先点击【🔨 一键构建】！");
  }

  const proceed = window.confirm(
    `确定将本地工程 "${project.name}" 的构建产物直接发布至 ModSite 网站？\n\n` +
    `模组名称: ${project.name} (${project.id})\n` +
    `发布版本: ${project.version}\n` +
    `构建包: ${project.primaryJar.name} (${size(project.primaryJar.size)})\n` +
    `适用游戏: ${(project.gameVersions || []).join(",") || "未指定"}\n` +
    `加载器: ${(project.loaders || ["Fabric"]).join(",")}`
  );
  if (!proceed) return;

  try {
    const payload = {
      project: project.id,
      name: project.name,
      description: project.description,
      version: project.version,
      game: (project.gameVersions || []).join(","),
      loader: (project.loaders || ["Fabric"]).join(","),
      authors: (project.authors || []).join(", "),
      source: project.source || "",
      jarPath: project.primaryJar.path,
      iconDataUrl: project.iconDataUrl || "",
      allowOverwrite: true
    };

    const res = await fetch("/api/workspace/publish-direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "发布失败");

    showResult(true, `模组 [${project.name}] 版本 ${project.version} 已成功直接发布！\n\n${data.message || ""}`);
    await refreshProjects();
    project.isPublished = true;
    project.publishedReleasesCount = (project.publishedReleasesCount || 0) + 1;
    project.latestPublishedVersion = project.version;
    updateWorkspaceCounts();
    renderWorkspaceProjects();
  } catch (err) {
    showResult(false, err.message);
  }
}

btnScanWorkspace.addEventListener("click", fetchWorkspaceProjects);
workspaceDirInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    fetchWorkspaceProjects();
  }
});
workspaceSearchInput.addEventListener("input", (e) => {
  workspaceSearchQuery = e.target.value;
  renderWorkspaceProjects();
});

workspaceFilterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    workspaceFilterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentWorkspaceFilter = chip.dataset.filter || "all";
    renderWorkspaceProjects();
  });
});

/* ==========================================================================
   Translations & Glossary Terminology System Logic
   ========================================================================== */

async function loadTranslations() {
  try {
    const res = await fetch("/api/translations", { cache: "no-store" });
    if (!res.ok) throw new Error("获取翻译配置失败");
    const data = await res.json();
    currentGlossary = Array.isArray(data.glossary) ? data.glossary : [];
    currentOverrides = (data.overrides && typeof data.overrides === "object") ? data.overrides : {};
  } catch (err) {
    console.warn("加载翻译数据失败:", err);
  }
}

async function loadAndRenderTranslations() {
  await loadTranslations();
  renderGlossaryChips();
  renderModTranslationsList();
}

function renderGlossaryChips() {
  if (!glossaryChipsGrid) return;
  glossaryChipsGrid.replaceChildren();

  if (glossaryCountText) {
    glossaryCountText.textContent = `共 ${currentGlossary.length} 条规范术语`;
  }

  if (!currentGlossary.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.style.padding = "1rem";
    empty.textContent = "暂无术语规则，请在上方输入添加。";
    glossaryChipsGrid.append(empty);
    return;
  }

  currentGlossary.forEach((item, idx) => {
    const chip = document.createElement("div");
    chip.className = "glossary-chip";

    const termSpan = document.createElement("span");
    termSpan.className = "glossary-chip__term";
    termSpan.textContent = item.term;

    const arrowSpan = document.createElement("span");
    arrowSpan.className = "glossary-chip__arrow";
    arrowSpan.textContent = "➔";

    const transSpan = document.createElement("span");
    transSpan.className = "glossary-chip__trans";
    transSpan.textContent = item.translation;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "glossary-chip__del";
    delBtn.title = "删除该术语";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", async () => {
      currentGlossary.splice(idx, 1);
      renderGlossaryChips();
      await saveGlossary(true);
    });

    chip.append(termSpan, arrowSpan, transSpan, delBtn);
    glossaryChipsGrid.append(chip);
  });
}

async function addGlossaryTerm() {
  if (!glossaryTermInput || !glossaryTransInput) return;
  const term = glossaryTermInput.value.trim();
  const translation = glossaryTransInput.value.trim();

  if (!term || !translation) {
    if (glossaryStatusMsg) {
      glossaryStatusMsg.style.color = "#ffb4ab";
      glossaryStatusMsg.textContent = "英文术语与规范翻译均不能为空";
    }
    return;
  }

  const existingIdx = currentGlossary.findIndex((item) => item.term.toLowerCase() === term.toLowerCase());
  if (existingIdx !== -1) {
    currentGlossary[existingIdx].translation = translation;
  } else {
    currentGlossary.unshift({ term, translation });
  }

  glossaryTermInput.value = "";
  glossaryTransInput.value = "";
  renderGlossaryChips();
  await saveGlossary(false);
  glossaryTermInput.focus();
}

async function saveGlossary(silent = false) {
  if (btnSaveGlossary) btnSaveGlossary.disabled = true;
  if (glossaryStatusMsg && !silent) {
    glossaryStatusMsg.style.color = "var(--accent)";
    glossaryStatusMsg.textContent = "正在保存术语表…";
  }

  try {
    const res = await fetch("/api/translations/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ glossary: currentGlossary })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "保存术语表失败");

    if (glossaryStatusMsg) {
      glossaryStatusMsg.style.color = "var(--accent-hover)";
      glossaryStatusMsg.textContent = `✔ 术语表已保存 (${currentGlossary.length} 条)`;
      if (!silent) {
        setTimeout(() => {
          if (glossaryStatusMsg && glossaryStatusMsg.textContent.startsWith("✔")) {
            glossaryStatusMsg.textContent = "";
          }
        }, 4000);
      }
    }
  } catch (err) {
    if (glossaryStatusMsg) {
      glossaryStatusMsg.style.color = "#ffb4ab";
      glossaryStatusMsg.textContent = `❌ 保存失败: ${err.message}`;
    }
  } finally {
    if (btnSaveGlossary) btnSaveGlossary.disabled = false;
  }
}

function hasManualTranslation(proj) {
  const ov = currentOverrides[proj.slug];
  const name_zh = ov?.name_zh !== undefined ? ov.name_zh : (proj.name_zh || "");
  const desc_zh = ov?.description_zh !== undefined ? ov.description_zh : (proj.description_zh || "");
  const long_zh = ov?.longDescription_zh !== undefined ? ov.longDescription_zh : (proj.longDescription_zh || "");
  return Boolean((name_zh && name_zh.trim()) || (desc_zh && desc_zh.trim()) || (long_zh && long_zh.trim()));
}

function updateTransCounts() {
  let manualCount = 0;
  let untranslatedCount = 0;

  projects.forEach((proj) => {
    if (hasManualTranslation(proj)) {
      manualCount++;
    } else {
      untranslatedCount++;
    }
  });

  const total = projects.length;
  if (transChipAllCount) transChipAllCount.textContent = total;
  if (transChipManualCount) transChipManualCount.textContent = manualCount;
  if (transChipUntranslatedCount) transChipUntranslatedCount.textContent = untranslatedCount;
}

function renderModTranslationsList() {
  if (!modTranslationsList) return;
  updateTransCounts();
  modTranslationsList.replaceChildren();

  const query = transSearchQuery.trim().toLowerCase();
  const visible = projects.filter((proj) => {
    const isManual = hasManualTranslation(proj);
    if (currentTransFilter === "manual" && !isManual) return false;
    if (currentTransFilter === "untranslated" && isManual) return false;

    if (query) {
      const matchSlug = proj.slug.toLowerCase().includes(query);
      const matchName = (proj.name || "").toLowerCase().includes(query);
      const matchNameZh = (proj.name_zh || (currentOverrides[proj.slug]?.name_zh || "")).toLowerCase().includes(query);
      if (!matchSlug && !matchName && !matchNameZh) return false;
    }
    return true;
  });

  if (!visible.length) {
    const emptyP = document.createElement("p");
    emptyP.className = "empty";
    emptyP.textContent = "未找到符合筛选条件的模组。";
    modTranslationsList.append(emptyP);
    return;
  }

  visible.forEach((proj) => {
    const card = document.createElement("div");
    card.dataset.slug = proj.slug;
    const isManual = hasManualTranslation(proj);
    card.className = "trans-mod-card" + (isManual ? " has-manual" : "");

    // Header
    const header = document.createElement("div");
    header.className = "trans-mod-card__header";

    const titleBox = document.createElement("div");
    titleBox.className = "trans-mod-card__title-box";

    let iconElem;
    if (proj.icon) {
      iconElem = document.createElement("img");
      iconElem.className = "trans-mod-card__icon";
      iconElem.src = proj.icon;
      iconElem.alt = "";
    } else {
      iconElem = document.createElement("div");
      iconElem.className = "trans-mod-card__icon trans-mod-card__icon--fallback";
      iconElem.textContent = proj.name.slice(0, 1).toUpperCase();
    }

    const titleInfo = document.createElement("div");
    const titleName = document.createElement("h4");
    titleName.className = "trans-mod-card__name";
    titleName.textContent = proj.name;
    const titleSlug = document.createElement("span");
    titleSlug.className = "trans-mod-card__slug";
    titleSlug.textContent = proj.slug;
    titleInfo.append(titleName, titleSlug);
    titleBox.append(iconElem, titleInfo);

    const badge = document.createElement("span");
    badge.className = isManual ? "batch-badge batch-badge--success" : "batch-badge batch-badge--pending";
    badge.textContent = isManual ? "✨ 已有人工校对" : "⏳ 纯自动机翻";

    header.append(titleBox, badge);

    // Original English Reference Box
    const origBox = document.createElement("div");
    origBox.className = "trans-mod-card__orig-snippet";
    const origLabel = document.createElement("div");
    origLabel.className = "trans-mod-card__orig-label";
    origLabel.textContent = "📄 英文原文（供对照参考）：";
    const origText = document.createElement("div");
    const rawEnglish = (proj.description && !isPlaceholderDesc(proj.description)) ? proj.description : (proj.longDescription || "暂无英文简介");
    origText.textContent = rawEnglish.length > 200 ? rawEnglish.slice(0, 200) + "…" : rawEnglish;
    origBox.append(origLabel, origText);

    // Form inputs
    const fields = document.createElement("div");
    fields.className = "trans-mod-card__fields";

    const ov = currentOverrides[proj.slug] || {};
    const valNameZh = ov.name_zh !== undefined ? ov.name_zh : (proj.name_zh || "");
    const valDescZh = ov.description_zh !== undefined ? ov.description_zh : (proj.description_zh || "");
    const valLongZh = ov.longDescription_zh !== undefined ? ov.longDescription_zh : (proj.longDescription_zh || "");

    const nameZhLabel = document.createElement("label");
    nameZhLabel.innerHTML = `模组中文名称 <small>用于列表与详情页标题</small>`;
    const nameZhInput = document.createElement("input");
    nameZhInput.type = "text";
    nameZhInput.className = "workspace-input trans-name-zh";
    nameZhInput.value = valNameZh;
    nameZhInput.placeholder = `示例: ${proj.name} 拓展`;
    nameZhLabel.append(nameZhInput);

    const descZhLabel = document.createElement("label");
    descZhLabel.className = "wide";
    descZhLabel.innerHTML = `中文一句话简介 <small>用于前台模组卡片展示</small>`;
    const descZhTextarea = document.createElement("textarea");
    descZhTextarea.rows = 2;
    descZhTextarea.className = "workspace-input trans-desc-zh";
    descZhTextarea.value = valDescZh;
    descZhTextarea.placeholder = `输入精准中文简介…`;
    descZhLabel.append(descZhTextarea);

    const longZhLabel = document.createElement("label");
    longZhLabel.className = "wide";
    longZhLabel.innerHTML = `中文详细介绍 Markdown <small>可选，详情页正文中文展示</small>`;
    const longZhTextarea = document.createElement("textarea");
    longZhTextarea.rows = 4;
    longZhTextarea.className = "workspace-input trans-long-desc-zh";
    longZhTextarea.value = valLongZh;
    longZhTextarea.placeholder = `中文详细介绍 Markdown…`;
    longZhLabel.append(longZhTextarea);

    fields.append(nameZhLabel, descZhLabel, longZhLabel);

    // Footer actions
    const actions = document.createElement("div");
    actions.className = "trans-mod-card__actions";

    const btnGroup = document.createElement("div");
    btnGroup.className = "trans-mod-card__btn-group";

    const draftBtn = document.createElement("button");
    draftBtn.type = "button";
    draftBtn.className = "btn-subaction";
    draftBtn.textContent = "⚡ 一键机翻建议 (草稿)";
    draftBtn.title = "结合术语表自动生成高质量机翻并填入输入框，不会直接保存";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn-primary";
    saveBtn.textContent = "💾 保存此模组翻译";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn-subaction";
    clearBtn.style.color = "#ffb4ab";
    clearBtn.textContent = "🗑️ 清空纠偏";
    clearBtn.title = "清空人工翻译，恢复全自动机翻";

    btnGroup.append(draftBtn, saveBtn, clearBtn);

    const statusMsg = document.createElement("span");
    statusMsg.className = "trans-status-msg";

    actions.append(btnGroup, statusMsg);

    // Action listeners
    draftBtn.addEventListener("click", async () => {
      draftBtn.disabled = true;
      draftBtn.textContent = "正在机翻…";
      statusMsg.style.color = "var(--accent)";
      statusMsg.textContent = "正在调用 Microsoft Translator 结合术语表翻译…";

      try {
        if (proj.description && !isPlaceholderDesc(proj.description)) {
          const transDesc = await translateText(proj.description, "zh", "en", currentGlossary);
          if (transDesc) descZhTextarea.value = transDesc;
        }

        if (proj.longDescription && !isPlaceholderDesc(proj.longDescription)) {
          const transLong = await translateText(proj.longDescription, "zh", "en", currentGlossary);
          if (transLong) longZhTextarea.value = transLong;
        }

        statusMsg.style.color = "var(--accent-hover)";
        statusMsg.textContent = "✔ 已填入智能机翻建议草稿，请核对后点击【保存】";
      } catch (err) {
        statusMsg.style.color = "#ffb4ab";
        statusMsg.textContent = `机翻失败: ${err.message}`;
      } finally {
        draftBtn.disabled = false;
        draftBtn.textContent = "⚡ 一键机翻建议 (草稿)";
      }
    });

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      statusMsg.style.color = "var(--accent)";
      statusMsg.textContent = "正在保存…";

      const name_zh = nameZhInput.value.trim();
      const description_zh = descZhTextarea.value.trim();
      const longDescription_zh = longZhTextarea.value.trim();

      const modOverride = { name_zh, description_zh, longDescription_zh };
      currentOverrides[proj.slug] = modOverride;

      try {
        const res = await fetch("/api/translations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overrides: { [proj.slug]: modOverride },
            syncToCatalog: true
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "保存失败");

        proj.name_zh = name_zh;
        proj.description_zh = description_zh;
        proj.longDescription_zh = longDescription_zh;

        const manualNow = hasManualTranslation(proj);
        card.classList.toggle("has-manual", manualNow);
        badge.className = manualNow ? "batch-badge batch-badge--success" : "batch-badge batch-badge--pending";
        badge.textContent = manualNow ? "✨ 已有人工校对" : "⏳ 纯自动机翻";

        statusMsg.style.color = "var(--accent-hover)";
        statusMsg.textContent = "✔ 已成功保存并同步至前台网站";
        updateTransCounts();
        setTimeout(() => {
          if (statusMsg && statusMsg.textContent.startsWith("✔")) statusMsg.textContent = "";
        }, 3000);
      } catch (err) {
        statusMsg.style.color = "#ffb4ab";
        statusMsg.textContent = `❌ 保存失败: ${err.message}`;
      } finally {
        saveBtn.disabled = false;
      }
    });

    clearBtn.addEventListener("click", async () => {
      if (!window.confirm(`确定清空模组 "${proj.name}" 的人工纠偏译文并恢复全自动机翻？`)) return;
      delete currentOverrides[proj.slug];
      nameZhInput.value = "";
      descZhTextarea.value = "";
      longZhTextarea.value = "";
      proj.name_zh = "";
      proj.description_zh = "";
      proj.longDescription_zh = "";

      try {
        await fetch("/api/translations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overrides: { [proj.slug]: { name_zh: "", description_zh: "", longDescription_zh: "" } },
            syncToCatalog: true
          })
        });
        card.classList.remove("has-manual");
        badge.className = "batch-badge batch-badge--pending";
        badge.textContent = "⏳ 纯自动机翻";
        statusMsg.style.color = "var(--muted)";
        statusMsg.textContent = "已恢复为全自动机翻";
        updateTransCounts();
      } catch (err) {
        statusMsg.style.color = "#ffb4ab";
        statusMsg.textContent = `清空失败: ${err.message}`;
      }
    });

    card.append(header, origBox, fields, actions);
    modTranslationsList.append(card);
  });
}

async function batchDraftMtAll() {
  if (isBatchTranslatingDrafts) return;
  const unhandled = projects.filter((p) => !hasManualTranslation(p) && p.description && !isPlaceholderDesc(p.description));
  if (!unhandled.length) {
    alert("当前所有模组均已有人工校对，或无有效英文正文！");
    return;
  }

  const proceed = window.confirm(`将为未校对的 ${unhandled.length} 个模组并发获取智能机翻草稿建议并填入卡片。\n\n不会直接覆盖已有人工翻译，机翻填入后可逐一修改并点击保存。是否继续？`);
  if (!proceed) return;

  isBatchTranslatingDrafts = true;
  if (btnBatchDraftMt) {
    btnBatchDraftMt.disabled = true;
    btnBatchDraftMt.textContent = `正在生成 0/${unhandled.length}…`;
  }

  let finished = 0;
  for (const proj of unhandled) {
    try {
      const transDesc = await translateText(proj.description, "zh", "en", currentGlossary);
      const descInput = modTranslationsList ? modTranslationsList.querySelector(`.trans-mod-card[data-slug="${proj.slug}"] .trans-desc-zh`) : null;
      if (descInput && transDesc) {
        descInput.value = transDesc;
      }
    } catch {}
    finished++;
    if (btnBatchDraftMt) {
      btnBatchDraftMt.textContent = `正在生成 ${finished}/${unhandled.length}…`;
    }
  }

  isBatchTranslatingDrafts = false;
  if (btnBatchDraftMt) {
    btnBatchDraftMt.disabled = false;
    btnBatchDraftMt.textContent = "⚡ 一键获取全模组机翻草稿建议";
  }
  alert(`已完成 ${finished} 个模组的智能机翻草稿填入，请逐项核对后点击【保存】！`);
}

// Bind Glossary & Translation controls
if (btnAddGlossary) btnAddGlossary.addEventListener("click", addGlossaryTerm);
if (glossaryTermInput) {
  glossaryTermInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addGlossaryTerm();
    }
  });
}
if (glossaryTransInput) {
  glossaryTransInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addGlossaryTerm();
    }
  });
}
if (btnSaveGlossary) btnSaveGlossary.addEventListener("click", () => saveGlossary(false));
if (btnBatchDraftMt) btnBatchDraftMt.addEventListener("click", batchDraftMtAll);

if (transSearchInput) {
  transSearchInput.addEventListener("input", (e) => {
    transSearchQuery = e.target.value;
    renderModTranslationsList();
  });
}

transFilterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    transFilterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentTransFilter = chip.dataset.transFilter || "all";
    renderModTranslationsList();
  });
});
