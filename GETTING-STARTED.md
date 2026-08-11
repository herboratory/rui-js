# Rue.js: beginner step-by-step guide

This guide assumes you have **never used a JavaScript library before**. You do not need React, Vue, a bundler, npm or a build system for the browser examples below.

## 1. Create a test folder

Create an empty folder anywhere on your computer. For example:

```text
my-rue-test/
```

Copy these three folders from Rue.js into it:

```text
my-rue-test/
├── rue-i18n/
├── rue-carousel/
├── rue-notes/
└── index.html
```

Create `index.html` if it does not exist yet.

## 2. Start a local server

This is required once you start loading JSON or Markdown files with `fetch()`.

Open Terminal, Command Prompt, or your editor's terminal. Change into the folder:

```bash
cd /path/to/my-rue-test
```

Start Python's static server:

```bash
python3 -m http.server 8000
```

Leave that terminal window running. Open your browser at:

```text
http://localhost:8000/
```

If the page does not load, check that the terminal says it is serving port 8000 and that `index.html` is in the same folder from which you started the server.

## 3. Add Rue i18n

Put this inside `<body>` in `index.html`:

```html
<h1 data-i18n="home.title">Hello</h1>
<p data-i18n="home.intro">This is my first Rue.js page.</p>

<button id="lang-en">English</button>
<button id="lang-zh">繁體中文</button>

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

i18n.addTranslations('zh-Hant', {
  'home.title': '你好',
  'home.intro': '這是我的第一個 Rue.js 頁面。'
});

i18n.updateDOM();

document.getElementById('lang-en').addEventListener('click', () => {
  document.documentElement.lang = 'en';
  i18n.setLanguage('en');
});

document.getElementById('lang-zh').addEventListener('click', () => {
  document.documentElement.lang = 'zh-Hant';
  i18n.setLanguage('zh-Hant');
});
</script>
```

Refresh the browser. Click the two language buttons. The heading and paragraph should change.

### What is `data-i18n`?

It is an ordinary custom HTML attribute. Rue i18n looks for elements carrying it. The value, such as `home.title`, is a key used to look up the translated text.

## 4. Add Rue Carousel

Add these inside `<head>`:

```html
<link rel="stylesheet" href="./rue-carousel/rue-carousel.css">
```

Add this before the closing `</body>` tag, after Rue i18n if both are used:

```html
<script src="./rue-carousel/rue-carousel.js"></script>
```

Add a container where you want the carousel to appear:

```html
<div id="projects"></div>
```

Now load the included example JSON:

```html
<script>
let projectsCarousel;

fetch('./rue-carousel/examples/projects.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Could not load projects.json: HTTP ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    projectsCarousel = new RueCarousel({
      container: '#projects',
      data,
      lang: document.documentElement.lang || 'en',
      showArrows: true,
      showDots: true,
      loop: true,
      keyboard: true
    });
  })
  .catch(error => console.error(error));
</script>
```

If you see an empty area, open Developer Tools → Console. If the JSON cannot be loaded, first confirm you are using `http://localhost:8000/`, not `file://`.

### Your JSON format

The outer object needs an `items` array:

```json
{
  "items": [
    {
      "id": "example",
      "title": {
        "en": "Example",
        "zh-Hant": "範例"
      },
      "summary": {
        "en": "An example item.",
        "zh-Hant": "一個範例項目。"
      }
    }
  ]
}
```

A field may also be an ordinary string if it does not need translation.

## 5. Add Rue Notes

Rue Notes can work in a reduced mode, but its full feature set is split into helper files so features can fail gracefully when omitted. Beginners should use the complete loading order first.

Add the stylesheet to `<head>`:

```html
<link rel="stylesheet" href="./rue-notes/rue-notes.css">
```

Add these scripts, in this order, before your own initialisation script:

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

Create a content folder:

```text
my-rue-test/
└── content/
    └── hello.en.md
```

Put this inside `hello.en.md`:

```markdown
---
title: "Hello from Rue Notes"
date: "2026-08-11"
type: "release"
summary: "My first Markdown entry."
tags: [demo, rue]
---

# Hello from Rue Notes

This text comes from a Markdown file.

## A second heading

- one item
- another item
```

Add a container to your HTML:

```html
<div id="notes"></div>
```

Initialise Rue Notes:

```html
<script>
const notes = new RueNotes({
  container: '#notes',
  contentPath: './content/',
  lang: 'en',
  entries: [
    {
      slug: 'hello',
      lang: 'en',
      title: 'Hello from Rue Notes',
      date: '2026-08-11',
      type: 'release',
      summary: 'My first Markdown entry.',
      tags: ['demo', 'rue']
    }
  ],
  routing: { enabled: false },
  search: { enabled: true, fields: ['title', 'summary', 'tags'], bodyText: true },
  filters: { type: true, tag: true },
  pagination: { enabled: false },
  markdown: { extended: true },
  syntaxHighlight: { enabled: true }
});

notes.render();
</script>
```

Rue Notes uses the `slug` and language to look for a Markdown file such as `hello.en.md`. For multilingual entries, keep the same slug and create files such as `hello.zh-Hant.md` and `hello.zh-Hans.md`.

## 6. Keep all three modules on the same language

When a visitor changes the language, update each module that exists:

```js
function setSiteLanguage(lang) {
  document.documentElement.lang = lang;

  i18n.setLanguage(lang);

  if (projectsCarousel) {
    projectsCarousel.setLanguage(lang);
  }

  if (notes) {
    notes.setLanguage(lang);
  }
}
```

That function becomes the one place your language buttons call.

## 7. Optional: extract translation keys from your files

This step requires Node.js.

Open a terminal inside `rue-i18n` and run:

```bash
node bin/extract-i18n.js --help
```

To scan your website directory:

```bash
node ./rue-i18n/bin/extract-i18n.js . --output ./locales --languages en,zh-Hant,zh-Hans --default-lang en
```

The extractor scans supported source files for translation keys and creates JSON translation templates.

## 8. Common problems

### `fetch()` fails or Markdown says not found

Check the Network tab. Confirm the requested URL is correct and that you are using an HTTP server rather than `file://`.

### `RueCarousel is not defined`

The `<script src="...rue-carousel.js">` tag is missing, has the wrong path, or appears after the script that tries to create the carousel.

### `MarkdownRenderer not loaded`

You enabled Rue Notes features but did not load the helper file before `rue-notes.js`. Use the loading order shown above.

### The page stops running after one JavaScript error

Fix the **first** red error in the Console first. A syntax error early in a `<script>` block can prevent every function below it from being created, which causes many misleading follow-on errors.

## 9. Before deploying your site

Check all three languages, open every JSON/Markdown URL directly in the browser, verify the Console has no uncaught errors, test mobile interaction, and verify that every link points to a real destination.
