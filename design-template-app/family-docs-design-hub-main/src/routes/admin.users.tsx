import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/family/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserAvatar } from "@/components/family/avatar";
import { users as seed, type MockUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User management — Family Docs" },
      { name: "description", content: "Manage family members and their access roles." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState(seed);
  const [editing, setEditing] = useState<MockUser | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MockUser | null>(null);

  return (
    <AppShell breadcrumbs={["Admin", "User Management"]}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage family members and their access roles
            </p>
          </div>
          <Button
            onClick={() => setEditing("new")}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        </div>

        {/* Desktop table */}
        <Card className="mt-6 hidden overflow-hidden p-0 sm:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface hover:bg-surface">
                <TableHead className="pl-4 text-xs uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Can Restrict</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Created</TableHead>
                <TableHead className="w-32 pr-4 text-right text-xs uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-surface">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={u} size="sm" />
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "ADMIN" ? "default" : "outline"}
                      className={cn(
                        "uppercase tracking-wider",
                        u.role === "ADMIN" && "bg-chart-4/15 text-chart-4 hover:bg-chart-4/20",
                      )}
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.canRestrict ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.createdAgo}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setEditing(u)}
                      className="text-brand"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(u)}
                      className="ml-1 hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Mobile cards */}
        <div className="mt-6 flex flex-col gap-3 sm:hidden">
          {users.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar user={u} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <Badge
                  variant={u.role === "ADMIN" ? "default" : "outline"}
                  className={cn(
                    "uppercase tracking-wider",
                    u.role === "ADMIN" && "bg-chart-4/15 text-chart-4",
                  )}
                >
                  {u.role}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Restrict: {u.canRestrict ? "✓" : "—"} · {u.createdAgo}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setEditing(u)}
                    className="h-auto p-0 text-brand"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(u)}
                    className="h-7 w-7 text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit / Create slide-over */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[400px]">
          <UserForm
            user={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSave={(u) => {
              if (editing === "new") setUsers([...users, { ...u, id: `u${Date.now()}` }]);
              else
                setUsers(users.map((x) => (x.id === (editing as MockUser).id ? { ...x, ...u } : x)));
              setEditing(null);
            }}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name} from Family Docs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will not delete their documents. They will lose access immediately and any active
              sessions will be revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setUsers(users.filter((x) => x.id !== deleteTarget!.id));
                setDeleteTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function UserForm({
  user,
  onCancel,
  onSave,
}: {
  user: MockUser | null;
  onCancel: () => void;
  onSave: (u: MockUser) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<"USER" | "ADMIN">(user?.role ?? "USER");
  const [canRestrict, setCanRestrict] = useState(user?.canRestrict ?? false);

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border p-6">
        <SheetTitle>{user ? "Edit User" : "Create User"}</SheetTitle>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input
            id="pw"
            type="password"
            placeholder={user ? "Leave blank to keep current" : "Set a password"}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            {(["USER", "ADMIN"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-sm px-4 py-1.5 text-sm font-medium",
                  role === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <Card className="flex items-start justify-between gap-3 p-3 shadow-none">
          <div>
            <p className="text-sm font-medium">Can Restrict Documents</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Allows this user to limit document visibility to specific people
            </p>
          </div>
          <Switch checked={canRestrict} onCheckedChange={setCanRestrict} />
        </Card>
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSave({
              id: user?.id ?? "",
              name,
              email,
              initials: name
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "U",
              color: user?.color ?? "bg-brand",
              role,
              canRestrict,
              createdAgo: user?.createdAgo ?? "Just now",
            })
          }
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
