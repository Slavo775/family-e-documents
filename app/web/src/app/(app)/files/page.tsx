"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, List, Upload } from "lucide-react";
import { Button } from "@family-docs/ui";
import { FileTypeIcon, type FileKind } from "@/components/family/file-type-icon";
import { TagChip } from "@/components/family/tag-chip";
import { UserAvatar } from "@/components/family/user-avatar";
import { useDocuments } from "@/lib/api/documents";
import { formatRelativeDate } from "@/lib/utils/format-date";
import { DocDetailPanel } from "@/components/family/doc-detail-panel";
import { UploadDialog } from "@/components/family/upload-dialog";
import type { DocumentPublic } from "@family-docs/types";

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

function uploaderToAvatar(uploadedBy: DocumentPublic["uploadedBy"]) {
  const parts = uploadedBy.name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
      : uploadedBy.name.slice(0, 2).toUpperCase();
  return { initials, name: uploadedBy.name, color: "bg-brand" };
}

export default function FilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder") ?? undefined;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentPublic | null>(null);

  const { data: documents = [], isLoading, isError } = useDocuments(folderId);

  function handleFolderChange(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("folder", id);
    router.replace(`/files?${params.toString()}`);
  }

  const folderName = documents[0]?.folderName ?? "All Files";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{folderName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            <button
              className="inline-flex items-center justify-center rounded-sm bg-brand-soft px-2 py-1 text-foreground"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <Link
              href={folderId ? `/files/list?folder=${folderId}` : "/files/list"}
              className="inline-flex items-center justify-center rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Link>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {isError && (
        <p className="mt-6 text-sm text-destructive">Failed to load documents. Please try again.</p>
      )}

      {!isLoading && !isError && documents.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No documents in this folder.</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className="group flex flex-col rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <FileTypeIcon kind={mimeToKind(doc.mimeType)} size="lg" />
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                  (doc.status === "ACTIVE"
                    ? "bg-success/15 text-success"
                    : "bg-warning/20 text-foreground")
                }
              >
                {doc.status}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{doc.title || doc.name}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {doc.tags.slice(0, 3).map((t) => (
                <TagChip key={t} label={t} />
              ))}
              {doc.tags.length > 3 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{doc.tags.length - 3}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatRelativeDate(doc.createdAt)}</span>
              <div className="flex items-center gap-1.5">
                <UserAvatar user={uploaderToAvatar(doc.uploadedBy)} size="xs" />
                <span>{doc.uploadedBy.name}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultFolderId={folderId}
      />

      <DocDetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  );
}
