---
title: Frontend Performance Tips
date: 2026-01-20
type: tutorial
category: frontend
summary: Five immediately actionable frontend performance optimizations to make your site faster.
tags: [frontend, performance, tutorial]
author: Rue Team
lang: en
---

## 1. Native Image Lazy Loading

Use the native `loading="lazy"` attribute to defer off-screen images.

```html
<img src="photo.jpg" loading="lazy" alt="...">
```

## 2. Reduce JavaScript Bundle Size

Use tree-shaking to only bundle code that is actually used.

## 3. CSS contain

`contain: layout` limits the browser's reflow scope, improving render performance.

## 4. Preload Critical Resources

```html
<link rel="preload" href="font.woff2" as="font" crossorigin>
```

## 5. Avoid Layout Thrashing

Batch DOM reads together, then batch writes — never interleave them.

None of these require additional libraries. Use them today.
