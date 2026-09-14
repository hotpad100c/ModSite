// i18n module with dictionary-based UI translations and protected machine translation fallback

export const translations = {
  en: {
    brandMark: "✦",
    homeEyebrow: "MOD COLLECTION",
    homeTitle: "Collection",
    homeDesc: "All my mods",
    searchPlaceholder: "Search by name, version, loader…",
    searchAriaLabel: "Filter mods",
    modsCountSingle: "1 mod",
    modsCountPlural: "{count} mods",
    loadingMods: "Loading mods…",
    noMatch: "No matching mods found.",
    noModsYet: "No mods published yet.",
    latestVersion: "Latest {version}",
    gameVersion: "Game {version}",
    mcVersion: "MC {version}",
    modOverview: "MOD OVERVIEW",
    byAuthor: "By: {authors}",
    sourceLink: "Source ↗",
    sectionDescription: "Description",
    sectionDownloads: "Downloads",
    tagLatest: "Latest",
    btnDownload: "Download",
    emptyVersions: "No available versions yet.",
    emptyDescription: "No description provided yet.",
    loadingModDetails: "Loading mod details…",
    modNotExist: "Mod does not exist",
    backToList: "← Back",
    transBadgeMT: "🌐 Machine Translated",
    transBadgeOrig: "📄 Original English",
    transHintMT: "Content translated into Chinese",
    transHintOrig: "Viewing original untranslated text",
    btnShowOriginal: "View Original English",
    btnShowTranslation: "Translate to Chinese ↗",
    translating: "Translating content…",
    transFail: "Translation unavailable, displaying original.",
    noSummaryAvailable: "No description provided yet."
  },
  zh: {
    brandMark: "✦",
    homeEyebrow: "模组精选收录",
    homeTitle: "模组列表",
    homeDesc: "收录所有模组与发布历史",
    searchPlaceholder: "按名称、版本、加载器搜索模组…",
    searchAriaLabel: "筛选模组",
    modsCountSingle: "共 1 个模组",
    modsCountPlural: "共 {count} 个模组",
    loadingMods: "正在加载模组列表…",
    noMatch: "未找到匹配的模组。",
    noModsYet: "暂无已发布的模组。",
    latestVersion: "最新版本 {version}",
    gameVersion: "游戏 {version}",
    mcVersion: "MC {version}",
    modOverview: "模组概览",
    byAuthor: "作者：{authors}",
    sourceLink: "源码仓库 ↗",
    sectionDescription: "详细介绍",
    sectionDownloads: "版本下载",
    tagLatest: "最新",
    btnDownload: "下载",
    emptyVersions: "暂无可用的发布版本。",
    emptyDescription: "暂无详细介绍。",
    loadingModDetails: "正在加载模组详情…",
    modNotExist: "未找到该模组",
    backToList: "← 返回列表",
    transBadgeMT: "🌐 智能机翻",
    transBadgeOrig: "📄 英文原文",
    transHintMT: "已自动将正文翻译为中文",
    transHintOrig: "当前正在浏览未经翻译的英文原文",
    btnShowOriginal: "查看英文原文",
    btnShowTranslation: "切换智能机翻 ↗",
    translating: "正在智能机翻…",
    transFail: "翻译暂不可用，已展示原文。",
    noSummaryAvailable: "暂无模组简介。"
  }
};

const STORAGE_KEY = "modsite_site_lang";
const CACHE_PREFIX = "modsite_mt_cache_";

const PROTECTED_TERMS = [
  "Fabric", "Quilt", "Forge", "NeoForge", "Modrinth", "CurseForge",
  "Minecraft", "CarpetMod", "CarpetGUI", "Lucidity", "VisualDust",
  "ItemFlowTracker", "ExplosionVisualizer", "ColorfulCollars",
  "Log4C", "ScheduledTickVisualizer", "PlayerControl", "SimpleEyeLine",
  "Simulatica", "TMWIN", "TinyTooOver", "WaysToDie", "Ryan100c"
];

const PLACEHOLDER_DESC = "This is an example description! Tell everyone what your mod is about!";

