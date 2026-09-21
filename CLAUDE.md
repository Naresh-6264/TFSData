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
│   ├── index.html          ← Markdown Viewer (~1660 lines)
│   └── marked.umd.js       ← Markdown parsing library
├── sprint-planner/
│   └── index.html          ← Sprint Planner (~3200 lines)
├── user-performance-report/
│   └── index.html          ← User Performance Report (~2350 lines)
├── pr-reviewer/
│   └── index.html          ← PR Review Automater (~2700 lines)
├── punch-time-calculator/
│   └── index.html          ← Punch Time Calculator (~1900 lines)
├── common/
│   ├── tfs-api.js          ← Shared TFS API helper (NTLM/Basic, opt-in per tool)
│   └── test.html           ← Manual test page for tfs-api.js
├── cors-proxy/
│   └── worker.js           ← Cloudflare Worker CORS proxy (not deployed to Pages)
├── serve.js                ← Local dev server + NTLM TFS proxy (node serve.js)
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

### Sprint Planner (`sprint-planner/index.html`)

Sprint capacity planning and backlog assignment, with write-back to TFS.

- Capacity Planning — team members, sprint working days, total capacity, sprint dates
- Backlog & Assignment — assign backlog items to members
- Workload Dashboard — per-member load against capacity
- Push to TFS — writes assignments back to work items

### Sprint Planner (`sprint-planner/index.html`)

Team-scoped sprint planning with task scaffolding. Four tabs: Capacity Planning, **Task Planner**,
Backlog & Assignment, Workload Dashboard, Push to TFS.

- **Team scoping** — teams come from `/_apis/projects/{project}/teams` (43 teams exist). Selecting a
  team loads its area paths (`teamfieldvalues`), working days (`teamsettings`) and its own iteration
  list (`teamsettings/iterations`, which carries `timeFrame: past|current|future`).
- **Roster = TFS capacity**, not scraped assignees. `teamsettings/iterations/{id}/capacities` returns
  the people actually planned for (16 for team Review, vs the 317 the old assignee scan produced),
  with `capacityPerDay` and per-member days off; `teamdaysoff` gives team-wide days off.
- **Learned task profile** — `learnFromPastSprints()` samples the team’s last 4 sprints and derives,
  per task type, the median estimate, usual discipline, tag, execution type and usual owners. Cached
  per team in `localStorage` under `sprint_planner_profile_<teamId>`.
- **Task scaffolding** — development requirements get Analysis, Plan Preparation, Development, Plan
  Review, Code Review, Code Merge; verification requirements get Verification. Task types already
  present under a requirement are skipped. Learned extras (L1, L2, TC Generation, TC Review, Support)
  are offered unticked.
- **Every write is confirmation-gated**, and each task is sent with `validateOnly=true` first; only
  tasks TFS accepts are created.

#### TFS facts this tool depends on (measured against the live server)

| Fact | Detail |
|------|--------|
| Teams / capacity API version | `2.0-preview` (work-item APIs stay on `2.0`) |
| The “Product tag” | `System.Tags` containing the literal tag `Product` — 77% of 533 sampled tasks. `Casepoint.TFS.CustomFields.ProductLine` exists but is **empty** on tasks |
| Development vs verification requirement | Tags: `Affected Area` → verification; `Deliverable` / `Aha-I` / `URN-*` → development; `ALM`, `Regression`, `*Support*` → sprint containers |
| Task title convention | `<Task type> : <Requirement title>`, with case and separator varying in history (`Plan preparation`, `Code merge`, `L2 - `) |
| Iteration path shapes | `teamsettings/iterations[].path` already includes the project; `teamsettings.defaultIteration.path` does not — normalise with `fullIterationPath()` before using in WIQL |
| Capacity display names | `"Name <DOMAIN\user>"` from the capacity API, plain `"Name"` elsewhere — normalise with `cleanName()` |
| Team membership includes groups | e.g. `[CasepointARA]Review Doc Developers` — filter with `isGroupIdentity()` |
| Task creation | `POST /{project}/_apis/wit/workitems/$Task` with `application/json-patch+json`; parent via `System.LinkTypes.Hierarchy-Reverse`; `validateOnly=true` validates and persists nothing |
| Created task defaults | `System.State` = `Proposed`; `System.AssignedTo` defaults to the PAT owner |

### User Performance Report (`user-performance-report/index.html`)

Per-member sprint scorecard built from TFS work item + update history.

- Metrics: Tasks Completed, Hours Delivered, AI Adoption, Bug Resolution Rate
- AI vs Manual task split (from `TaskExecutionType`)
- Sprint and team-member selectors; CORS proxy supported

### PR Review Automater (`pr-reviewer/index.html`)

Generates a structured code review report from a pull request URL or a raw diff.

- Accepts a GitHub or TFS PR URL, or pasted/dropped code or diff text
- Optional PAT/token field for private repos
- Optional OpenAI API key for AI-assisted review commentary

### Punch Time Calculator (`punch-time-calculator/index.html`)

Offline timesheet helper — no TFS connection.

- Paste alternating IN/OUT times (one per line) to get Total Work, Total Break, Sessions, Remaining
- Weekly view with configurable working days, daily target hours, and time format
- All data kept in localStorage; a reset control clears it

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
