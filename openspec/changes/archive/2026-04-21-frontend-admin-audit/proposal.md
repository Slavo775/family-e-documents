## Why

Admins need visibility into all API activity. The design template shows an audit log page at `/admin/audit` with a filter bar (user select, date range, method toggle, status select, CSV export), a desktop table with expandable rows showing JSON request bodies, mobile cards, and pagination.

The backend Audit API is implemented (`GET /api/v1/audit`) from the `add-audit-log` change. The NestJS middleware logs every request to the audit_log table.

## What Changes

- Create `/admin/audit` page at `app/(app)/admin/audit/page.tsx`
- Filter bar: user select dropdown, date range button (placeholder), method toggle (ALL/POST/PATCH/DELETE), status select (All/2xx/4xx/5xx), CSV export button
- Desktop table: timestamp (mono), user (avatar + name), method badge (POST=brand, PATCH=warning, DELETE=destructive), path (mono), status badge (2xx=green, 4xx=yellow, 5xx=red), duration, IP
- Expandable rows: click to show JSON request body in dark code block
- Mobile cards: method + status badges, timestamp, path, user + duration
- Pagination controls
- Wire to backend: `GET /api/v1/audit` with filter query params

## Design Template References

| Design file | What it defines |
|---|---|
| `design-template-app/.../src/routes/admin.audit.tsx` | Full audit page: filter bar (user/date/method/status/export), desktop Table with expandable rows (JSON body), mobile cards, pagination |
| `design-template-app/.../src/components/family/avatar.tsx` | UserAvatar in table rows |
| `design-template-app/.../src/lib/mock-data.ts` | AuditEntry shape: id, timestamp, userId, method, path, status, duration, ip, body? |

## Capabilities

### New Capabilities
- `frontend-admin-audit`: Admin audit log page with filtering, expandable detail rows, and CSV export

### Modified Capabilities
<!-- None -->

## Non-goals

- Real-time log streaming / WebSocket updates
- Date range picker (placeholder button for v1)
- Full-text search within audit entries
- Log retention policy configuration
- Alerting on specific audit events

## Impact

- `app/web/src/app/(app)/admin/audit/page.tsx`: new page
- `app/web/src/lib/api/audit.ts`: TanStack Query hooks for audit log fetching
- Dependencies: `frontend-app-shell` (AppShell, UserAvatar)
- shadcn: Table, Badge, Select, Card (should be available)
- Backend: uses existing `GET /api/v1/audit` endpoint
