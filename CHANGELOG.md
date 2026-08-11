# Changelog

## 0.1.0 — 2026-08-11

First public Rue.js repository release.

### Release cleanup
- Aligned `rue-i18n`, `rue-carousel` and `rue-notes` package versions to `0.1.0`.
- Corrected the Rue i18n CLI packaging: the executable now lives at `rue-i18n/bin/extract-i18n.js`, the package `bin` entry points to it, and `--help` is implemented.
- Added safe localStorage access for Rue i18n and restricted placeholder updates to input/textarea elements.
- Kept previously fixed Rue Notes TOC safety, dotted-slug handling, list rendering, inline code and initial router rendering.
- Fixed Rue Notes configuration validation so `showDrafts` is recognised.
- Strengthened SearchEngine cache keys so equal-length entry sets do not share stale cached results merely because their lengths match.
- Removed macOS metadata and internal cleanup/report files from the public package.
- Replaced project-specific sample data with generic examples.
- Added beginner-first documentation in British English, Traditional Chinese and Simplified Chinese.

### Release status
Core flows have been manually reviewed and syntax-checked. A full automated regression suite is planned for a later release; this release is not labelled production-hardened.
