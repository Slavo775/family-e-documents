## Context

The backend Audit API at `app/api/src/audit/` provides:
- `GET /api/v1/audit` → paginated audit log entries with filters (userId, method, status, dateFrom, dateTo)

Each audit entry contains: id, userId, method, path, statusCode, durationMs, ipAddress, userAgent, body (JSON), timestamp.

The design template at `design-template-app/.../src/routes/admin.audit.tsx` shows the exact layout.

## Goals / Non-Goals

**Goals:**
- Exact visual match to design template
- Real audit data from API
- Method filter toggle (ALL/POST/PATCH/DELETE)
- Expandable rows showing JSON request body
- Color-coded method badges (POST=brand, PATCH=warning, DELETE=destructive)
- Color-coded status badges (2xx=success, 4xx=warning, 5xx=destructive)
- Responsive: table on desktop, cards on mobile

**Non-Goals:**
- Date range picker (button is placeholder)
- CSV export (button is placeholder that triggers browser download)
- Real-time updates
- Pagination beyond client-side (server pagination in v2)

## Decisions

### Decision: Method toggle as segmented control

The method filter uses a custom segmented control (ALL | POST | PATCH | DELETE buttons) matching the design template. Not a select dropdown.

### Decision: Expandable rows via state toggle

Each table row is clickable. Clicking toggles `expanded` state for that row's ID. When expanded, an additional row below shows the JSON body in a `<pre>` block with dark background and mono font.

### Decision: Color helpers for method and status

Create small utility functions `methodColor(method)` and `statusColor(status)` that return Tailwind class strings. These are inlined in the component (not extracted to a separate file) since they're audit-specific.

### Decision: Client-side filtering for v1

Fetch a page of audit entries and apply method filter client-side. The user/status selects will be wired to API query params in the `useAuditLog()` hook. Pagination is server-side (API returns page + totalCount).

### Decision: CSV export as placeholder

The "Export CSV" button is rendered but shows a toast "Coming soon" on click. Real CSV export can be added later by calling an API endpoint that returns text/csv.

## Risks / Trade-offs

- **Large audit log** — The audit table could grow large. Server-side pagination is essential. The API should support `page` and `limit` params. The frontend sends these.
- **User select needs user list** — Reuse `useUsers()` hook from `frontend-admin-users` to populate the user filter dropdown.

## Migration Plan

1. Create audit API hook
2. Create audit page with filter bar
3. Add desktop table with expandable rows
4. Add mobile cards
5. Add pagination
6. Typecheck
