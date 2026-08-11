# Rue.js：零背景逐步入门

這份文件假設你從來沒有用過 JavaScript library。你**不需要 React、Vue、npm、bundler 或 build system** 才能使用下面的瀏覽器版本。

## 1. 建一個测试試文件夹

创建：

```text
my-rue-test/
```

把 Rue.js 的三個 module folder 複製進去，再创建 `index.html`：

```text
my-rue-test/
├── rue-i18n/
├── rue-carousel/
├── rue-notes/
└── index.html
```

## 2. 啟動 local server

只要你要 fetch JSON 或 Markdown，就應該用 local server，而不是直接雙擊 HTML。

Terminal 裡：

```bash
cd /你的/my-rue-test/路徑
python3 -m http.server 8000
```

不要關掉這個 Terminal。瀏覽器開：

```text
http://localhost:8000/
```

## 3. 加入 Rue i18n

在 `<body>` 裡加入：

```html
<h1 data-i18n="home.title">Hello</h1>
<p data-i18n="home.intro">This is my first Rue.js page.</p>
<button id="lang-en">English</button>
<button id="lang-zh">简体中文</button>

<script src="./rue-i18n/rue-i18n.js"></script>
<script>
const i18n = new RueI18n({
  defaultLang: 'en',
  fallbackLang: 'en',
  storageKey: 'my_site_language'
});

i18n.addTranslations('en', {
  'home.title': 'Hello',
  'home.intro': 'This is my first Rue.js page.'
});

i18n.addTranslations('zh-Hans', {
  'home.title': '你好',
  'home.intro': '这是我的第一个 Rue.js 頁面。'
});

i18n.updateDOM();

document.getElementById('lang-en').addEventListener('click', () => {
  document.documentElement.lang = 'en';
  i18n.setLanguage('en');
});

document.getElementById('lang-zh').addEventListener('click', () => {
  document.documentElement.lang = 'zh-Hans';
  i18n.setLanguage('zh-Hans');
});
</script>
```

`data-i18n="home.title"` 的意思是：這個元素的文字由 `home.title` 這個翻译 key 管理。

## 4. 加入 Rue Carousel

`<head>` 加：

```html
<link rel="stylesheet" href="./rue-carousel/rue-carousel.css">
```

`<body>` 裡放容器：

```html
<div id="projects"></div>
```

並在自己的初始化程式碼之前加载：

```html
<script src="./rue-carousel/rue-carousel.js"></script>
```

读取 JSON：

```html
<script>
let projectsCarousel;

fetch('./rue-carousel/examples/projects.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    projectsCarousel = new RueCarousel({
      container: '#projects',
      data,
      lang: document.documentElement.lang || 'en',
      showArrows: true,
      showDots: true,
      loop: true
    });
  })
  .catch(error => console.error(error));
</script>
```

如果 Console 已經看到 JSON 成功加载，但页面仍然空白，下一步應該看**第一個紅色 JavaScript error**，而不是繼續懷疑 fetch。

JSON 最外層格式：

```json
{
  "items": [
    {
      "id": "example",
      "title": { "en": "Example", "zh-Hant": "範例" },
      "summary": { "en": "An example item.", "zh-Hant": "一個範例項目。" }
    }
  ]
}
```

不需要翻译的字段可以直接寫普通字符串。

## 5. 加入 Rue Notes

先在 `<head>`：

```html
<link rel="stylesheet" href="./rue-notes/rue-notes.css">
```

完整功能的 script 加载順序：

```html
<script src="./rue-notes/src/MarkdownRenderer.js"></script>
<script src="./rue-notes/src/SyntaxHighlighter.js"></script>
<script src="./rue-notes/src/SearchEngine.js"></script>
<script src="./rue-notes/src/FilterManager.js"></script>
<script src="./rue-notes/src/PaginationManager.js"></script>
<script src="./rue-notes/src/PrevNextNavigator.js"></script>
<script src="./rue-notes/src/Router.js"></script>
<script src="./rue-notes/src/SEOManager.js"></script>
<script src="./rue-notes/src/ContentSchema.js"></script>
<script src="./rue-notes/src/CatalogueManager.js"></script>
<script src="./rue-notes/rue-notes.js"></script>
```

创建：

```text
content/hello.en.md
```

內容：

```markdown
---
title: "Hello from Rue Notes"
date: "2026-08-11"
type: "release"
summary: "My first Markdown entry."
tags: [demo, rue]
---

# Hello

正文从 Markdown 檔读取。
```

HTML 加：

```html
<div id="notes"></div>
```

初始化：

```html
<script>
const notes = new RueNotes({
  container: '#notes',
  contentPath: './content/',
  lang: 'en',
  entries: [{
    slug: 'hello',
    lang: 'en',
    title: 'Hello from Rue Notes',
    date: '2026-08-11',
    type: 'release',
    summary: 'My first Markdown entry.',
    tags: ['demo', 'rue']
  }],
  search: { enabled: true, fields: ['title', 'summary', 'tags'], bodyText: true },
  filters: { type: true, tag: true },
  routing: { enabled: false },
  pagination: { enabled: false }
});
notes.render();
</script>
```

多语言文章保持同一 slug，例如：

```text
hello.en.md
hello.zh-Hans.md
hello.zh-Hans.md
```

## 6. 三個 module 共用一個语言切换

```js
function setSiteLanguage(lang) {
  document.documentElement.lang = lang;
  i18n.setLanguage(lang);
  if (projectsCarousel) projectsCarousel.setLanguage(lang);
  if (notes) notes.setLanguage(lang);
}
```

所有語言按鈕只需要呼叫這個 function。

## 7. 可選：用 CLI 自動找翻译 key

需要 Node.js：

```bash
node ./rue-i18n/bin/extract-i18n.js --help
```

掃描網站：

```bash
node ./rue-i18n/bin/extract-i18n.js . --output ./locales --languages en,zh-Hant,zh-Hans --default-lang en
```

## 8. 最常見的错误

- **Markdown/JSON not found**：先看 Network requested URL 是否真的存在。
- **`RueCarousel is not defined`**：script path 錯，或初始化寫在 library script 前面。
- **某個 Rue Notes helper not loaded**：照上面的 script 順序加载。
- **一次出現很多 ReferenceError**：先修 Console 最上面第一個 syntax error；前面的 script 一旦中斷，後面 functions 全部都不會创建。
- **`file://` CORS**：改用 local server。

## 9. Deploy 前人工驗收

至少测试 EN／繁／简、JSON、每篇 Markdown、search、filter、所有链接、mobile，並確認 Console 沒有 uncaught error。
