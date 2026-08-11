# Rue Notes

Rue Notes is the Markdown publishing module in Rue.js. It is intended for small blogs, newsrooms, release notes and changelogs that should remain mostly static and framework-free.

[繁體中文](./README.zh-Hant.md) · [简体中文](./README.zh-Hans.md)

## Important mental model

The `entries` array is the list/index metadata. The Markdown file is the body that `loadEntry(slug)` loads. In other words, Rue Notes does not magically discover every Markdown file in a folder in the browser; your page supplies the list of entries and Rue Notes resolves the matching content file.

## Full browser loading order

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

## Naming Markdown files

For a multilingual entry with slug `release-1`:

```text
release-1.en.md
release-1.zh-Hant.md
release-1.zh-Hans.md
```

A single-language fallback file may be named:

```text
release-1.md
```

Slugs may contain dots; locale resolution removes only the final language suffix rather than truncating the slug at its first dot.

## Minimal initialisation

```js
const notes = new RueNotes({
  container: '#notes',
  contentPath: './content/',
  lang: 'en',
  fallback: ['en', 'zh-Hant', 'zh-Hans'],
  entries: [{
    slug: 'release-1',
    lang: 'en',
    title: 'Release 1',
    date: '2026-08-11',
    type: 'release',
    summary: 'Release summary.',
    tags: ['release']
  }],
  routing: { enabled: false },
  search: { enabled: true, fields: ['title', 'summary', 'tags'], bodyText: true },
  filters: { type: true, tag: true, category: false },
  pagination: { enabled: false, perPage: 10 },
  prevNext: false,
  catalogue: { enabled: false, nested: false },
  seo: { enabled: true },
  markdown: { extended: true },
  syntaxHighlight: { enabled: true },
  showDrafts: false
});

notes.render();
```

### Search configuration detail

`fields` controls metadata fields. To search Markdown/body content, set `bodyText: true`. Merely putting `'content'` in `fields` is not a substitute for `bodyText: true`.

## Markdown frontmatter example

```markdown
---
title: "Release 1"
date: "2026-08-11"
type: "release"
summary: "Release summary."
tags: [release, product]
draft: false
---

# Release 1

Body text.
```

The parser supports inline arrays and common indented YAML-style list arrays. It is intentionally lightweight rather than a complete YAML implementation.

## Custom accordion/newsroom UI

Rue Notes' default UI is not mandatory. A site can use Rue Notes for loading/search/filter state while rendering its own `<details><summary>...</summary>...</details>` accordion. This is useful when you want entries collapsed by default and expanded in place rather than navigating to a separate detail page.

## Security note

The Markdown renderer includes lightweight sanitisation, but it is designed primarily for trusted site-owned Markdown. Do not describe it as a complete untrusted-HTML security boundary. For hostile/untrusted content, use a dedicated, audited HTML sanitiser and an appropriate Content Security Policy.

## Examples

See [examples/](./examples/) for sample Markdown content and a browser demo.
