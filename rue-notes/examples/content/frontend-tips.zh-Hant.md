---
title: 前端效能優化技巧
date: 2026-01-20
type: tutorial
category: frontend
summary: 五個立即可用的前端效能優化方法，讓你的網站更快。
tags: [frontend, performance, tutorial]
author: Rue Team
lang: zh-Hant
---

## 1. 圖片懶加載

使用原生 `loading="lazy"` 屬性，延遲載入視窗外的圖片。

```html
<img src="photo.jpg" loading="lazy" alt="...">
```

## 2. 減少 JavaScript Bundle 大小

使用 tree-shaking，只打包實際用到的程式碼。

## 3. 使用 CSS contain

`contain: layout` 可以限制瀏覽器的 reflow 範圍，提升渲染效能。

## 4. 預載關鍵資源

```html
<link rel="preload" href="font.woff2" as="font" crossorigin>
```

## 5. 避免 Layout Thrashing

批次讀取 DOM 屬性，再批次寫入，避免強制同步 layout。

這些技巧都不需要引入額外的函式庫，直接可用。
