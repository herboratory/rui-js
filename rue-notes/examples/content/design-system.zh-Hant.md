---
title: 設計系統建立指南
date: 2026-02-10
type: design
category: design
summary: 從零開始建立一套可維護的設計系統，涵蓋色彩、字型與元件規範。
tags: [design, ui, system]
author: Rue Team
lang: zh-Hant
---

## 為什麼需要設計系統

設計系統是產品一致性的基礎。沒有它，每個頁面都可能長得不一樣。

## 色彩規範

定義主色、輔助色與語意色（成功、警告、錯誤）。

```css
:root {
  --color-primary: #3b82f6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

## 字型規範

- 標題：Inter, 700
- 內文：Inter, 400
- 程式碼：JetBrains Mono

## 元件清單

1. Button
2. Input
3. Card
4. Modal
5. Toast

設計系統需要持續維護，隨產品演進而更新。
