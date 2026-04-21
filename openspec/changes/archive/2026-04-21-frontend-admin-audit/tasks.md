## 1. API Hooks

- [x] 1.1 Create `app/web/src/lib/api/audit.ts` with TanStack Query hook `useAuditLog(filters: { userId?, method?, status?, page?, limit? })` calling `GET /api/v1/audit` with query params. Returns `{ entries: AuditEntry[], total: number, page: number }`

## 2. Audit Page

- [x] 2.1 Create `app/web/src/app/(app)/admin/audit/page.tsx` matching `design-template-app/.../src/routes/admin.audit.tsx`:
  - Wrapped in AppShell with breadcrumbs `["Admin", "Audit Log"]`
  - Header: "Audit Log" h1 + "All API activity across Family Docs" subtitle
  - **Filter bar** (Card, shadow-none, flex-wrap): User Select dropdown (All Users + user list from `useUsers()`), "Last 7 days" date button (placeholder), Method segmented toggle (ALL/POST/PATCH/DELETE — custom buttons, not Select), Status Select (All statuses/2xx/4xx/5xx), "Export CSV" ghost button (placeholder, ml-auto)
  - **Desktop table** (hidden sm:block, Card wrapping Table):
    - Columns: Timestamp (mono, text-xs), User (UserAvatar + name, or "System"), Method (Badge with `methodColor` — POST=brand, PATCH=warning, DELETE=destructive), Path (mono, text-xs), Status (Badge with `statusColor` — 2xx=success, 4xx=warning, 5xx=destructive), Duration, IP (mono)
    - Rows clickable → toggle expanded state
    - Expanded row: colSpan=7, `<pre>` with dark bg (bg-foreground text-background) showing `JSON.stringify(body, null, 2)`
  - **Mobile cards** (sm:hidden): each card is a button, shows method+status badges + timestamp top row, path on second row, user + duration on third row. Expanded shows JSON pre block

## 3. Pagination

- [x] 3.1 Add pagination below table/cards: "Showing 1–N of M entries" text, Previous/Next buttons + page number buttons. Wire page number to `useAuditLog({ page })` param

## 4. Verification

- [x] 4.1 Run typecheck and confirm zero errors
