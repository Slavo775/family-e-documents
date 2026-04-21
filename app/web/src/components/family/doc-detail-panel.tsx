"use client";

import { useState } from "react";
import { Download, Edit, FolderInput, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Separator,
  Switch,
  Button,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@family-docs/ui";
import { FileTypeIcon } from "./file-type-icon";
import { TagChip } from "./tag-chip";
import { UserAvatar } from "./user-avatar";
import { useDeleteDocument, useUpdateDocumentMetadata } from "@/lib/api/documents";
import { formatRelativeDate } from "@/lib/utils/format-date";
import type { DocumentPublic } from "@family-docs/types";
import type { FileKind } from "./file-type-icon";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

function mimeToKind(mimeType: string): FileKind {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "doc";
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "sheet";
  return "other";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocDetailPanelProps {
  doc: DocumentPublic | null;
  onClose: () => void;
}

export function DocDetailPanel({ doc, onClose }: DocDetailPanelProps) {
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");

  const deleteMutation = useDeleteDocument();
  const updateMetadata = useUpdateDocumentMetadata();

  const restricted = doc?.visibility === "RESTRICTED";

  if (!doc) return null;

  async function handleDownload() {
    try {
      const { url } = await apiFetch<{ url: string }>(`/api/v1/documents/${doc!.id}/download-url`);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc!.name;
      a.click();
    } catch {
      // silently fail — user sees nothing changed
    }
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(doc!.id);
    setDeleteOpen(false);
    onClose();
  }

  async function handleRemoveTag(tag: string) {
    const tags = doc!.tags.filter((t) => t !== tag);
    updateMetadata.mutate({ id: doc!.id, data: { tags } });
  }

  async function handleAddTag() {
    const trimmed = newTag.trim();
    if (!trimmed || doc!.tags.includes(trimmed)) {
      setNewTag("");
      setAddingTag(false);
      return;
    }
    updateMetadata.mutate({ id: doc!.id, data: { tags: [...doc!.tags, trimmed] } });
    setNewTag("");
    setAddingTag(false);
  }

  async function handleVisibilityToggle(checked: boolean) {
    updateMetadata.mutate({
      id: doc!.id,
      data: { visibility: checked ? "RESTRICTED" : "PUBLIC" },
    });
  }

  return (
    <>
      <Sheet open={!!doc} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[480px]">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 border-b border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <FileTypeIcon kind={mimeToKind(doc.mimeType)} size="lg" />
              <div className="min-w-0 flex-1">
                <SheetHeader className="space-y-0">
                  <SheetTitle className="truncate text-lg">{doc.title || doc.name}</SheetTitle>
                </SheetHeader>
                <span
                  className={
                    "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                    (doc.status === "ACTIVE"
                      ? "bg-success/15 text-success"
                      : "bg-warning/20 text-foreground")
                  }
                >
                  {doc.status}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm">
                <FolderInput className="h-4 w-4" /> Move
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Metadata */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Metadata
              </h4>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Meta label="Name" value={doc.name} />
                <Meta label="Folder" value={doc.folderName} />
                <Meta label="Size" value={formatBytes(doc.sizeBytes)} />
                <Meta label="Type" value={doc.mimeType} />
                <Meta
                  label="Uploaded by"
                  value={
                    <span className="flex items-center gap-1.5">
                      <UserAvatar
                        user={{
                          initials: doc.uploadedBy.name.slice(0, 2).toUpperCase(),
                          name: doc.uploadedBy.name,
                          color: "bg-brand",
                        }}
                        size="xs"
                      />
                      {doc.uploadedBy.name}
                    </span>
                  }
                />
                <Meta label="Created" value={formatRelativeDate(doc.createdAt)} />
              </dl>
            </section>

            <Separator className="my-6" />

            {/* Tags */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </h4>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {doc.tags.map((t) => (
                  <TagChip key={t} label={t} onRemove={() => handleRemoveTag(t)} />
                ))}
                {addingTag ? (
                  <input
                    autoFocus
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTag();
                      if (e.key === "Escape") { setAddingTag(false); setNewTag(""); }
                    }}
                    onBlur={handleAddTag}
                    placeholder="tag name"
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                ) : (
                  <button
                    onClick={() => setAddingTag(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                  >
                    <Plus className="h-3 w-3" /> Add tag
                  </button>
                )}
              </div>
            </section>

            <Separator className="my-6" />

            {/* Visibility */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visibility
              </h4>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Restricted Access</p>
                  <p className="text-xs text-muted-foreground">
                    {restricted
                      ? "Only allowed users can view"
                      : "Public to all family members"}
                  </p>
                </div>
                <Switch
                  checked={restricted}
                  onCheckedChange={handleVisibilityToggle}
                  disabled={!user?.canRestrictDocs}
                />
              </div>
              {restricted && doc.allowedUserIds.length > 0 && (
                <div className="mt-3 rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Allowed users
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {doc.allowedUserIds.map((uid) => (
                      <span
                        key={uid}
                        className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs"
                      >
                        <UserAvatar
                          user={{ initials: uid.slice(0, 2).toUpperCase(), name: uid, color: "bg-muted-foreground" }}
                          size="xs"
                        />
                        {uid}
                      </span>
                    ))}
                    <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                </div>
              )}
            </section>

            <Separator className="my-6" />

            {/* Description */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h4>
              <p className="mt-3 text-sm italic text-muted-foreground">
                {doc.description ?? "No description"}
              </p>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              "{doc.title || doc.name}" will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
