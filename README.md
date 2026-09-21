# Casepoint Tools Portal

A collection of internal browser-based tools for the Casepoint team. Zero dependencies, no build step, no server required — open `index.html` in any modern browser.

## Quick Start

1. Clone or download this repository
2. Open `index.html` in a browser
3. Click any tool card to launch it

> **Note:** When opening via `file://` protocol, `tools.json` may not load due to browser security restrictions. The portal includes a hardcoded fallback so all tools remain accessible.

## Project Structure

```
TFSData/
├── index.html                  Landing page — tools portal
├── tools.json                  Tool registry (drives the portal)
├── tfs-dashboard/
│   └── index.html              TFS Sprint Dashboard
├── md-viewer/
│   ├── index.html              Markdown Viewer / Editor
│   └── marked.umd.js           Markdown parsing library (marked v15.0.7)
├── sprint-planner/
│   └── index.html              Sprint Planner
├── user-performance-report/
│   └── index.html              User Performance Report
├── pr-reviewer/
│   └── index.html              PR Review Automater
├── punch-time-calculator/
│   └── index.html              Punch Time Calculator
├── common/
│   ├── tfs-api.js              Shared TFS API helper (opt-in per tool)
│   └── test.html               Manual test page for tfs-api.js
├── cors-proxy/
│   └── worker.js               Cloudflare Worker CORS proxy (not published)
├── serve.js                    Local dev server + NTLM TFS proxy
├── CLAUDE.md                   Claude Code project instructions
└── README.md                   This file
```

## Tools

### Sprint Dashboard

**Path:** `tfs-dashboard/index.html`

Real-time TFS Sprint Team Dashboard for the CasepointARA project. Connects to the Casepoint TFS server and displays sprint work items with filtering, sorting, and multiple view modes.

**Features:**
- Live sprint data from TFS API (`https://tfs.casepoint.in/tfs/Casepoint`)
- Tree view — parent requirements with expandable child tasks and bugs
- Grouped view — work items organized by assignee
- Member Data view — daily burn chart per team member with update history
- Cross-sprint work totals — aggregated Original/Completed hours across all sprints per requirement
- Column visibility toggle and drag-to-reorder columns
- Task Execution Type validation — flags invalid discipline/execution type combinations
- Multi-filter system — filter by Type, State, Priority, Discipline, Assignee, or free-text search
- Sprint auto-detection — selects the current active sprint on load
- Area path filtering — scope dashboard to specific team areas
- Light/dark glassmorphism theme with toggle
- Sidebar with sprint selector, area filter, view mode controls, and settings
- Skeleton loader during data fetch

**Requirements:**
- A TFS Personal Access Token (PAT) with read access to the CasepointARA project
- The PAT is entered via a modal on first load and stored in `localStorage` (never sent to any server other than TFS)
- If accessing TFS from a different domain, configure a CORS proxy URL in the settings modal

**localStorage keys:**

| Key | Purpose |
|-----|---------|
| `tfs_dashboard_pat` | TFS Personal Access Token |
| `tfs_dashboard_proxy` | CORS proxy URL (optional) |
| `tfs_dashboard_sidebar` | Sidebar collapsed/expanded state |
| `tfs_dashboard_theme` | Theme preference (`light` / `dark`) |

**TFS API details:**
- Base URL: `https://tfs.casepoint.in/tfs/Casepoint`
- Project: `CasepointARA`
- API version: `2.0`
- Auth: Basic Auth with PAT (`Authorization: Basic base64(":"+PAT)`)
- Custom fields (auto-disabled if TFS returns 400):
  - `Casepoint.TFS.CustomFields.TaskExecutionType`
  - `Microsoft.VSTS.Scheduling.RevisedEstimate`

---

### Markdown Viewer

**Path:** `md-viewer/index.html`

A client-side Markdown viewer and editor with live preview. Runs entirely in the browser — no data leaves your machine.

**Features:**
- Split-pane layout — editor on the left, rendered preview on the right
- Live rendering with 120ms debounce (GitHub Flavored Markdown via marked.js)
- File upload — open `.md`, `.txt`, `.markdown`, `.mdown`, `.mkd`, `.mkdn`, `.text` files
- Drag and drop — drop a file anywhere on the page
- Copy HTML — export rendered output to clipboard
- Print — clean print-optimized stylesheet for PDF/paper
- Live stats — word count, line count, character count in the toolbar
- Resizable panels — drag the divider to adjust editor/preview ratio; double-click to reset
- Tab key support — inserts 4 spaces in the editor
- Keyboard shortcut: `Ctrl+O` to open a file
- Light/dark theme toggle with OS preference detection
- Responsive — switches to vertical layout below 900px
- Code blocks display language badges (e.g., `js`, `python`)

**Dependencies:**
- `marked.umd.js` (v15.0.7, MIT license) — bundled alongside the HTML file

**localStorage keys:**

| Key | Purpose |
|-----|---------|
| `md-viewer-theme` | Theme preference (`light` / `dark`) |

---

### Sprint Planner

**Path:** `sprint-planner/index.html`

Sprint capacity planning and backlog assignment for CasepointARA, with write-back to TFS.

**Features:**
- Capacity Planning — team member list, sprint working days, total capacity, sprint dates
- Backlog & Assignment — pull the sprint backlog and assign items to members
- Workload Dashboard — per-member assigned load against available capacity
- Push to TFS — writes the planned assignments back to the work items
- TFS connection panel: server URL, PAT, optional CORS proxy URL

---

### User Performance Report

**Path:** `user-performance-report/index.html`

Per-member sprint scorecard built from TFS work items and their update history.

