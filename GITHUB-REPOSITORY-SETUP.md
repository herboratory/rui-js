# GitHub repository setup for Rue.js

Use these values when creating the repository.

## Repository name

```text
rue-js
```

## Owner

Use the Herboratory GitHub organisation/account if that is where you want the project to live.

## Description

```text
A lightweight, design-first JavaScript toolkit for multilingual, content-driven static sites — i18n, JSON carousels and Markdown notes without a heavy framework.
```

## Visibility

```text
Public
```

## Initialise repository options

Because this package already contains a README, `.gitignore` and `LICENSE`, leave GitHub's automatic initialisation options **unchecked** when creating the empty repository. Upload/push these existing files afterwards.

## Suggested topics

```text
javascript
vanilla-javascript
static-site
i18n
internationalization
localization
markdown
carousel
newsroom
changelog
multilingual
progressive-enhancement
frontend
```

## Website field

If Rue.js later has a dedicated demo/documentation page, put that URL here. Until then, you can leave it blank or use the Herboratory project page once it is live.

## First release

Create a Git tag/release:

```text
v0.1.0
```

Suggested release title:

```text
Rue.js v0.1.0 — First public release
```

Suggested short release text:

```text
First public release of Rue.js, a lightweight JavaScript toolkit for multilingual static sites. It includes Rue i18n, Rue Carousel and Rue Notes. This early release is intended for personal projects, portfolio sites and controlled static-site use; automated regression coverage will be expanded in future releases.
```

## Suggested About panel

**Description:** use the repository description above.  
**Website:** Herboratory/Rue.js page when available.  
**Topics:** use the suggested topics above.

## Before the first push

1. Confirm no `.DS_Store`, private notes, API keys, tokens, personal paths or build caches are present.
2. Read the three root README files once on GitHub after push to make sure relative links work.
3. Open `rue-i18n/package.json`, `rue-carousel/package.json`, and `rue-notes/package.json` and confirm all show `0.1.0`.
4. Run the syntax checks described in `RELEASE-CHECKLIST.md`.
5. Do not advertise npm/unpkg installation until the packages have actually been published there.
