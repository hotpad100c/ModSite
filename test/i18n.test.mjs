import test from "node:test";
import assert from "node:assert/strict";
import {
  translations,
  t,
  maskText,
  unmaskText,
  isPlaceholderDesc
} from "../site/i18n.js";

test("i18n: 完整提供中英文核心 UI 词条", () => {
  const enKeys = Object.keys(translations.en);
  const zhKeys = Object.keys(translations.zh);

  assert.ok(enKeys.length >= 25, "英文词条数满足需求");
  assert.ok(zhKeys.length >= 25, "中文词条数满足需求");

  // Verify all English keys have corresponding Chinese keys
  enKeys.forEach((k) => {
    assert.ok(translations.zh[k] !== undefined, `中文翻译缺失对应词条: ${k}`);
  });
});

test("i18n: t() 字典读取与参数动态插值", () => {
  assert.equal(t("btnDownload", {}, "en"), "Download");
  assert.equal(t("btnDownload", {}, "zh"), "下载");

  assert.equal(t("modsCountPlural", { count: 36 }, "en"), "36 mods");
  assert.equal(t("modsCountPlural", { count: 36 }, "zh"), "共 36 个模组");

  assert.equal(t("latestVersion", { version: "1.0.0" }, "en"), "Latest 1.0.0");
  assert.equal(t("latestVersion", { version: "1.0.0" }, "zh"), "最新版本 1.0.0");

  // Fallback to key when missing
  assert.equal(t("non_existing_key", {}, "zh"), "non_existing_key");
});

test("i18n: maskText & unmaskText 严密保护代码块与模组生态关键词", () => {
  const raw = `### Features
- Supports \`Fabric\` and Quilt on Minecraft 1.20.1!
- Download on [Modrinth](https://modrinth.com/mod/carpetgui) now!
\`\`\`java
System.out.println("No translate");
\`\`\``;

  const { masked, placeholders } = maskText(raw);

  // Masked string should not contain raw code blocks or protected names directly
  assert.ok(!masked.includes("System.out.println"), "代码块内容被成功保护占位");
  assert.ok(!masked.includes("https://modrinth.com"), "Markdown 链接地址被成功保护占位");

  // Simulating MT translation where brackets might get modified
  let simulatedMT = masked
    .replace("### Features", "### 特色")
    .replace("Download on", "立即下载至")
    .replace("now!", "！");

  const restored = unmaskText(simulatedMT, placeholders);

  assert.ok(restored.includes("`Fabric`"), "成功还原内联代码 `Fabric`");
  assert.ok(restored.includes("Quilt"), "成功还原生态词 Quilt");
  assert.ok(restored.includes("Minecraft"), "成功还原 Minecraft 词汇");
  assert.ok(restored.includes("[Modrinth](https://modrinth.com/mod/carpetgui)"), "成功还原完整 Markdown 链接");
  assert.ok(restored.includes('System.out.println("No translate");'), "成功还原完整多行代码块");
});

test("i18n: isPlaceholderDesc 准确识别模板占位简介", () => {
  assert.equal(isPlaceholderDesc(""), true);
  assert.equal(isPlaceholderDesc("   "), true);
  assert.equal(isPlaceholderDesc(null), true);
  assert.equal(isPlaceholderDesc("This is an example description! Tell everyone what your mod is about!"), true);
  assert.equal(isPlaceholderDesc("A real mod description for testing"), false);
});