export function isPlaceholderDesc(text) {
  if (!text) return true;
  const trimmed = text.trim();
  return !trimmed || trimmed === PLACEHOLDER_DESC;
}

export function getCurrentLang() {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") return saved;
    }
  } catch {}

  try {
    if (typeof navigator !== "undefined" && navigator.language) {
      if (navigator.language.toLowerCase().startsWith("zh")) return "zh";
    }
  } catch {}

  return "en";
}

export function setLang(lang) {
  const target = lang === "zh" ? "zh" : "en";
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, target);
    }
  } catch {}
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.lang = target === "zh" ? "zh-CN" : "en";
  }
  return target;
}

export function t(key, params = {}, lang = getCurrentLang()) {
  const dict = translations[lang] || translations.en;
  let text = dict[key] !== undefined ? dict[key] : (translations.en[key] !== undefined ? translations.en[key] : key);
  for (const [pKey, pVal] of Object.entries(params)) {
    text = text.replaceAll(`{${pKey}}`, pVal);
  }
  return text;
}

export function updateDomTranslations(lang = getCurrentLang()) {
  if (typeof document === "undefined") return;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key, {}, lang);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.setAttribute("placeholder", t(key, {}, lang));
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (key) el.setAttribute("aria-label", t(key, {}, lang));
  });
}

export function setupLanguageSwitcher(onChange) {
  if (typeof document === "undefined") return;

  const currentLang = getCurrentLang();
  setLang(currentLang);

  const updateButtons = (lang) => {
    document.querySelectorAll(".lang-switch .lang-btn").forEach((btn) => {
      const targetLang = btn.getAttribute("data-lang");
      btn.classList.toggle("active", targetLang === lang);
    });
  };

  updateButtons(currentLang);
  updateDomTranslations(currentLang);

  document.querySelectorAll(".lang-switch .lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const newLang = btn.getAttribute("data-lang");
      if (!newLang || newLang === getCurrentLang()) return;
      setLang(newLang);
      updateButtons(newLang);
      updateDomTranslations(newLang);
      if (typeof onChange === "function") {
        onChange(newLang);
      }
    });
  });
}

function stringHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

