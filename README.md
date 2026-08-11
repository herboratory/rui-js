# Rue.js

**Rue.js** is a small, framework-agnostic JavaScript toolkit for multilingual, content-driven static websites.

>**DEISGN FIRST.**

It is designed for people who want to keep ordinary HTML, CSS and JavaScript, but need a few structured capabilities that static pages often grow into: language switching, JSON-driven content displays, and Markdown-based newsrooms or notes.

> **Current release:** `v0.1.0`  
> **Status:** early public release. Suitable for personal projects, portfolio sites and controlled static-site use. The core modules have been manually reviewed and smoke-tested, but Rue.js is **not described as a production-hardened library** yet and does not currently ship a full automated regression test suite.

[繁體中文](./README.zh-Hant.md) · [简体中文](./README.zh-Hans.md)

## What is included?

Rue.js contains three independent modules. You may use one module without using the others.

| Module | What it does | Typical use |
|---|---|---|
| `rue-i18n` | Replaces marked DOM text when the language changes; includes fallback language support and an optional translation-key extractor | Multilingual navigation, labels, buttons and interface text |
| `rue-carousel` | Renders JSON data as a carousel and resolves multilingual fields | Project lists, product cards, featured content |
| `rue-notes` | Loads Markdown content and provides list/detail rendering, search, filtering, pagination, routing, catalogue helpers and language fallback | Newsrooms, release notes, changelogs, small blogs |

## Do I need Node.js or a framework?

No framework is required.

For ordinary browser use you can copy the files into your site and load them with `<script>` tags. You only need Node.js if you want to use the optional `rue-i18n` command-line extraction tool, or if you later decide to publish/install the modules as npm packages.

## Important: use a local web server when JSON or Markdown is fetched

If your page uses `fetch()` to load a JSON file or Rue Notes loads a Markdown file, do **not** double-click `index.html` and open it as a `file://` URL. Browsers commonly block local file requests for security reasons.

The simplest development server is Python's built-in server:

```bash
cd /path/to/your-site
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

If `python3` is not available on your computer, any ordinary static web server is fine.

## Start here if you have never used a JavaScript library before

Read **[GETTING-STARTED.md](./GETTING-STARTED.md)**. It explains:

1. what files to copy;
2. where to place the `<script>` and `<link>` tags;
3. how to run a local server;
4. how to create your first translation;
5. how to load JSON into Rue Carousel;
6. how to create Markdown content for Rue Notes;
7. how the three modules can share the same language selection;
8. common errors and how to diagnose them.

## Minimum examples

### Rue i18n

```html
<h1 data-i18n="home.title">Hello</h1>
<button id="language-zh">繁體中文</button>

<script src="./rue-i18n/rue-i18n.js"></script>
<script>
  const i18n = new RueI18n({
    defaultLang: 'en',
    fallbackLang: 'en'
  });

  i18n.addTranslations('en', {
    'home.title': 'Hello'
  });

  i18n.addTranslations('zh-Hant', {
    'home.title': '你好'
  });

  i18n.updateDOM();

  document.getElementById('language-zh').addEventListener('click', () => {
    document.documentElement.lang = 'zh-Hant';
    i18n.setLanguage('zh-Hant');
  });
</script>
```

### Rue Carousel

```html
<link rel="stylesheet" href="./rue-carousel/rue-carousel.css">
<div id="projects"></div>
<script src="./rue-carousel/rue-carousel.js"></script>
<script>
fetch('./rue-carousel/examples/projects.json')
  .then(response => response.json())
  .then(data => {
    new RueCarousel({
      container: '#projects',
      data,
      lang: 'en'
    });
  });
</script>
```

### Rue Notes

Rue Notes has optional helper modules. For the complete feature set, load the helper files **before** `rue-notes.js`:

```html
<link rel="stylesheet" href="./rue-notes/rue-notes.css">

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

Then create a container and initialise it:

```html
<div id="notes"></div>
<script>
const notes = new RueNotes({
  container: '#notes',
  contentPath: './content/',
  lang: 'en',
  entries: [
    {
      slug: 'first-post',
      lang: 'en',
      title: 'First post',
      date: '2026-08-11',
      type: 'release',
      summary: 'A small example post.'
    }
  ]
});

notes.render();
</script>
```

Create the matching file:

```text
content/first-post.en.md
```

See the module documentation for complete options.

## Repository layout

```text
Rue.js/
├── README.md
├── README.zh-Hant.md
├── README.zh-Hans.md
├── GETTING-STARTED.md
├── GETTING-STARTED.zh-Hant.md
├── GETTING-STARTED.zh-Hans.md
├── LICENSE
├── CHANGELOG.md
├── rue-i18n/
├── rue-carousel/
└── rue-notes/
```

## Versioning

The first public Rue.js repository release is `v0.1.0`. The three modules are aligned to `0.1.0` for this release so the repository has one understandable starting point.

Future releases will use semantic versioning where practical:

- patch: bug fixes that do not intentionally change the public API;
- minor: backwards-compatible features;
- major: intentional breaking API changes.

## npm and CDN status

The repository contains `package.json` files so the modules are prepared for package distribution, but this README does **not** assume that they have already been published to npm. Until a package is actually published, use the files directly from this repository or from your own deployment.

## Licence

MIT. See [LICENSE](./LICENSE).
