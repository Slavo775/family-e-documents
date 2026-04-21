import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/family/app-shell";
import { FolderTree } from "@/components/family/folder-tree";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/family/avatar";
import { users, type MockUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/permissions")({
  head: () => ({
    meta: [
      { title: "Folder permissions — Family Docs" },
      { name: "description", content: "Control who can view, upload, and manage documents." },
    ],
  }),
  component: PermissionsPage,
});

interface PermRow {
  user: MockUser;
  view: boolean;
  upload: boolean;
  delete: boolean;
  manage: boolean;
  status: "Explicit" | "Inherited";
  inheritedFrom?: string;
}

const initialRows: PermRow[] = [
  { user: users[0], view: true, upload: true, delete: true, manage: true, status: "Explicit" },
  {
    user: users[1],
    view: true,
    upload: true,
    delete: false,
    manage: false,
    status: "Inherited",
    inheritedFrom: "/Family Documents",
  },
  {
    user: users[2],
    view: true,
    upload: false,
    delete: false,
    manage: false,
    status: "Inherited",
    inheritedFrom: "/Family Documents",
  },
];

function PermissionsPage() {
  const [activeFolder, setActiveFolder] = useState("finance");
  const [rows, setRows] = useState<PermRow[]>(initialRows);
  const [adding, setAdding] = useState(false);

  const toggle = (i: number, k: keyof PermRow) =>
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === i ? { ...r, [k]: !r[k as keyof PermRow], status: "Explicit" } : r,
      ),
    );

  return (
    <AppShell breadcrumbs={["Admin", "Permissions"]}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* LEFT — folder picker */}
          <Card className="p-3 shadow-none lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="hidden lg:block">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Folder
              </p>
              <FolderTree activeId={activeFolder} onSelect={setActiveFolder} />
            </div>
            <div className="lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Folder
              </p>
              <Select value={activeFolder} onValueChange={setActiveFolder}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Family Documents</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="tax">Finance / Tax Returns</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* RIGHT — permissions */}
          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Permissions: Finance</h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <span>Family Documents</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>Finance</span>
                </p>
              </div>
              <Button variant="outline" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </div>

            <Card className="mt-6 overflow-x-auto p-0">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="bg-surface hover:bg-surface">
                    <TableHead className="pl-4 text-xs uppercase tracking-wider">User</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider">View</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider">Upload</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider">Delete</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider">Manage</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="w-12 pr-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.user.id} className="hover:bg-surface">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={r.user} size="sm" />
                          <div>
                            <p className="font-semibold">{r.user.name}</p>
                            <p className="text-xs text-muted-foreground">{r.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      {(["view", "upload", "delete", "manage"] as const).map((k) => (
                        <TableCell key={k} className="text-center">
                          <Checkbox
                            checked={r[k]}
                            onCheckedChange={() => toggle(i, k)}
                            aria-label={k}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            r.status === "Explicit"
                              ? "bg-brand-soft text-brand hover:bg-brand-soft"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {r.status === "Inherited"
                            ? `Inherited from ${r.inheritedFrom}`
                            : "Explicit"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={i === 0}
                          onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {adding && (
                    <TableRow className="bg-brand-soft/40 hover:bg-brand-soft/50">
                      <TableCell className="pl-4">
                        <Input
                          autoFocus
                          placeholder="Search users..."
                          className="h-8"
                        />
                      </TableCell>
                      {(["view", "upload", "delete", "manage"] as const).map((k) => (
                        <TableCell key={k} className="text-center">
                          <Checkbox aria-label={k} />
                        </TableCell>
                      ))}
                      <TableCell colSpan={2} className="pr-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-brand text-brand-foreground hover:bg-brand/90"
                          onClick={() => setAdding(false)}
                        >
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}

                  {rows.length === 0 && !adding && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        No explicit permissions. Users inherit from parent folder.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
