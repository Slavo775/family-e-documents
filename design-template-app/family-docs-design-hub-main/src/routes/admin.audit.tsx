import * as React from "react";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Download } from "lucide-react";
import { AppShell } from "@/components/family/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/family/avatar";
import { auditEntries, findUser, users } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — Family Docs" },
      { name: "description", content: "All API activity across Family Docs." },
    ],
  }),
  component: AuditPage,
});

const METHODS = ["ALL", "POST", "PATCH", "DELETE"] as const;
type MethodFilter = (typeof METHODS)[number];

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

function AuditPage() {
  const [method, setMethod] = useState<MethodFilter>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered =
    method === "ALL" ? auditEntries : auditEntries.filter((e) => e.method === method);

  return (
    <AppShell breadcrumbs={["Admin", "Audit Log"]}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">All API activity across Family Docs</p>
        </div>

        {/* Filter bar */}
        <Card className="mt-6 flex flex-wrap items-center gap-2 p-3 shadow-none">
          <Select defaultValue="all">
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
                onClick={() => setMethod(m)}
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

          <Select defaultValue="all">
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

        {/* DESKTOP TABLE */}
        <Card className="mt-4 hidden overflow-hidden p-0 sm:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface hover:bg-surface">
                <TableHead className="pl-4 text-xs uppercase tracking-wider">Timestamp</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">User</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Method</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Path</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Duration</TableHead>
                <TableHead className="pr-4 text-xs uppercase tracking-wider">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const u = findUser(e.userId);
                const isOpen = expanded === e.id;
                return (
                  <React.Fragment key={e.id}>
                    <TableRow
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                      className="cursor-pointer hover:bg-surface"
                    >
                      <TableCell className="pl-4 font-mono text-xs">{e.timestamp}</TableCell>
                      <TableCell>
                        {u ? (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar user={u} size="xs" />
                            <span>{u.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            methodColor(e.method),
                          )}
                        >
                          {e.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{e.path}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs font-semibold", statusColor(e.status))}
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.duration}</TableCell>
                      <TableCell className="pr-4 font-mono text-xs text-muted-foreground">
                        {e.ip}
                      </TableCell>
                    </TableRow>
                    {isOpen && e.body && (
                      <TableRow className="bg-surface hover:bg-surface">
                        <TableCell colSpan={7} className="px-4 py-3">
                          <pre className="overflow-x-auto rounded-md bg-foreground p-3 font-mono text-xs text-background">
                            {JSON.stringify(e.body, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* MOBILE CARDS */}
        <div className="mt-4 flex flex-col gap-2 sm:hidden">
          {filtered.map((e) => {
            const u = findUser(e.userId);
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
                    className={cn("text-xs font-semibold", statusColor(e.status))}
                  >
                    {e.status}
                  </Badge>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {e.timestamp}
                  </span>
                </div>
                <p className="mt-2 truncate font-mono text-xs">{e.path}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {u ? u.name : "System"} · {e.duration}
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

        <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>Showing 1–{filtered.length} of 1,240 entries</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-brand-soft">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
