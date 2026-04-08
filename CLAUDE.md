# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ECC Plugin (Everything Claude Code)

The `everything-claude-code/` directory contains the [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) plugin — a collection of 47 agents, 149+ skills, 79 commands, hooks, and rules for Claude Code.

**IMPORTANT:** Before starting any work, you MUST run the ECC installer to register all agents, skills, commands, hooks, and rules with Claude Code:
```powershell
cd everything-claude-code
.\install.ps1 --target claude --profile full
```
This copies everything into `~/.claude/` (agents, skills, commands, rules) and merges hooks into `~/.claude/settings.json`. Without running this, Claude Code will NOT have access to the ECC agents and skills. Re-run this command after pulling new changes from the ECC repo.

## Project Overview

A **multi-tool portal** for the Casepoint team. The root `index.html` is a landing page that links to self-contained tools in subdirectories. Each tool is a standalone vanilla JS SPA with no build tools, no dependencies, and no framework.

### Folder Structure

```
TFSData/
├── index.html              ← Tools portal landing page
├── tools.json              ← Tool registry (drives the landing page)
├── tfs-dashboard/
│   └── index.html          ← TFS Sprint Dashboard (~3300 lines)
├── md-viewer/
│   ├── index.html          ← Markdown Viewer (~970 lines)
│   └── marked.umd.js       ← Markdown parsing library
├── ai-adoption-tracker/
│   ├── index.html              ← AI Adoption Tracker (~14000 lines)
│   ├── auth-config.example.js  ← Template for auth config (committed)
│   └── auth-config.js          ← Real auth config (gitignored, has cipher key + users)
├── everything-claude-code/  ← ECC plugin (gitignored)
├── CLAUDE.md
└── README.md
```

### Adding a New Tool

1. Create a subfolder with an `index.html` (e.g., `my-tool/index.html`)
2. Add an entry to `tools.json`:
   ```json
   {
     "id": "my-tool",
     "name": "My Tool",
     "description": "What it does.",
     "path": "my-tool/",
     "icon": "default",
     "accentColor": "#10b981",
     "tags": ["Tag1"]
   }
   ```
3. Optionally add a new SVG icon key to `ICONS` in `index.html`

## Development

- **No build step.** Open any `index.html` directly in a browser.
- **No tests or linter.** Verify changes by opening the file in a browser.
- The portal landing page loads `tools.json` via `fetch()`, with a hardcoded fallback array for `file://` protocol.

## Tools

### TFS Sprint Dashboard (`tfs-dashboard/index.html`)

Real-time TFS Sprint Team Dashboard for CasepointARA. Single-file vanilla JS SPA — all CSS, HTML, and JS in one file (~3300 lines).

- A TFS Personal Access Token is required — entered via modal on first load, stored in localStorage.
- For external hosting behind CORS restrictions, configure a proxy URL via the settings modal.

#### Architecture

Three main sections:

1. **CSS** (lines 1–1158): Glassmorphism dark theme with `.light-theme` class override. Uses CSS custom properties for theming.
2. **HTML** (lines ~1050–1158): Sidebar, topbar, stats cards, main table, PAT modal, certificate warning.
3. **JavaScript** (lines 1160–3283): ES5 with `var` declarations.

#### JS sections (marked by `/* ─── SECTION ─── */` comments)

