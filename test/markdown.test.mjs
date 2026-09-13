import test from "node:test";
import assert from "node:assert/strict";
import { parseMarkdownToHtml, renderMarkdown } from "../site/markdown.js";

test("解析常用 Markdown 区块与行内样式", () => {
  const html = parseMarkdownToHtml("# 标题\n\n> 引言\n\n- 一\n- 二\n\n正文包含 **粗体** 和 `行内代码`");
  assert.match(html, /<h1>标题<\/h1>/);
  assert.match(html, /<blockquote>[\s\S]*?<p>引言<\/p>[\s\S]*?<\/blockquote>/);
  assert.match(html, /<ul>[\s\S]*?<li>一<\/li>[\s\S]*?<li>二<\/li>[\s\S]*?<\/ul>/);
  assert.match(html, /<strong>粗体<\/strong>/);
  assert.match(html, /<code>行内代码<\/code>/);
});

test("正确解析引用块内的标题与多级嵌套引用", () => {
  const html = parseMarkdownToHtml("># 引用标题\n>\n>> 嵌套二级引用");
  assert.match(html, /<blockquote>[\s\S]*?<h1>引用标题<\/h1>[\s\S]*?<blockquote>[\s\S]*?<p>嵌套二级引用<\/p>[\s\S]*?<\/blockquote>[\s\S]*?<\/blockquote>/);
});

test("链接附加安全属性且图片支持懒加载", () => {
  const html = parseMarkdownToHtml("[外链测试](https://example.com) 和 ![预览图](https://example.com/demo.png)");
  assert.match(html, /<a href="https:\/\/example\.com\/" target="_blank" rel="noopener noreferrer">外链测试<\/a>/);
  assert.match(html, /<img src="https:\/\/example\.com\/demo\.png" alt="预览图" loading="lazy">/);
});

test("支持代码块、删除线与表格", () => {
  const md = [
    "```js",
    "console.log('hello');",
    "```",
    "",
    "~~已废弃功能~~",
    "",
    "| 模组 | 版本 |",
    "| --- | --- |",
    "| Lucidity | 2.0.2 |"
  ].join("\n");
  const html = parseMarkdownToHtml(md);
  assert.match(html, /<pre><code class="language-js">console\.log\((?:'|&#39;)hello(?:'|&#39;)\);?\n?<\/code><\/pre>/);
  assert.match(html, /<del>已废弃功能<\/del>/);
  assert.match(html, /<table>[\s\S]*?<th>模组<\/th>[\s\S]*?<td>Lucidity<\/td>[\s\S]*?<\/table>/);
});

test("空列表项容错不会让解析崩溃", () => {
  const html = parseMarkdownToHtml("- \n\n下一段");
  assert.match(html, /<ul>[\s\S]*?<li><\/li>[\s\S]*?<\/ul>/);
  assert.match(html, /<p>下一段<\/p>/);
});

test("renderMarkdown 函数返回结果", () => {
  const result = renderMarkdown("# 测试");
  assert.ok(result);
});
