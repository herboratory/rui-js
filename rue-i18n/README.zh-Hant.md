# Rue i18n

Rue i18n 是 Rue.js 的多語言介面 module。它不需要框架：載入 `rue-i18n.js`、在 HTML 元素加 `data-i18n`、加入翻譯字典，再呼叫 `setLanguage()` 即可。

```html
<h1 data-i18n="page.title">Hello</h1>
<script src="./rue-i18n.js"></script>
<script>
const i18n = new RueI18n({ defaultLang: 'en', fallbackLang: 'en' });
i18n.addTranslations('en', { 'page.title': 'Hello' });
i18n.addTranslations('zh-Hant', { 'page.title': '你好' });
i18n.updateDOM();
</script>
```

主要方法：`addTranslations()`、`addLanguagePack()`、`t()`、`setLanguage()`、`updateDOM()`、`getCurrentLanguage()`、`getAvailableLanguages()`、`detectBrowserLanguage()`、`autoInit()`。

`autoSave: true` 時會保存語言偏好；localStorage 被瀏覽器阻止時不會令整個 module crash。

## 翻譯 key CLI

需要 Node.js：

```bash
node bin/extract-i18n.js --help
node bin/extract-i18n.js /path/to/site --output ./locales --languages en,zh-Hant,zh-Hans --default-lang en
```

CLI 會掃描 `data-i18n="..."`、`i18n.t("...")`、`t("...")` 等 key，再生成 JSON template。
