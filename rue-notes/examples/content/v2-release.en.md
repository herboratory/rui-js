---
title: Rue Notes v0.2 Released
date: 2026-03-15
type: deploy
category: frontend
summary: New modular architecture with search, filter, pagination, routing, and i18n support.
tags: [release, frontend, deploy]
author: Rue Team
lang: en
---

## What's New

Rue Notes v0.2 is a major refactor, evolving from a single file into a full modular system.

### Search Engine

Full-text search across title, summary, tags, and bodyText with weighted ranking.

### Router

Hash-based routing supporting:
- `#notes` — list view
- `#notes/:slug` — detail view
- `#notes?q=keyword` — search
- `#notes?type=deploy` — filter

### Pagination

Configurable per-page count. Automatically resets to page 1 after search or filter.

### i18n

Language fallback chain support — automatically falls back to an alternate language when the current one is unavailable.

## Upgrading

Upgrading from v0.1 only requires replacing `rue-notes.js` and adding the new module files. See MIGRATION.md.
