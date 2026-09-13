# 模组站视觉风格重构、版本维护管理与 Cloudflare 部署说明

## 一、版本维护与文件管理功能（已上线）

在管理后台（`http://127.0.0.1:4173/`）新增 **「📦 版本维护与文件管理」** 标签页，提供对已有版本和文件的完整维护能力：

1. **移除版本（Delete Release）**：
   - 在所选模组的各个版本卡片右上角提供 `🗑️ 删除此版本` 操作。
   - 带有防误触二次确认弹窗；确认后自动更新发布清单，彻底移除该版本记录。

2. **移除版本内文件（Delete Release File）**：
   - 清晰列出版本内所有已发布文件的文件名、大小、SHA256 哈希及 R2 存储路径。
   - 每个文件右侧提供单独的 `移除文件` 按钮，支持精细化删减版本内多余或错误的文件。

3. **向已有版本追加新文件（Add File to Existing Release）**：
   - 每个版本卡片底部包含 `追加新文件` 交互区。
   - 支持选择本地任意文件（如新增构建 jar、补充资源包、补丁等，最大 10MB）。
   - 点击 `➕ 上传并加入版本` 后，后台自动完成：
     - 文件哈希计算（SHA256）；
     - 通过 Wrangler 将文件安全上传至 Cloudflare R2 存储桶；
     - 原子更新清单 `site/catalog.json`；
     - 界面即时刷新，显示新增的文件。

---

## 二、前台模组展示页与管理后台设计语言统一

此前模组前台页面保留了旧版紫色主题，现已全面重构并与后台管理界面完全统一：

1. **统一暗夜机能色彩系统（Dark Slate & Emerald）**：
   - 背景：深黑岩石底色（`--bg: #0b0d10`）与微青绿扩散径向光晕；
   - 面板：暗石墨装甲表面（`--surface: #14181d` / `--surface-raised: #1b2128`）；
   - 强调色：工业青翠绿（`--accent: #84e1bc`）与亮薄荷（`--accent-hover: #a3e8cc`）。
2. **彻底消灭圆角（0px Border-Radius）**：
   - 废除所有 `border-radius`，全部采用**方角与战术多边形切角（Angular & Polygonal Faceted Design）**；
   - 模组卡片、正方图标、下载按钮、搜索输入框、版本折叠卡片均采用切角与高对比度边框。

---

## 三、Cloudflare Pages 构建报错分析与已实施修复

### 1. 为什么此前 Cloudflare 构建失败？

您收到的构建日志：
```text
2026-09-13T14:31:03.964971Z HEAD is now at 138f94a 1 
...
2026-09-13T14:31:10.899465Z Executing user command: npm run build 
2026-09-13T14:31:11.311112Z npm error Missing script: "build" 
Failed: build command exited with code: 1
```

**根本原因**：
1. Cloudflare Pages 在构建时会自动执行您在后台填写的 Build command：`npm run build`。
2. 当 Cloudflare 在 `14:31` 克隆代码时，远程仓库当时处于旧提交 `138f94a`，该提交的 `package.json` 中尚未定义 `"build"` 脚本，因此 npm 抛出 `Missing script: "build"` 导致构建退出。
3. 随后本地添加了 `"build": "node scripts/sync-vendor.mjs"`，但尚未把最新提交推送到 GitHub。

### 2. 当前已解决

1. **`package.json` 已配置正确构建脚本**：
   ```json
   "scripts": {
     "build": "node scripts/sync-vendor.mjs",
     "vendor": "node scripts/sync-vendor.mjs",
     "postinstall": "node scripts/sync-vendor.mjs"
   }
   ```
2. **所有改动已推送到 GitHub `origin/master`**：
   - 最新的提交 `4963847` 已成功推送到 `https://github.com/hotpad100c/ModSite.git`；
   - Cloudflare Pages 检测到新的 push 后会自动触发最新构建；执行 `npm run build` 时将顺利复制依赖库到 `site/vendor/` 并完成网站发布；
---

## 四、前台与后台语言架构分工

根据要求，已完成清晰的语言分离架构：

1. **前台公开展示站点（`site/`）—— 全英文（Full English）**：
   - 页面语言标记：`<html lang="en">`；
   - 首页：标头、标题、模组数量统计（`1 mod` / `X mods`）、搜索提示（`Search by name, version, loader…`）、空状态与加载状态均为标准英文；
   - 模组详情页：横幅概览（`MOD OVERVIEW`）、作者信息（`By: AuthorName`）、外链（`Source ↗`）、详情排版（`Description`）、下载区（`Downloads`、`Download` 按钮、英文日期格式 `Sep 13, 2026` 等）；
   - 异常处理：所有前台运行时报错与网络加载失败提示均为英文。

2. **本地管理后台（`admin/`）—— 保持全中文（Full Chinese）**：
   - 保留直观友好的中文操作标签与指南（「单模组发布 / 资料编辑」、「⚡ 批量极速解析上传」、「📦 版本维护与文件管理」）；
   - 保留详细的中文指引、状态说明、删除确认弹窗与错误排查提示。

