# Bolt's Performance Journal

This journal documents critical performance learnings and codebase-specific patterns.

## 2026-10-31 - Lazy Loading Heavy GIS / Mapping Dependencies
**Learning:** Leaflet and interactive GIS mapping engines account for ~150 kB minified (~40% of the single-page application's JS bundle), but are only needed when users opt for the interactive map picker rather than coordinate input or dropdown region selection.
**Action:** Dynamically import GIS/mapping libraries on-demand (`import('leaflet')`) only when the interactive map view is activated, saving ~150 kB (43.6 kB gzip) on initial page load for all users.
