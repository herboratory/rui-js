# Rue.js

**Rue.js** 是一套轻量、无框架依赖的 JavaScript 工具集，让普通静态 HTML 网站可以逐步加入多语言、JSON 内容展示和 Markdown 发布能力，而不必因此引入大型前端框架。

> **当前版本：** `v0.1.0`  
> **状态：** 第一个公开版本。适合个人项目、作品集网站和可控的静态网站使用。核心功能已进行人工检查和 smoke test，但目前**不宣称为 production-hardened library**，也尚未提供完整 automated regression test suite。

[English](./README.md) · [繁體中文](./README.zh-Hant.md)

## Rue.js 包含什么？

三个模块互相独立。只需要一个功能时，可以只加载对应模块。

| 模块 | 功能 | 常见用途 |
|---|---|---|
| `rue-i18n` | 切换语言并更新带 `data-i18n` 的 DOM；支持 fallback 和可选的翻译 key 提取 CLI | 导航、按钮、标签、界面文字 |
| `rue-carousel` | 从 JSON 渲染内容，并解析多语言字段 | Projects、产品卡、精选内容 |
| `rue-notes` | 加载 Markdown；支持列表/详情、搜索、筛选、分页、routing、catalogue 和语言 fallback | Newsroom、release notes、changelog、小型 blog |

## 我需要 Node.js 或 React/Vue 吗？

不需要任何前端框架。

普通浏览器用法只需把文件复制到网站，再用 `<script>` / `<link>` 加载。只有使用 `rue-i18n` 命令行提取工具时才需要 Node.js。

## 很重要：fetch JSON / Markdown 时请使用 local server

如果网站会用 `fetch()` 读取 JSON，或者 Rue Notes 要读取 Markdown，请不要直接双击 `index.html` 用 `file://` 打开。浏览器可能因为安全限制阻止本地文件请求。

最简单的方法：

```bash
cd /你的/网站/文件夹
python3 -m http.server 8000
```

然后在浏览器打开：

```text
http://localhost:8000/
```

## 完全没有背景，从哪里开始？

请直接阅读 **[GETTING-STARTED.zh-Hans.md](./GETTING-STARTED.zh-Hans.md)**。文件会一步一步说明文件结构、script 放置位置、local server、i18n、JSON carousel、Markdown notes、语言同步和常见报错。

## 最小示例：Rue i18n

```html
<h1 data-i18n="home.title">Hello</h1>
<script src="./rue-i18n/rue-i18n.js"></script>
<script>
const i18n = new RueI18n({ defaultLang: 'en', fallbackLang: 'en' });
i18n.addTranslations('en', { 'home.title': 'Hello' });
i18n.addTranslations('zh-Hans', { 'home.title': '你好' });
i18n.updateDOM();
</script>
```

## 最小示例：Rue Carousel

```html
<link rel="stylesheet" href="./rue-carousel/rue-carousel.css">
<div id="projects"></div>
<script src="./rue-carousel/rue-carousel.js"></script>
<script>
fetch('./rue-carousel/examples/projects.json')
  .then(r => r.json())
  .then(data => new RueCarousel({ container: '#projects', data, lang: 'zh-Hans' }));
</script>
```

## Rue Notes

要启用 Rue Notes 的完整搜索、routing、Markdown renderer 等功能，请先加载 `rue-notes/src/` 内的 helper files，再加载 `rue-notes.js`。完整顺序见 [Rue Notes 文档](./rue-notes/README.zh-Hans.md)。

## 版本

Rue.js 第一次公开 repo release 统一为 `v0.1.0`；三个模块的 `package.json` 也统一为 `0.1.0`。

## npm / CDN 状态

repo 已保留 `package.json` 方便日后 npm 发布，但本文档**不假设套件已经发布到 npm**。正式 publish 前，请直接使用 repository 文件或由你自己的网站部署。

## License

MIT，见 [LICENSE](./LICENSE)。
