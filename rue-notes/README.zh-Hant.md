# Rue Notes

Rue Notes 是 Rue.js 的 Markdown 發佈 module，適合小型 blog、Newsroom、release notes 和 changelog。

## 最重要的概念

`entries` array 是列表用的 metadata；Markdown 檔是正文。Rue Notes 在瀏覽器裡不會自動掃描資料夾找出所有 Markdown，所以你的網站需要先提供 entries，之後 `loadEntry(slug)` 再找對應的 Markdown。

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

## 多語言檔名

```text
release-1.en.md
release-1.zh-Hant.md
release-1.zh-Hans.md
```

單語言 fallback 可以用 `release-1.md`。slug 可以包含 `.`；目前 locale 解析不會再錯誤地從第一個 dot 截斷 slug。

## 搜尋的重要設定

```js
search: {
  enabled: true,
  fields: ['title', 'summary', 'tags'],
  bodyText: true
}
```

`bodyText: true` 才代表搜尋正文。只在 `fields` 寫 `'content'` 並不能取代它。

## Accordion Newsroom

你不一定要用 Rue Notes 的 default detail UI。如果想讓文章預設縮起，訪客按 `<summary>` 才在原位展開，可以自己 render `<details>` accordion，同時仍用 Rue Notes 的 Markdown loading、search/filter 和 locale fallback。

## 安全限制

Markdown renderer 的 sanitisation 是輕量級的，主要假設文章是網站自己可信任的內容。若內容來自不可信第三方，請另外使用成熟 HTML sanitizer 與 CSP，不要把內建 sanitisation 當完整安全邊界。