- **CONFIG** — TFS base URL, project name, field lists, localStorage keys
- **STATE** — Global mutable state: `allItems`, `sprints`, `sortCol`, `treeMode`, `groupMode`
- **COLUMN DEFINITIONS** — `COLS` array, `colOrder`/`colMap` for visibility and drag-reorder
- **TASK EXECUTION TYPE VALIDATION** — `EXEC_TYPE_RULES`, `isValidExecType()`, `isCompWorkExceeded()`, `isInvalidManualAI()`
- **API** — `apiFetch(url)` / `apiPost(url, body)` with auth + proxy; `fetchWorkItemsBatch()` with field-fallback
- **LOAD SPRINTS** — Walks TFS iteration tree, finds `PI-\d{4}` sprints, auto-selects current
- **ITEM MAPPER** — `mapItem()` transforms TFS API response into flat objects
- **LOAD SPRINT ITEMS** — WIQL query → batch fetch → parent-child linking → render
- **FETCH ALL-SPRINT WORK TOTALS** — Cross-sprint aggregation including bugs-under-requirements
- **MEMBER DATA** — Per-member daily burn chart from update history
- **APPLY + RENDER** — `renderTable()` dispatches to `renderTree()` or `renderGrouped()`
- **BOOT** — PAT → cert check → `bootConnect()` → `loadAreas()` → `loadSprints()`

#### Data flow

```
Boot → loadAreas() → loadSprints() → loadSprint(path) → WIQL query → fetchWorkItemsBatch()
  → mapItem() → allItems[] → fetchBugRelations() → finalizeAndRender() → fetchAllSprintWork()
  → renderTable()
```

#### View modes

- **Tree mode** (default): Parent requirements with expandable child tasks/bugs
- **Grouped mode**: Work items grouped by assignee
- **Member Data mode**: Daily burn grid per team member

### Markdown Viewer (`md-viewer/index.html`)

Markdown file viewer/editor with live preview. Uses `marked.umd.js` (v15.0.7) for rendering.

- Drag-and-drop or upload `.md`/`.txt` files
- Live editing with real-time rendering (120ms debounce)
- Copy HTML output, print support
- Light/dark theme toggle

### AI Adoption Tracker (`ai-adoption-tracker/index.html`)

TFS data analysis dashboard with role-based access control. Single-file SPA (~14000 lines) with inline user registry.

- **Allowed User System**: Two-stage auth — TFS PAT validates identity, then username is matched against XOR-encrypted whitelist loaded from external `auth-config.js` (gitignored)
- **Auth config**: `auth-config.js` contains cipher key, user list, and taskCreatorUrl. Copy `auth-config.example.js` to set up.
- **Three roles**: `super_admin` (all 7 tabs), `admin` (tabs 1-3, 5-6), `normal` (per-user tab list, max 3 areas)
- **7 tabs**: Sprint Planning, Work Progress, AI Usage, AI Analytics, Feature Progress, Data Lookup, Encrypt Username (super_admin only)
- Feature update capability restricted to admin/super_admin
- CDN dependencies: html2canvas, jspdf, Google Fonts (requires internet)

## TFS API Details

- **Base URL:** `https://tfs.casepoint.in/tfs/Casepoint`
- **Project:** `CasepointARA`
- **API version:** `2.0`
- **Auth:** Basic Auth with PAT (`"Basic " + btoa(":" + PAT)`)
- **Custom fields** (auto-disabled on 400 errors):
  - `Casepoint.TFS.CustomFields.TaskExecutionType`
  - `Microsoft.VSTS.Scheduling.RevisedEstimate`

## localStorage Keys

| Key | Tool | Purpose |
|-----|------|---------|
| `tools_portal_theme` | Portal | Light/dark theme preference |
| `tfs_dashboard_pat` | TFS Dashboard | Personal Access Token |
| `tfs_dashboard_proxy` | TFS Dashboard | CORS proxy URL |
| `tfs_dashboard_sidebar` | TFS Dashboard | Sidebar collapsed state |
| `tfs_dashboard_theme` | TFS Dashboard | Light/dark theme preference |
| `md-viewer-theme` | MD Viewer | Light/dark theme preference |

## Code Style

- ES5 syntax — use `var`, not `let`/`const`; use `.then()`, not `async`/`await`
- Global state variables at top of script block
- Section headers: `/* ─── SECTION NAME ─── */`
- HTML escaping via `esc()` function for all user-supplied text
- CSS custom properties for theming; glassmorphism via `backdrop-filter`
- Each tool is fully self-contained in its subfolder (no shared CSS/JS files)
