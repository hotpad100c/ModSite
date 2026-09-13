import { renderMarkdown } from "./markdown.js";

const root = document.querySelector("#mod-page");
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const formatBytes = (bytes) => bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const icon = (project) => { if (!project.icon) return element("span", "project-icon project-icon--fallback project-icon--large", project.name.slice(0, 1)); const image = element("img", "project-icon project-icon--large"); image.src = project.icon; image.alt = ""; return image; };
const renderFile = (file) => {
  const item = element("li", "download-file");
  const info = element("div");
  info.append(element("strong", "", file.name));
  const hashStr = file.sha256
    ? ` · SHA-256 ${file.sha256.slice(0, 12)}…`
    : (file.sha512 ? ` · SHA-512 ${file.sha512.slice(0, 12)}…` : "");
  info.append(element("span", "download-file__meta", `${formatBytes(file.size)}${hashStr}`));
  const link = element("a", "download", "Download");
  link.href = file.url;
  link.setAttribute("download", "");
  item.append(info, link);
  return item;
};

const renderRelease = (release, latest) => {
  const details = element("details", "release");
  details.open = latest;
  const summary = element("summary");
  summary.append(element("strong", "", `v${release.version}`));
  const releaseDate = release.publishedAt || release.releasedAt;
  if (releaseDate) {
    summary.append(element("span", "release__date", new Date(releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })));
  }
  if (latest) summary.append(element("span", "tag tag--accent", "Latest"));
  details.append(summary);

  const body = element("div", "release__body");
  const tags = element("div", "tags");
  const gameList = release.gameVersions || release.game || [];
  [...gameList.map((version) => `MC ${version}`), ...(release.loaders || [])].forEach((value) => tags.append(element("span", "tag", value)));
  if (tags.childElementCount) body.append(tags);
  if (release.notes) body.append(element("p", "release__notes", release.notes));
  const files = element("ul", "download-files");
  (release.files || []).forEach((file) => files.append(renderFile(file)));
  body.append(files);
  details.append(body);
  return details;
};

const renderProject = (project) => {
  document.title = `${project.name} · ${document.querySelector("#site-name").textContent}`;
  root.replaceChildren();

  const banner = element("section", "mod-banner");
  if (project.banner) {
    const image = element("img", "mod-banner__image");
    image.src = project.banner;
    image.alt = "";
    banner.append(image);
  } else {
    banner.classList.add("placeholder-banner");
  }

  const bannerContent = element("div", "mod-banner__content");
  bannerContent.append(icon(project));

  const heading = element("div");
  heading.append(element("p", "eyebrow", "MOD OVERVIEW"));
  heading.append(element("h1", "", project.name));

  const metaRow = element("div", "mod-banner__meta");
  if (project.authors && project.authors.length) {
    metaRow.append(element("span", "mod-banner__authors", `By: ${project.authors.join(", ")}`));
  }
  if (project.source) {
    const sourceLink = element("a", "mod-banner__source", "Source ↗");
    sourceLink.href = project.source;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    metaRow.append(sourceLink);
  }
  if (metaRow.childElementCount) heading.append(metaRow);
  if (project.description) heading.append(element("p", "mod-banner__summary", project.description));

  bannerContent.append(heading);
  banner.append(bannerContent);
  root.append(banner);

  const layout = element("div", "mod-layout");
  const article = element("article", "mod-introduction");
  article.append(element("h2", "", "Description"));
  const description = element("div", "long-description");
  description.append(renderMarkdown(project.longDescription || project.description || "No description provided yet."));
  article.append(description);
  layout.append(article);

  const aside = element("aside", "download-panel");
  aside.append(element("h2", "", "Downloads"));
  if (!project.releases || !project.releases.length) {
    aside.append(element("p", "empty", "No available versions yet."));
  } else {
    project.releases.forEach((release, index) => aside.append(renderRelease(release, index === 0)));
  }
  layout.append(aside);
  root.append(layout);
};

try {
  const [configResponse, catalogResponse] = await Promise.all([
    fetch("./config.json", { cache: "no-store" }),
    fetch("./catalog.json", { cache: "no-store" })
  ]);
  if (!configResponse.ok || !catalogResponse.ok) throw new Error("Unable to load site data");
  const [config, catalog] = await Promise.all([configResponse.json(), catalogResponse.json()]);
  document.querySelector("#site-name").textContent = config.siteName;
  const project = catalog.projects.find((item) => item.slug === new URLSearchParams(location.search).get("project"));
  if (!project) throw new Error("Mod does not exist");
  renderProject(project);
} catch (error) {
  root.replaceChildren(element("p", "error", `${error.message}.`));
}

