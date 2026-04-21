"use client";

import { useState } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@family-docs/ui";
import { FolderTree } from "@/components/family/folder-tree";
import { UserAvatar } from "@/components/family/user-avatar";
import { useFolderTree } from "@/lib/api/folders";
import { useFolderPermissions, useUpdatePermission, useDeletePermission } from "@/lib/api/permissions";
import { useUsers } from "@/lib/api/users";

const PERM_KEYS = ["VIEW", "UPLOAD", "DELETE", "MANAGE"] as const;
type PermKey = (typeof PERM_KEYS)[number];

function userInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function PermissionsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addActions, setAddActions] = useState<PermKey[]>([]);

  const { data: tree, flat: folders, isLoading: foldersLoading } = useFolderTree();
  const { data: permissions = [], isLoading: permsLoading } = useFolderPermissions(
    selectedFolderId || null,
  );
  const { data: allUsers = [] } = useUsers();
  const updatePermission = useUpdatePermission();
  const deletePermission = useDeletePermission();

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  function toggleAction(entry: { userId: string; actions: string[] }, key: PermKey) {
    if (!selectedFolderId) return;
    const current = entry.actions.map((a) => a.toUpperCase());
    const next = current.includes(key)
      ? current.filter((a) => a !== key)
      : [...current, key];
    updatePermission.mutate({ folderId: selectedFolderId, userId: entry.userId, actions: next });
  }

  function handleRemove(userId: string) {
    if (!selectedFolderId) return;
    deletePermission.mutate({ folderId: selectedFolderId, userId });
  }

  async function handleAddSave() {
    if (!selectedFolderId || !addSearch) return;
    const user = allUsers.find(
      (u) => u.name.toLowerCase().includes(addSearch.toLowerCase()) || u.email.toLowerCase().includes(addSearch.toLowerCase()),
    );
    if (!user) return;
    await updatePermission.mutateAsync({ folderId: selectedFolderId, userId: user.id, actions: addActions });
    setAdding(false);
    setAddSearch("");
    setAddActions([]);
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* LEFT — folder picker */}
        <Card className="p-3 shadow-none lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="hidden lg:block">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Folder
            </p>
            {foldersLoading ? (
              <p className="px-2 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <FolderTree
                data={tree}
                activeId={selectedFolderId}
                onSelect={setSelectedFolderId}
              />
            )}
          </div>
          <div className="lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Folder
            </p>
            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Choose a folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* RIGHT — permissions */}
        <section>
          {!selectedFolderId ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Select a folder to manage permissions
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Permissions: {selectedFolder?.name ?? "…"}
                  </h1>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <span>Family Documents</span>
                    {selectedFolder && (
                      <>
                        <ChevronRight className="h-3 w-3" />
                        <span>{selectedFolder.name}</span>
                      </>
                    )}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setAdding(true)}>
                  <Plus className="h-4 w-4" /> Add User
                </Button>
              </div>

              <Card className="mt-6 overflow-x-auto p-0">
                <table className="w-full min-w-[720px] caption-bottom text-sm">
                  <thead>
                    <tr className="bg-surface border-b transition-colors hover:bg-surface">
                      <th className="h-10 pl-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        User
                      </th>
                      {PERM_KEYS.map((k) => (
                        <th
                          key={k}
                          className="h-10 px-4 text-center align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          {k.charAt(0) + k.slice(1).toLowerCase()}
                        </th>
                      ))}
                      <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="h-10 w-12 pr-4 align-middle"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {permsLoading && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                          Loading…
                        </td>
                      </tr>
                    )}

                    {!permsLoading &&
                      permissions.map((entry, i) => {
                        const actions = entry.actions.map((a) => a.toUpperCase());
                        return (
                          <tr
                            key={entry.userId}
                            className="border-b transition-colors hover:bg-surface"
                          >
                            <td className="py-3 pl-4 align-middle">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar
                                  user={{
                                    initials: userInitials(entry.userName),
                                    name: entry.userName,
                                    color: "bg-brand",
                                  }}
                                  size="sm"
                                />
                                <div>
                                  <p className="font-semibold">{entry.userName}</p>
                                </div>
                              </div>
                            </td>
                            {PERM_KEYS.map((k) => (
                              <td key={k} className="px-4 py-3 text-center align-middle">
                                <Checkbox
                                  checked={actions.includes(k)}
                                  onCheckedChange={() => toggleAction(entry, k)}
                                  aria-label={k}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3 align-middle">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  entry.inherited
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-brand-soft text-brand hover:bg-brand-soft",
                                )}
                              >
                                {entry.inherited
                                  ? `Inherited${entry.inheritedFrom ? ` from ${entry.inheritedFrom}` : ""}`
                                  : "Explicit"}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-right align-middle">
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={i === 0}
                                onClick={() => handleRemove(entry.userId)}
                                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}

                    {adding && (
                      <tr className="border-b bg-brand-soft/40 hover:bg-brand-soft/50">
                        <td className="py-3 pl-4 align-middle">
                          <Input
                            autoFocus
                            placeholder="Search users..."
                            className="h-8"
                            value={addSearch}
                            onChange={(e) => setAddSearch(e.target.value)}
                          />
                        </td>
                        {PERM_KEYS.map((k) => (
                          <td key={k} className="px-4 py-3 text-center align-middle">
                            <Checkbox
                              checked={addActions.includes(k)}
                              onCheckedChange={(checked) =>
                                setAddActions((prev) =>
                                  checked ? [...prev, k] : prev.filter((a) => a !== k),
                                )
                              }
                              aria-label={k}
                            />
                          </td>
                        ))}
                        <td colSpan={2} className="py-3 pr-4 text-right align-middle">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAdding(false);
                              setAddSearch("");
                              setAddActions([]);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-brand text-brand-foreground hover:bg-brand/90"
                            onClick={handleAddSave}
                          >
                            Save
                          </Button>
                        </td>
                      </tr>
                    )}

                    {!permsLoading && permissions.length === 0 && !adding && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-sm text-muted-foreground"
                        >
                          No explicit permissions. Users inherit from parent folder.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