**Features:**
- Headline metrics: Tasks Completed, Hours Delivered, AI Adoption, Bug Resolution Rate
- AI vs Manual task split, derived from the `TaskExecutionType` custom field
- Sprint / iteration and team member selectors
- Optional CORS proxy support for off-network access

---

### PR Review Automater

**Path:** `pr-reviewer/index.html`

Produces a structured code review report from a pull request URL or a raw diff.

**Features:**
- Accepts a GitHub PR URL, a TFS PR URL, or pasted / drag-dropped code or diff text
- Optional PAT / token field for private repositories
- Optional OpenAI API key for AI-assisted review commentary (left blank = rule-based only)
- Renders a PR Review Report you can read in the browser

**Note:** Any key or token you enter stays in the browser — it is sent only to the service it belongs to.

---

### Punch Time Calculator

**Path:** `punch-time-calculator/index.html`

Offline timesheet helper — no TFS connection, no network calls.

**Features:**
- Paste alternating IN / OUT punch times (one per line) to get Total Work, Total Break, Sessions, and Remaining
- Weekly view with a configurable week start and selectable working days
- Configurable daily target hours and 12h / 24h time format
- Data persists in `localStorage`; a reset control clears all saved punches and settings

---

## Portal Landing Page

**Path:** `index.html` (root)

The portal is a single-page HTML file that reads `tools.json` and renders a card for each tool. It shares the same glassmorphism visual language as the Sprint Dashboard.

**Features:**
- Dynamic tool cards loaded from `tools.json`
- Hardcoded fallback array for offline / `file://` usage
- Light/dark theme toggle (independent of individual tool themes)
- Responsive grid layout (1-3 columns based on viewport)
- Skeleton loading state while fetching `tools.json`
- Input sanitization — path validation, hex color validation, JSON schema checks
- Content Security Policy via meta tag
- Accessible — focus-visible outlines, ARIA labels, semantic HTML

**localStorage keys:**

| Key | Purpose |
|-----|---------|
| `tools_portal_theme` | Theme preference (`light` / `dark`) |

---

## Adding a New Tool

1. **Create a subfolder** with the tool's files:
   ```
   my-new-tool/
   ├── index.html        (self-contained HTML application)
   └── (any co-located assets)
   ```

2. **Add an entry to `tools.json`:**
   ```json
   {
     "id": "my-new-tool",
     "name": "My New Tool",
     "description": "A short description of what it does.",
     "path": "my-new-tool/index.html",
     "icon": "default",
     "accentColor": "#10b981",
     "tags": ["Tag1", "Tag2"]
   }
   ```

3. **(Optional)** Add a custom icon — add an SVG string to the `ICONS` object in `index.html` under a new key, then reference that key in the `icon` field.

**`tools.json` schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique identifier (used as HTML id) |
| `name` | string | yes | Display name on the card |
| `description` | string | yes | One or two sentence summary |
| `path` | string | yes | Relative path to the tool's entry file |
| `icon` | string | yes | Key into the `ICONS` map (`sprint`, `markdown`, `analytics`, `planner`, `review`, `timer`, or `default`) |
| `accentColor` | string | yes | 6-digit hex color (e.g., `#6366f1`) for card accent |
| `tags` | string[] | yes | Short labels shown as pills on the card |

---

## Development

- **No build step.** Every tool is a standalone HTML file. Open directly in a browser.
- **No package manager.** No `node_modules`, no `npm install`.
- **No tests or linter.** Verify changes by opening the file in a browser.
- **Code style:** ES5 syntax (`var`, `.then()`), inline CSS/JS, section headers marked with `/* --- SECTION --- */`.
- **Theming:** CSS custom properties with glassmorphism effects via `backdrop-filter`. Each tool manages its own theme independently.

## Deployment (GitHub Pages)

The portal deploys to GitHub Pages via `.github/workflows/deploy.yml`. It is a plain static deploy — **no secrets, variables, or environment configuration are required.**

### One-time setup

1. **Go to** Settings > Pages > Source > select **GitHub Actions**
2. **Push to `main` or `DevEnviournment`** — the workflow triggers automatically and deploys

You can also run it manually from the Actions tab (`workflow_dispatch`).

### How it works

- Runs on every push to `main` or `DevEnviournment`
- Copies the repo into a `_site/` staging folder, excluding things that should not be published: `.github/`, `.claude/`, `everything-claude-code/`, `CLAUDE.md`, `README.md`, `.gitignore`, `serve.js`, and `cors-proxy/`
- Uploads `_site/` as the Pages artifact and deploys it

Adding a tool needs no workflow change — create the folder, add it to `tools.json` and the portal fallback array, and push.

### Local development

Open `index.html` directly in a browser, or run `node serve.js` and visit `http://localhost:3000` for a local server that also proxies TFS calls using NTLM auth.

## Browser Support

Tested on modern Chromium-based browsers (Chrome, Edge). Firefox and Safari should work but are not the primary target. `backdrop-filter` and CSS `clamp()` require relatively recent browser versions.

## Security Notes

- TFS PAT is stored in `localStorage` and transmitted only to the configured TFS server over HTTPS
- The portal validates all data from `tools.json` before rendering (path scheme checks, hex color format, object shape validation)
- A Content Security Policy meta tag restricts script and resource loading on the portal page
- No secrets, API keys, or credentials are stored in the repo or injected at deploy time — every tool asks for its own token at runtime and keeps it in `localStorage`
- No data is sent to any third-party service — all tools run entirely client-side

## License

Internal Casepoint tool. Not licensed for external use.