function getCachedTranslation(sourceText, targetLang) {
  try {
    if (typeof localStorage !== "undefined") {
      const key = `${CACHE_PREFIX}${targetLang}_${stringHash(sourceText)}`;
      return localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function setCachedTranslation(sourceText, targetLang, translatedText) {
  try {
    if (typeof localStorage !== "undefined") {
      const key = `${CACHE_PREFIX}${targetLang}_${stringHash(sourceText)}`;
      localStorage.setItem(key, translatedText);
    }
  } catch {}
}

export function maskText(text) {
  const placeholders = [];
  let masked = text;

  // 1. Code blocks: ```...```
  masked = masked.replace(/```[\s\S]*?```/g, (match) => {
    const p = `__MC_CODE_${placeholders.length}__`;
    placeholders.push({ p, original: match });
    return p;
  });

  // 2. Inline code: `...`
  masked = masked.replace(/`[^`\n]+`/g, (match) => {
    const p = `__MC_CODE_${placeholders.length}__`;
    placeholders.push({ p, original: match });
    return p;
  });

  // 3. URLs in markdown links [text](url) -> translate text, protect url
  masked = masked.replace(/(\[[^\]]+\]\()([^\)]+)(\))/g, (match, prefix, url, suffix) => {
    const p = `__MC_URL_${placeholders.length}__`;
    placeholders.push({ p, original: url });
    return `${prefix}${p}${suffix}`;
  });

  // 4. Raw URLs: https://...
  masked = masked.replace(/(https?:\/\/[^\s\)\>\]]+)/g, (match) => {
    const p = `__MC_RAWURL_${placeholders.length}__`;
    placeholders.push({ p, original: match });
    return p;
  });

  // 5. Protected terms (whole words)
  PROTECTED_TERMS.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    masked = masked.replace(regex, (match) => {
      const p = `__MC_TERM_${placeholders.length}__`;
      placeholders.push({ p, original: match });
      return p;
    });
  });

  return { masked, placeholders };
}

export function unmaskText(text, placeholders) {
  let result = text;

  for (let i = placeholders.length - 1; i >= 0; i--) {
    const { p, original } = placeholders[i];
    const fuzzy = new RegExp(`__\\s*${p.replace(/__/g, "")}\\s*__`, "gi");
    result = result.replace(fuzzy, original);
    result = result.replaceAll(p, original);
  }

  // Repair markdown links if MT converted parentheses to fullwidth: [name]（url） -> [name](url)
  result = result.replace(/\]\s*[（\(]([^\)\uff09]+)[）\)]/g, (match, url) => `](${url.trim()})`);

  return result;
}

export async function translateText(text, targetLang = "zh", sourceLang = "en") {
  if (!text || !text.trim()) return text;
  if (targetLang === sourceLang) return text;
  if (isPlaceholderDesc(text)) {
    return targetLang === "zh" ? t("noSummaryAvailable", {}, "zh") : t("noSummaryAvailable", {}, "en");
  }

  const cached = getCachedTranslation(text, targetLang);
  if (cached) return cached;

  const { masked, placeholders } = maskText(text);

  try {
    const toParam = targetLang === "zh" ? "zh-Hans" : targetLang;
    const fromParam = sourceLang === "zh" ? "zh-Hans" : sourceLang;
    const url = `https://edge.microsoft.com/translate/translatetext?from=${fromParam}&to=${toParam}&isEnterpriseClient=false`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([masked])
    });

    if (!res.ok) throw new Error(`MT failed with status ${res.status}`);
    const data = await res.json();
    const rawTrans = data?.[0]?.translations?.[0]?.text;
    if (!rawTrans) throw new Error("Empty translation result");

    const final = unmaskText(rawTrans, placeholders);
    setCachedTranslation(text, targetLang, final);
    return final;
  } catch (err) {
    console.warn("Machine translation error:", err.message);
    return text; // Graceful fallback to original text
  }
}

export async function translateBatch(texts, targetLang = "zh", sourceLang = "en") {
  if (!texts || !texts.length) return [];
  if (targetLang === sourceLang) return [...texts];

  const results = new Array(texts.length);
  const uncachedIndices = [];
  const uncachedMasked = [];
  const uncachedPlaceholders = [];

  for (let i = 0; i < texts.length; i++) {
    const str = texts[i];
    if (!str || !str.trim()) {
      results[i] = str;
      continue;
    }
    if (isPlaceholderDesc(str)) {
      results[i] = targetLang === "zh" ? t("noSummaryAvailable", {}, "zh") : t("noSummaryAvailable", {}, "en");
      continue;
    }

    const cached = getCachedTranslation(str, targetLang);
    if (cached) {
      results[i] = cached;
    } else {
      const { masked, placeholders } = maskText(str);
      uncachedIndices.push(i);
      uncachedMasked.push(masked);
      uncachedPlaceholders.push(placeholders);
    }
  }

  if (!uncachedIndices.length) return results;

  try {
    const toParam = targetLang === "zh" ? "zh-Hans" : targetLang;
    const fromParam = sourceLang === "zh" ? "zh-Hans" : sourceLang;
    const url = `https://edge.microsoft.com/translate/translatetext?from=${fromParam}&to=${toParam}&isEnterpriseClient=false`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uncachedMasked)
    });

    if (!res.ok) throw new Error(`MT batch failed with status ${res.status}`);
    const data = await res.json();

    uncachedIndices.forEach((origIdx, batchIdx) => {
      const rawTrans = data?.[batchIdx]?.translations?.[0]?.text;
      if (rawTrans) {
        const final = unmaskText(rawTrans, uncachedPlaceholders[batchIdx]);
        setCachedTranslation(texts[origIdx], targetLang, final);
        results[origIdx] = final;
      } else {
        results[origIdx] = texts[origIdx];
      }
    });
  } catch (err) {
    console.warn("Batch machine translation error:", err.message);
    uncachedIndices.forEach((origIdx) => {
      results[origIdx] = texts[origIdx];
    });
  }

  return results;
}
