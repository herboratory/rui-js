---
title: Rue Notes v0.2 正式發布
date: 2026-03-15
type: deploy
category: frontend
summary: 全新模組化架構，支援搜尋、篩選、分頁、路由與多語言。
tags: [release, frontend, deploy]
author: Rue Team
lang: zh-Hant
---

## 新功能一覽

Rue Notes v0.2 是一次大幅重構，從單一檔案演進為完整的模組化系統。

### 搜尋引擎

支援 title、summary、tags、bodyText 全文搜尋，並有加權排序。

### 路由系統

Hash-based routing，支援：
- `#notes` — 列表
- `#notes/:slug` — 詳細頁
- `#notes?q=keyword` — 搜尋
- `#notes?type=deploy` — 篩選

### 分頁

可設定每頁筆數，搜尋與篩選後自動重置到第一頁。

### 多語言

支援語言 fallback chain，找不到當前語言時自動退回備用語言。

## 升級方式

從 v0.1 升級只需替換 `rue-notes.js` 並加入新的模組檔案。詳見 MIGRATION.md。
