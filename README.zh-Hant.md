# Rue.js

**Rue.js** 是一套輕量、無框架依賴的 JavaScript 工具組，目標是讓一般的靜態 HTML 網站可以逐步加入多語言、JSON 內容展示和 Markdown 發佈能力，而不用因此導入大型前端框架。

> **目前版本：** `v0.1.0`  
> **狀態：** 第一個公開版本。適合個人專案、作品集網站與可控的靜態網站使用。核心功能已做人工檢查與 smoke test，但目前**不宣稱為 production-hardened library**，亦尚未提供完整 automated regression test suite。

[English](./README.md) · [简体中文](./README.zh-Hans.md)

## Rue.js 包含甚麼？

三個模組互相獨立。你只需要其中一個功能時，可以只載入其中一個。

| 模組 | 功能 | 常見用途 |
|---|---|---|
| `rue-i18n` | 切換語言並更新帶 `data-i18n` 的 DOM；支援 fallback 與可選的翻譯 key 提取 CLI | 導覽列、按鈕、標籤、介面文字 |
| `rue-carousel` | 從 JSON 渲染內容，並解析多語言欄位 | Projects、產品卡、精選內容 |
| `rue-notes` | 載入 Markdown；支援列表/詳細內容、搜尋、篩選、分頁、routing、catalogue 與語言 fallback | Newsroom、release notes、changelog、小型 blog |

## 我需要 Node.js 或 React/Vue 嗎？

不需要任何前端框架。

一般瀏覽器用法只要把檔案複製到你的網站，再用 `<script>` / `<link>` 載入即可。只有在你要使用 `rue-i18n` 的命令列提取工具時才需要 Node.js。

## 很重要：會 fetch JSON / Markdown 時請用 local server

如果網站會用 `fetch()` 讀 JSON，或者 Rue Notes 要讀 Markdown，請不要直接雙擊 `index.html` 用 `file://` 開啟。瀏覽器可能因安全限制阻止本地檔案請求。

最簡單的方法：

```bash
cd /你的/網站/資料夾
python3 -m http.server 8000
```

再到瀏覽器開：

```text
http://localhost:8000/
```

## 完全沒有背景，從哪裡開始？

請直接讀 **[GETTING-STARTED.zh-Hant.md](./GETTING-STARTED.zh-Hant.md)**。文件會逐步說明：

1. 哪些檔案要複製；
2. HTML 的 `<script>` 要放哪裡；
3. 如何啟動 local server；
4. 如何建立第一組翻譯；
5. 如何建立 JSON 並交給 Rue Carousel；
6. 如何建立 Markdown 並交給 Rue Notes；
7. 三個模組如何共用同一個語言切換器；
8. 出錯時應該先看甚麼。

## 最小範例：Rue i18n

```html
<h1 data-i18n="home.title">Hello</h1>
<button id="language-zh">繁體中文</button>

<script src="./rue-i18n/rue-i18n.js"></script>
<script>
const i18n = new RueI18n({ defaultLang: 'en', fallbackLang: 'en' });

i18n.addTranslations('en', { 'home.title': 'Hello' });
i18n.addTranslations('zh-Hant', { 'home.title': '你好' });
i18n.updateDOM();

document.getElementById('language-zh').addEventListener('click', () => {
  document.documentElement.lang = 'zh-Hant';
  i18n.setLanguage('zh-Hant');
});
</script>
```

## 最小範例：Rue Carousel

```html
<link rel="stylesheet" href="./rue-carousel/rue-carousel.css">
<div id="projects"></div>
<script src="./rue-carousel/rue-carousel.js"></script>
<script>
fetch('./rue-carousel/examples/projects.json')
  .then(r => r.json())
  .then(data => new RueCarousel({ container: '#projects', data, lang: 'zh-Hant' }));
</script>
```

## 最小範例：Rue Notes

Rue Notes 的搜尋、routing、Markdown renderer 等功能分拆成 helper files。要完整功能，請先載入 `rue-notes/src/` 內的 helper，再載入 `rue-notes.js`。完整順序與範例請看 [Rue Notes 文件](./rue-notes/README.zh-Hant.md)。

## 版本

Rue.js 第一次公開 repo release 統一為 `v0.1.0`，三個 module 的 `package.json` 亦統一為 `0.1.0`，避免第一版出現 `1.0.1 / 0.2.1` 這類難理解的版本差異。

## npm / CDN 狀態

repo 已保留 `package.json`，方便日後 npm 發佈；但本文件**不假設套件已經在 npm 上線**。在真正 publish 前，請直接使用 repository 裡的檔案或由你自己的網站部署。

## License

MIT，見 [LICENSE](./LICENSE)。
