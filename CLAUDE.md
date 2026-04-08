# TFSData - CasepointARA Sprint Team Dashboard

## Project Overview

A real-time TFS (Team Foundation Server) Sprint Team Dashboard for visualizing and managing work items in the CasepointARA project. Built as a standalone vanilla JavaScript SPA with two themed versions.

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES5), HTML5, CSS3
- **UI Design:** Glassmorphism dark theme (index.html), Office-style light theme (TFS.html)
- **APIs:** TFS REST API with Basic Auth (PAT)
- **Storage:** Browser localStorage for settings persistence
- **Build:** None required - pure static files, open directly in browser

## Project Structure

```
TFSData/
  index.html    # Primary dashboard (dark glassmorphism theme, 2900+ lines)
  TFS.html      # Alternative dashboard (light theme, 2300+ lines)
  README.md     # Project readme
```

## Key Architecture Decisions

- **All-in-one files:** Each HTML file contains embedded CSS + JS (no external dependencies)
- **No build step:** Files are served as-is from any static host
- **CORS proxy pattern:** Supports external hosting via configurable proxy URL
- **Certificate trust flow:** Handles untrusted TFS SSL certificates gracefully
- **Tree + Grouped views:** Work items render as parent-child tree or grouped by assignee

## TFS Configuration (Hardcoded)

```
TFS Base URL:  https://tfs.casepoint.in/tfs/Casepoint
Project:       CasepointARA
Work Item URL: https://tfs.casepoint.in/tfs/Casepoint/CasepointARA/_workitems/edit/
```

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `tfs_dashboard_pat` | Personal Access Token for TFS auth |
| `tfs_dashboard_proxy` | CORS proxy URL |
| `tfs_dashboard_sidebar` | Sidebar open/closed state |

## Key Functions (index.html)

### Data Fetching
- `apiFetch(url)` - Authenticated GET with proxy support
- `apiPost(url, body)` - Authenticated POST
- `fetchWorkItemsBatch(batch)` - Batch fetch work items (100/batch)
- `fetchAllSprintWork()` - Load all sprint work items
- `fetchMemberBurnData()` - Member daily work history

### Rendering
- `renderTable()` - Main table (tree or grouped)
- `renderTree()` - Hierarchical parent-child view
- `renderGrouped()` - Assignee-grouped view
- `renderMemberDataGrid()` - Member burn chart

### Filtering & UI
- `applyFilters()` - Search/type/state/priority/assignee filters
- `sortBy(col)` - Column sorting
- `toggleSidebar()` - Collapsible sidebar
- `buildColPanel()` - Column visibility/ordering

## Work Item Types

Task, Bug, Requirement, Feature, User Story

## Security Notes

- PAT is never hardcoded; stored in localStorage
- HTML escaping via `esc()` function for XSS prevention
- Basic Auth header: `Authorization: "Basic " + btoa(":" + PAT)`

## Development Workflow

1. Edit `index.html` (primary) or `TFS.html` (light theme)
2. Open in browser to test (no build needed)
3. TFS PAT required for data - entered via modal on first load
4. For external hosting, configure CORS proxy URL

## Code Style

- ES5 syntax with `var` declarations
- Global state variables at top of script block
- Section headers using `/* --- SECTION NAME --- */` comments
- CSS custom properties (--variables) for theming
- No semicolons optional (mixed usage)
