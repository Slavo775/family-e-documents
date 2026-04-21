"use client";

import { useState } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Switch,
  cn,
} from "@family-docs/ui";
import { UserAvatar } from "@/components/family/user-avatar";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/lib/api/users";
import { useAuth } from "@/contexts/auth-context";
import { formatRelativeDate } from "@/lib/utils/format-date";
import { ApiError } from "@/lib/api";
import type { UserPublic } from "@family-docs/types";
import { Role } from "@family-docs/types";

function userInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function UserForm({
  user,
  onCancel,
  onSave,
}: {
  user: UserPublic | null;
  onCancel: () => void;
  onSave: (data: {
    name: string;
    email: string;
    password?: string;
    role: Role;
    canRestrictDocs: boolean;
  }) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? Role.USER);
  const [canRestrictDocs, setCanRestrictDocs] = useState(user?.canRestrictDocs ?? false);

  function handleSave() {
    onSave({
      name,
      email,
      password: password || undefined,
      role,
      canRestrictDocs,
    });
  }

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border p-6">
        <SheetTitle>{user ? "Edit User" : "Create User"}</SheetTitle>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <div className="space-y-1.5">
          <Label htmlFor="u-name">Full Name</Label>
          <Input
            id="u-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="u-email">Email</Label>
          <Input
            id="u-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="u-pw">Password</Label>
          <Input
            id="u-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={user ? "Leave blank to keep current" : "Set a password"}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            {([Role.USER, Role.ADMIN] as const).map((r) => (
              <button
                key={r}
                type="button"
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
          <Switch checked={canRestrictDocs} onCheckedChange={setCanRestrictDocs} />
        </Card>
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!name || !email || (!user && !password)}
          onClick={handleSave}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          Save
        </Button>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [editing, setEditing] = useState<UserPublic | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserPublic | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, isError } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  async function handleSave(data: {
    name: string;
    email: string;
    password?: string;
    role: Role;
    canRestrictDocs: boolean;
  }) {
    setFormError(null);
    try {
      if (editing === "new") {
        await createUser.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password!,
          role: data.role,
          canRestrictDocs: data.canRestrictDocs,
        });
      } else if (editing) {
        await updateUser.mutateAsync({
          id: editing.id,
          data: {
            name: data.name,
            email: data.email,
            role: data.role,
            canRestrictDocs: data.canRestrictDocs,
            ...(data.password ? { password: data.password } : {}),
          },
        });
      }
      setEditing(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setFormError("Email already in use");
        else if (err.status === 400) setFormError("Cannot delete/downgrade the last admin");
        else setFormError("An error occurred. Please try again.");
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const body = err.body as { message?: string } | null;
          if (typeof body?.message === "string" && body.message.includes("last admin")) {
            setDeleteError("Cannot delete/downgrade the last admin");
          } else if (typeof body?.message === "string" && body.message.includes("own")) {
            setDeleteError("Cannot delete your own account");
          } else {
            setDeleteError("Cannot delete this user");
          }
        }
      }
    }
  }

  return (
    <>
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

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading users…</p>}
        {isError && (
          <p className="mt-6 text-sm text-destructive">Failed to load users. Please try again.</p>
        )}

        {/* Desktop table */}
        {!isLoading && !isError && (
          <Card className="mt-6 hidden overflow-hidden p-0 sm:block">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="bg-surface border-b transition-colors hover:bg-surface">
                  <th className="h-10 pl-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </th>
                  <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Can Restrict
                  </th>
                  <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Created
                  </th>
                  <th className="h-10 w-32 pr-4 text-right align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b transition-colors hover:bg-surface">
                    <td className="py-3 pl-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          user={{ initials: userInitials(u.name), name: u.name, color: "bg-brand" }}
                          size="sm"
                        />
                        <span className="font-semibold">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 align-middle">
                      <Badge
                        variant={u.role === Role.ADMIN ? "default" : "outline"}
                        className={cn(
                          "uppercase tracking-wider",
                          u.role === Role.ADMIN && "bg-chart-4/15 text-chart-4 hover:bg-chart-4/20",
                        )}
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {u.canRestrictDocs ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-muted-foreground">
                      {formatRelativeDate(u.createdAt)}
                    </td>
                    <td className="py-3 pr-4 text-right align-middle">
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
                        disabled={u.id === currentUser?.id}
                        className="ml-1 hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Mobile cards */}
        {!isLoading && !isError && (
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar
                      user={{ initials: userInitials(u.name), name: u.name, color: "bg-brand" }}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant={u.role === Role.ADMIN ? "default" : "outline"}
                    className={cn(
                      "uppercase tracking-wider",
                      u.role === Role.ADMIN && "bg-chart-4/15 text-chart-4",
                    )}
                  >
                    {u.role}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Restrict: {u.canRestrictDocs ? "✓" : "—"} · {formatRelativeDate(u.createdAt)}
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
                      disabled={u.id === currentUser?.id}
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
        )}
      </div>

      {/* Create/Edit sheet */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[400px]">
          {formError && (
            <p className="mx-6 mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <UserForm
            user={editing === "new" ? null : editing}
            onCancel={() => {
              setEditing(null);
              setFormError(null);
            }}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name} from Family Docs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will not delete their documents. They will lose access immediately and any active
              sessions will be revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteError(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
