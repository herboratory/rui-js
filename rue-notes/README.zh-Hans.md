# Rue Notes

Rue Notes 是 Rue.js 的 Markdown 发布 module，適合小型 blog、Newsroom、release notes 和 changelog。

## 最重要的概念

`entries` array 是列表用的 metadata；Markdown 檔是正文。Rue Notes 在浏览器裡不會自動扫描文件夹找出所有 Markdown，所以你的网站需要先提供 entries，之後 `loadEntry(slug)` 再找对应的 Markdown。

## 完整 script 載入順序

```html
<link rel="stylesheet" href="./rue-notes.css">
<script src="./src/MarkdownRenderer.js"></script>
<script src="./src/SyntaxHighlighter.js"></script>
<script src="./src/SearchEngine.js"></script>
<script src="./src/FilterManager.js"></script>
<script src="./src/PaginationManager.js"></script>
<script src="./src/PrevNextNavigator.js"></script>
<script src="./src/Router.js"></script>
<script src="./src/SEOManager.js"></script>
<script src="./src/ContentSchema.js"></script>
<script src="./src/CatalogueManager.js"></script>
<script src="./rue-notes.js"></script>
```

## 多语言文件名

```text
release-1.en.md
release-1.zh-Hant.md
release-1.zh-Hans.md
```

单语言 fallback 可以用 `release-1.md`。slug 可以包含 `.`；目前 locale 解析不會再错误地從第一個 dot 截斷 slug。

## 搜索的重要設定

```js
search: {
  enabled: true,
  fields: ['title', 'summary', 'tags'],
  bodyText: true
}
```

`bodyText: true` 才代表搜索正文。只在 `fields` 寫 `'content'` 並不能取代它。

## Accordion Newsroom

你不一定要用 Rue Notes 的 default detail UI。如果想讓文章默认收起，访客按 `<summary>` 才在原位展开，可以自己 render `<details>` accordion，同时仍用 Rue Notes 的 Markdown loading、search/filter 和 locale fallback。

## 安全限制

Markdown renderer 的 sanitisation 是輕量級的，主要假設文章是网站自己可信的内容。若内容來自不可信第三方，请另外使用成熟 HTML sanitizer 與 CSP，不要把內建 sanitisation 当作完整安全边界。
