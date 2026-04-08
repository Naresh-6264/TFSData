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

A real-time TFS (Team Foundation Server) Sprint Team Dashboard for the CasepointARA project. Single-file vanilla JavaScript SPA — all CSS, HTML, and JS live in `index.html` (~3300 lines). No build tools, no dependencies, no framework.

## Development

- **No build step.** Open `index.html` directly in a browser.
- **No tests or linter.** Verify changes by opening the file in a browser with a valid TFS PAT.
- A TFS Personal Access Token is required for data — entered via modal on first load, stored in localStorage.
- For external hosting behind CORS restrictions, configure a proxy URL via the settings modal.

## Architecture

### Single-file structure

`index.html` is the entire application. It has three main sections:

1. **CSS** (lines 1–1158): Glassmorphism dark theme with a `.light-theme` class override for light mode. Uses CSS custom properties (`--glass-bg`, `--glass-border`, etc.) for theming.
2. **HTML** (lines ~1050–1158): Sidebar with filters/controls, topbar, stats cards, main table, PAT modal, certificate warning overlay.
3. **JavaScript** (lines 1160–3283): All application logic in ES5 with `var` declarations.

### JS sections (marked by `/* ─── SECTION ─── */` comments)

- **CONFIG** — TFS base URL, project name, field lists, localStorage keys
- **STATE** — Global mutable state: `allItems`, `sprints`, `sortCol`, `treeMode`, `groupMode`, work totals caches
- **COLUMN DEFINITIONS** — `COLS` array defines table columns; `colOrder`/`colMap` for visibility and drag-reorder
- **TASK EXECUTION TYPE VALIDATION** — `EXEC_TYPE_RULES` maps Discipline → allowed execution types; `isValidExecType()`, `isCompWorkExceeded()`, `isInvalidManualAI()` flag warnings
- **API** — `apiFetch(url)` / `apiPost(url, body)` handle auth + proxy; `fetchWorkItemsBatch()` has automatic field-fallback (disables custom fields that TFS rejects)
- **LOAD SPRINTS** — Walks TFS iteration tree, finds sprints matching `PI-\d{4}`, auto-selects current sprint
- **ITEM MAPPER** — `mapItem()` transforms TFS API response into flat objects used everywhere
- **LOAD SPRINT ITEMS** — WIQL query → batch fetch → parent-child linking → render
- **FETCH ALL-SPRINT WORK TOTALS** — Cross-sprint aggregation of Original/Completed work per requirement (including bugs-under-requirements via link traversal)
- **MEMBER DATA** — Per-member daily burn chart built from work item update history
- **APPLY + RENDER** — `renderTable()` dispatches to `renderTree()` or `renderGrouped()`; `buildRow()` builds a single `<tr>`
- **BOOT** — Entry point: loads PAT from localStorage → cert check → `bootConnect()` → `loadAreas()` → `loadSprints()` → auto-loads current sprint

### Data flow

```
Boot → loadAreas() → loadSprints() → loadSprint(path) → WIQL query → fetchWorkItemsBatch()
  → mapItem() → allItems[] → fetchBugRelations() → finalizeAndRender() → fetchAllSprintWork()
  → renderTable()
```

### View modes

- **Tree mode** (default): Parent requirements with expandable child tasks/bugs
- **Grouped mode**: Work items grouped by assignee
- **Member Data mode**: Daily burn grid per team member (fetches update history)

## TFS API Details

- **Base URL:** `https://tfs.casepoint.in/tfs/Casepoint`
- **Project:** `CasepointARA`
- **API version:** `2.0`
- **Auth:** Basic Auth with PAT (`"Basic " + btoa(":" + PAT)`)
- **Custom fields** (may not exist on all TFS instances — code auto-disables them on 400 errors):
  - `Casepoint.TFS.CustomFields.TaskExecutionType`
  - `Microsoft.VSTS.Scheduling.RevisedEstimate`

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `tfs_dashboard_pat` | Personal Access Token |
| `tfs_dashboard_proxy` | CORS proxy URL |
| `tfs_dashboard_sidebar` | Sidebar collapsed state |
| `tfs_dashboard_theme` | Light/dark theme preference |

## Code Style

- ES5 syntax — use `var`, not `let`/`const`; use `.then()`, not `async`/`await`
- Global state variables at top of script block
- Section headers: `/* ─── SECTION NAME ─── */`
- HTML escaping via `esc()` function for all user-supplied text
- CSS custom properties for theming; glassmorphism via `backdrop-filter`
- Work item types: Task, Bug, Requirement, Feature, User Story
