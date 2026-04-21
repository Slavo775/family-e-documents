"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@family-docs/ui";
import { UserAvatar } from "@/components/family/user-avatar";
import { useAuditLog } from "@/lib/api/audit";
import { useUsers } from "@/lib/api/users";
import type { AuditLogEntry } from "@family-docs/types";

const METHODS = ["ALL", "POST", "PATCH", "DELETE"] as const;
type MethodFilter = (typeof METHODS)[number];

const PAGE_SIZE = 20;

function methodColor(m: string) {
  if (m === "POST") return "bg-brand/15 text-brand hover:bg-brand/20";
  if (m === "PATCH") return "bg-warning/25 text-foreground hover:bg-warning/30";
  if (m === "DELETE") return "bg-destructive/15 text-destructive hover:bg-destructive/20";
  return "bg-muted text-muted-foreground";
}

function statusColor(s: number) {
  if (s >= 500) return "bg-destructive/15 text-destructive hover:bg-destructive/20";
  if (s >= 400) return "bg-warning/25 text-foreground hover:bg-warning/30";
  return "bg-success/15 text-success hover:bg-success/20";
}

function userInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuditPage() {
  const [userId, setUserId] = useState("all");
  const [method, setMethod] = useState<MethodFilter>("ALL");
  const [statusCode, setStatusCode] = useState("all");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: users = [] } = useUsers();
  const {
    data: auditData,
    isLoading,
    isError,
  } = useAuditLog({ userId, method, statusCode, page, limit: PAGE_SIZE });

  const entries: AuditLogEntry[] = auditData?.data ?? [];
  const total = auditData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, total);

  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">All API activity across Family Docs</p>
      </div>

      {/* Filter bar */}
      <Card className="mt-6 flex flex-wrap items-center gap-2 p-3 shadow-none">
        <Select value={userId} onValueChange={(v) => { setUserId(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-9">
          Last 7 days <ChevronDown className="h-3.5 w-3.5" />
        </Button>

        <div className="inline-flex rounded-md border border-border bg-background p-0.5">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); setPage(1); }}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
                method === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <Select value={statusCode} onValueChange={(v) => { setStatusCode(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="2xx">2xx</SelectItem>
            <SelectItem value="4xx">4xx</SelectItem>
            <SelectItem value="5xx">5xx</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="ml-auto">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </Card>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      {isError && (
        <p className="mt-4 text-sm text-destructive">Failed to load audit log. Please try again.</p>
      )}

      {/* Desktop table */}
      {!isLoading && !isError && (
        <Card className="mt-4 hidden overflow-hidden p-0 sm:block">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="bg-surface border-b transition-colors hover:bg-surface">
                <th className="h-10 pl-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Timestamp
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Method
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Path
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Duration
                </th>
                <th className="h-10 pr-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const u = e.userId ? userMap.get(e.userId) : null;
                const isOpen = expanded === e.id;
                return (
                  <React.Fragment key={e.id}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                      className="cursor-pointer border-b transition-colors hover:bg-surface"
                    >
                      <td className="py-3 pl-4 align-middle font-mono text-xs">
                        {formatTimestamp(e.timestamp)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {u ? (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar
                              user={{ initials: userInitials(u.name), name: u.name, color: "bg-brand" }}
                              size="xs"
                            />
                            <span>{u.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{e.userName ?? "System"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            methodColor(e.method),
                          )}
                        >
                          {e.method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle font-mono text-xs">{e.path}</td>
                      <td className="px-4 py-3 align-middle">
                        <Badge
                          variant="secondary"
                          className={cn("text-xs font-semibold", statusColor(e.statusCode))}
                        >
                          {e.statusCode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle text-muted-foreground">
                        {e.durationMs}ms
                      </td>
                      <td className="py-3 pr-4 align-middle font-mono text-xs text-muted-foreground">
                        {e.ipAddress}
                      </td>
                    </tr>
                    {isOpen && e.body && (
                      <tr className="border-b bg-surface hover:bg-surface">
                        <td colSpan={7} className="px-4 py-3">
                          <pre className="overflow-x-auto rounded-md bg-foreground p-3 font-mono text-xs text-background">
                            {JSON.stringify(e.body, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No audit entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Mobile cards */}
      {!isLoading && !isError && (
        <div className="mt-4 flex flex-col gap-2 sm:hidden">
          {entries.map((e) => {
            const u = e.userId ? userMap.get(e.userId) : null;
            const isOpen = expanded === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setExpanded(isOpen ? null : e.id)}
                className="rounded-lg border border-border bg-card p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      methodColor(e.method),
                    )}
                  >
                    {e.method}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs font-semibold", statusColor(e.statusCode))}
                  >
                    {e.statusCode}
                  </Badge>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {formatTimestamp(e.timestamp)}
                  </span>
                </div>
                <p className="mt-2 truncate font-mono text-xs">{e.path}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {u ? u.name : (e.userName ?? "System")} · {e.durationMs}ms
                </p>
                {isOpen && e.body && (
                  <pre className="mt-2 overflow-x-auto rounded-md bg-foreground p-3 font-mono text-[10px] text-background">
                    {JSON.stringify(e.body, null, 2)}
                  </pre>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && total > 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>
            Showing {startIdx}–{endIdx} of {total} entries
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={cn(p === page && "bg-brand-soft")}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
