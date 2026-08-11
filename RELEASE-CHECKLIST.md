# Rue.js v0.1.0 release checklist

Run these from the Rue.js repository root.

## 1. JavaScript syntax

```bash
node --check rue-i18n/rue-i18n.js
node --check rue-i18n/extract-i18n.js
node --check rue-i18n/bin/extract-i18n.js
node --check rue-carousel/rue-carousel.js
node --check rue-notes/rue-notes.js
```

Then syntax-check every Rue Notes helper:

```bash
for f in rue-notes/src/*.js; do node --check "$f"; done
```

On Windows PowerShell:

```powershell
Get-ChildItem rue-notes/src/*.js | ForEach-Object { node --check $_.FullName }
```

## 2. CLI

```bash
node rue-i18n/bin/extract-i18n.js --help
```

It should print help and exit without generating files.

## 3. Manual browser smoke test

Use a local HTTP server and verify:

- Rue i18n: language switching, fallback, input placeholder, persisted preference.
- Rue Carousel: JSON loads, items render, arrows/dots, previous/next, language change, empty data does not crash.
- Rue Notes: Markdown loads, title/summary/tags search, body search with `bodyText: true`, type/tag filters, Markdown lists, inline code, dotted slugs, language fallback, missing file graceful handling.
- Browser Console: no uncaught errors during the tested paths.

## 4. Repository hygiene

Confirm the zip/repository does not contain `.DS_Store`, `node_modules`, private development notes, credentials, API keys, unrelated website assets or temporary output files.
