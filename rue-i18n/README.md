# Rue i18n

Rue i18n is the internationalisation module in Rue.js. It is a plain JavaScript class: load one script, mark HTML elements with `data-i18n`, add translations, then call `setLanguage()`.

[繁體中文](./README.zh-Hant.md) · [简体中文](./README.zh-Hans.md)

## Browser setup

```html
<script src="./rue-i18n.js"></script>
```

The script creates `window.RueI18n`.

## First working example

```html
<h1 data-i18n="page.title">Hello</h1>
<input data-i18n="search.placeholder" placeholder="Search">

<script src="./rue-i18n.js"></script>
<script>
const i18n = new RueI18n({
  defaultLang: 'en',
  fallbackLang: 'en',
  storageKey: 'site_language',
  autoSave: true
});

i18n.addTranslations('en', {
  'page.title': 'Hello',
  'search.placeholder': 'Search'
});

i18n.addTranslations('zh-Hant', {
  'page.title': '你好',
  'search.placeholder': '搜尋'
});

i18n.updateDOM();
</script>
```

For ordinary elements, Rue writes the translation to `innerHTML`. For `INPUT` and `TEXTAREA`, it writes the translation to `placeholder`.

## Main methods

- `addTranslations(lang, object)` — add or merge translations for one language.
- `addLanguagePack(pack)` — add several language dictionaries at once.
- `t(key, lang?)` — return a translated value; falls back to `fallbackLang`, then the key itself.
- `setLanguage(lang, updateDOM = true)` — set the current language and normally refresh marked DOM.
- `updateDOM()` — manually refresh every `[data-i18n]` element.
- `getCurrentLanguage()` — return the current language code.
- `getAvailableLanguages()` — list languages that have been added.
- `hasLanguage(lang)` — check whether a language dictionary exists.
- `detectBrowserLanguage()` — choose an available language from the browser preference.
- `autoInit()` — use saved/browser language and update the DOM.
- `on('languageChanged', handler)` — listen for language changes.

## localStorage behaviour

When `autoSave` is true, the current language is stored under `storageKey`. Storage access is wrapped safely: if a browser blocks localStorage, Rue i18n continues without persistence rather than crashing.

## Optional translation-key extractor

Node.js is required for this tool.

Show help:

```bash
node bin/extract-i18n.js --help
```

Scan a site:

```bash
node bin/extract-i18n.js /path/to/site \
  --output /path/to/site/locales \
  --languages en,zh-Hant,zh-Hans \
  --default-lang en
```

The public package executable is named `rue-i18n-extract` if/when the package is installed through npm. The repository does not assume npm publication has already happened.
