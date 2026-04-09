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
├── ai-adoption-tracker/
│   ├── index.html              AI Adoption Tracker
│   ├── admin.html              Admin — user management page
│   ├── auth-config.example.js  Auth config template (committed)
│   └── auth-config.js          Real auth config (gitignored)
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

### AI Adoption Tracker

**Path:** `ai-adoption-tracker/index.html`

A TFS data analysis dashboard with sprint planning, work progress tracking, AI usage analytics, feature progress monitoring, and an encrypted user management system. Role-based access control restricts features per user.

**Features:**
- 7 tab views: Sprint Planning, Work Progress, AI Usage, AI Analytics, Feature Progress, Data Lookup, Encrypt Username
- Role-based access control with three roles: `super_admin`, `admin`, `normal`
- Per-user tab visibility — each user sees only their permitted tabs
- Area path filtering with role-based limits (normal users: max 3 areas)
- Feature progress tracking with hour breakdowns (estimate, discovery, dev, planned, completed)
- Admin-only feature data update — bulk update feature state/status/hours in TFS
- AI usage and adoption analytics across areas and sprints
- Data Lookup tab links to external Task Creator tool
- Encrypt Username tab (super_admin only) — encrypt/decrypt usernames, view full user table
- PDF export via html2canvas + jspdf
- Dark/light theme toggle

**Allowed User System:**

The tool uses a two-stage authentication model:

1. **TFS PAT validation** — User enters TFS server URL and PAT. The app calls `_apis/connectionData` to get the authenticated username.
2. **Whitelist check** — The username is compared (case-insensitive) against an XOR-encrypted user list loaded from `auth-config.js`. If no match, access is denied entirely.

| Role | Tabs | Feature Update | Area Limit |
|------|------|----------------|------------|
| `super_admin` | All 7 tabs | Yes | Unlimited |
| `admin` | 1-3, 5-6 | Yes | Unlimited |
| `normal` | Per-user config | No | Max 3 |

**Setup (required before first use):**
1. Copy `auth-config.example.js` to `auth-config.js` in the same folder
2. Fill in the cipher key and encrypted user entries
3. `auth-config.js` is gitignored — it never gets committed

**Managing users (via admin page):**
1. Open `admin.html` (next to `index.html` in the `ai-adoption-tracker/` folder)
2. Log in with the admin credentials (stored in `auth-config.js` as a SHA-256 hash)
3. Enter the user's TFS display name, select role and tabs
4. Click **Encrypt** — a ready-to-paste JSON entry is generated
5. Copy the entry and add it to the `users` array in `auth-config.js`
6. The admin page also shows the full current user list (decrypted) and a decrypt/verify tool

**Dependencies (CDN, requires internet):**
- `html2canvas` v1.4.1
- `jspdf` v2.5.1
- Google Fonts (Inter)

**Files:**

| File | Purpose |
|------|---------|
| `index.html` | Main application (~14,000 lines) |
| `admin.html` | Admin page — login-protected user management, encrypt/decrypt tool |
| `auth-config.example.js` | Template config — committed to git, no real data |
| `auth-config.js` | Real config with cipher key, users, and admin credentials — **gitignored** |

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
| `icon` | string | yes | Key into the `ICONS` map (`sprint`, `markdown`, or `default`) |
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

The project deploys to GitHub Pages via a GitHub Actions workflow. The AI Adoption Tracker requires an auth config that is **not stored in the repo** — it's injected at deploy time from a GitHub secret.

### One-time setup

1. **Go to** your repo Settings > Secrets and variables > Actions
2. **Create a new repository secret** named `AUTH_CONFIG_DATA`
3. **Paste the full contents** of your local `auth-config.js` as the secret value:
   ```javascript
   var AUTH_CONFIG = {
       cipherKey: "your-cipher-key-here",
       taskCreatorUrl: "https://example.com/task-creator/",
       users: [
           { "name": "ENCRYPTED_NAME", "role": "super_admin", "tabs": [1,2,3,4,5,6,7] },
           { "name": "ENCRYPTED_NAME", "role": "admin", "tabs": [1,2,3,5,6] }
       ]
   };
   ```
4. **Go to** Settings > Pages > Source > select **GitHub Actions**
5. **Push to `DevEnviournment`** — the workflow triggers automatically and deploys

### How it works

- `.github/workflows/deploy.yml` runs on every push to `DevEnviournment`
- It writes the `AUTH_CONFIG_DATA` secret into `ai-adoption-tracker/auth-config.js` at build time
- The file is included in the deployed Pages artifact but **never appears in the repo source**
- To update users: edit the secret in GitHub Settings, then re-run the workflow

### Local development

For local use (opening files directly in a browser), copy `auth-config.example.js` to `auth-config.js` in the `ai-adoption-tracker/` folder and fill in your real data. This file is gitignored.

## Browser Support

Tested on modern Chromium-based browsers (Chrome, Edge). Firefox and Safari should work but are not the primary target. `backdrop-filter` and CSS `clamp()` require relatively recent browser versions.

## Security Notes

- TFS PAT is stored in `localStorage` and transmitted only to the configured TFS server over HTTPS
- The portal validates all data from `tools.json` before rendering (path scheme checks, hex color format, object shape validation)
- A Content Security Policy meta tag restricts script and resource loading on the portal page
- AI Adoption Tracker auth config (cipher key + encrypted user list) is stored as a GitHub secret, injected only at deploy time — never in the repo source
- No data is sent to any third-party service — all tools run entirely client-side

## License

Internal Casepoint tool. Not licensed for external use.
