---
title: Building a Design System
date: 2026-02-10
type: design
category: design
summary: A guide to building a maintainable design system covering colors, typography, and component specs.
tags: [design, ui, system]
author: Rue Team
lang: en
---

## Why You Need a Design System

A design system is the foundation of product consistency. Without one, every page risks looking different.

## Color Tokens

Define primary, secondary, and semantic colors (success, warning, error).

```css
:root {
  --color-primary: #3b82f6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

## Typography

- Headings: Inter, 700
- Body: Inter, 400
- Code: JetBrains Mono

## Component Checklist

1. Button
2. Input
3. Card
4. Modal
5. Toast

A design system requires ongoing maintenance as the product evolves.
