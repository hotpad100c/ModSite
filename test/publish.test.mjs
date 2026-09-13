import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { applyProjectMetadata, applyRelease, getMimeType, imageRecord, parseArgs } from "../scripts/publish.mjs";

test("解析多个发布文件与本地图片参数", () => {
  assert.deepEqual(
    parseArgs([
      "--project", "demo",
      "--version", "1.0.0",
      "--icon-file", "icon.png",
      "--banner-file", "banner.webp",
      "a.jar", "b.jar",
      "--dry-run"
    ]),
    {
      project: "demo",
      version: "1.0.0",
      "icon-file": "icon.png",
      "banner-file": "banner.webp",
      files: ["a.jar", "b.jar"],
      "dry-run": true
    }
  );
});

test("创建项目并阻止重复版本", () => {
  const catalog = { projects: [] };
  const options = { project: "demo", name: "Demo", version: "1.0.0", "long-description": "详细介绍", icon: "https://example.com/icon.png", banner: "https://example.com/banner.webp" };
  const release = { version: "1.0.0", files: [] };
  applyRelease(catalog, options, release);
  assert.equal(catalog.projects[0].releases[0], release);
  assert.equal(catalog.projects[0].longDescription, "详细介绍");
  assert.equal(catalog.projects[0].icon, "https://example.com/icon.png");
  assert.throws(() => applyRelease(catalog, options, release), /已存在版本/);
});

test("支持独立更新项目资料与图片而不发布新版本", () => {
  const catalog = {
    projects: [
      {
        slug: "demo",
        name: "Demo",
        description: "旧简介",
        longDescription: "旧介绍",
        icon: "https://example.com/old-icon.png",
        banner: "",
        releases: [{ version: "1.0.0", files: [] }]
      }
    ]
  };
  const options = {
    project: "demo",
    name: "Demo Updated",
    description: "新简介",
    icon: "https://dl.ryan100c.party/images/demo-icon.png",
    banner: "https://dl.ryan100c.party/images/demo-banner.webp"
  };
  applyProjectMetadata(catalog, options);
  assert.equal(catalog.projects[0].name, "Demo Updated");
  assert.equal(catalog.projects[0].description, "新简介");
  assert.equal(catalog.projects[0].icon, "https://dl.ryan100c.party/images/demo-icon.png");
  assert.equal(catalog.projects[0].banner, "https://dl.ryan100c.party/images/demo-banner.webp");
  // 确认原有 release 未受影响
  assert.equal(catalog.projects[0].releases.length, 1);
});

test("图片记录生成规则符合模组ID命名与正确MIME类型", async () => {
  // 使用现有文件测试 imageRecord
  const testFilePath = resolve("package.json");
  const record = await imageRecord(testFilePath, "lucidity", "icon", "https://dl.ryan100c.party");
  assert.equal(record.key, "images/lucidity-icon.json");
  assert.equal(record.url, "https://dl.ryan100c.party/images/lucidity-icon.json");

  assert.equal(getMimeType("test.png"), "image/png");
  assert.equal(getMimeType("test.webp"), "image/webp");
  assert.equal(getMimeType("test.jpg"), "image/jpeg");
  assert.equal(getMimeType("test.svg"), "image/svg+xml");
});

test("持久化 authors 与 source 属性到项目信息中", () => {
  const catalog = { projects: [] };
  const options = {
    project: "lucidity",
    name: "Lucidity",
    source: "https://github.com/Ryan100c/Lucidity",
    authors: "Ryan100c, ContributorOne"
  };
  const project = applyProjectMetadata(catalog, options);
  assert.equal(project.source, "https://github.com/Ryan100c/Lucidity");
  assert.deepEqual(project.authors, ["Ryan100c", "ContributorOne"]);
});
