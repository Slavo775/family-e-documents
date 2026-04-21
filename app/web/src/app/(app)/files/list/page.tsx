"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Download,
  Edit,
  FolderInput,
  Inbox,
  LayoutGrid,
  List,
  MoreHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from "@family-docs/ui";
import { FileTypeIcon, type FileKind } from "@/components/family/file-type-icon";
import { TagChip } from "@/components/family/tag-chip";
import { UserAvatar } from "@/components/family/user-avatar";
import { DocDetailPanel } from "@/components/family/doc-detail-panel";
import { UploadDialog } from "@/components/family/upload-dialog";
import { useDocuments } from "@/lib/api/documents";
import { formatRelativeDate } from "@/lib/utils/format-date";
import type { DocumentPublic } from "@family-docs/types";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  "Date: Newest first",
  "Date: Oldest first",
  "Name: A → Z",
  "Size: Largest first",
] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

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
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sortDocuments(docs: DocumentPublic[], sort: SortOption): DocumentPublic[] {
  const sorted = [...docs];
  switch (sort) {
    case "Date: Newest first":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "Date: Oldest first":
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "Name: A → Z":
      return sorted.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
    case "Size: Largest first":
      return sorted.sort((a, b) => b.sizeBytes - a.sizeBytes);
  }
}

function FilterBarContent({
  selectedTags,
  allTags,
  toggleTag,
  sort,
  setSort,
}: {
  selectedTags: string[];
  allTags: string[];
  toggleTag: (t: string) => void;
  sort: SortOption;
  setSort: (s: SortOption) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sort
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function FilesListPage() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder") ?? undefined;

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("Date: Newest first");
  const [selectedDoc, setSelectedDoc] = useState<DocumentPublic | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: allDocuments = [], isLoading, isError } = useDocuments(folderId);

  const allTags = Array.from(new Set(allDocuments.flatMap((d) => d.tags))).sort();

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const filtered =
    selectedTags.length === 0
      ? allDocuments
      : allDocuments.filter((d) => selectedTags.some((t) => d.tags.includes(t)));

  const sorted = sortDocuments(filtered, sort);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageDocs = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(currentPage * PAGE_SIZE, sorted.length);

  const gridHref = folderId ? `/files?folder=${folderId}` : "/files";
  const listHref = folderId ? `/files/list?folder=${folderId}` : "/files/list";

  const folderName = allDocuments[0]?.folderName ?? "All Files";

  return (
    <>
      {/* FILTER BAR — desktop */}
      <div className="hidden h-12 items-center gap-3 border-b border-border bg-card px-6 sm:flex">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tags:
          </span>
          {selectedTags.map((t) => (
            <TagChip key={t} label={t} onRemove={() => toggleTag(t)} />
          ))}
          {allTags.filter((t) => !selectedTags.includes(t)).length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent">
                + Add tag
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {allTags
                  .filter((t) => !selectedTags.includes(t))
                  .map((t) => (
                    <DropdownMenuItem key={t} onClick={() => toggleTag(t)}>
                      {t}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
              {sort}
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSort(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            <Link
              href={gridHref}
              className="inline-flex items-center justify-center rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Link>
            <button
              className="inline-flex items-center justify-center rounded-sm bg-brand-soft px-2 py-1 text-foreground"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR — mobile */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              Filters {selectedTags.length > 0 && `(${selectedTags.length})`}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Filter documents</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterBarContent
                selectedTags={selectedTags}
                allTags={allTags}
                toggleTag={toggleTag}
                sort={sort}
                setSort={setSort}
              />
            </div>
          </SheetContent>
        </Sheet>
        <Button
          size="sm"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={() => setUploadOpen(true)}
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <div className="px-4 py-6 sm:px-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {isError && (
          <p className="text-sm text-destructive">Failed to load documents. Please try again.</p>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <div className="mx-auto flex max-w-sm flex-col items-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No documents here yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your first document to start your family library.
            </p>
            <Button
              className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Upload your first document
            </Button>
          </div>
        )}

        {!isLoading && !isError && sorted.length > 0 && (
          <>
            {/* DESKTOP TABLE */}
            <Card className="hidden overflow-hidden p-0 sm:block">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="bg-surface border-b transition-colors hover:bg-surface">
                    <th className="h-10 w-10 pl-4 text-left align-middle font-medium text-muted-foreground"></th>
                    <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Name
                    </th>
                    <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tags
                    </th>
                    <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Size
                    </th>
                    <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Uploaded by
                    </th>
                    <th className="h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="h-10 w-10 pr-4 text-right align-middle font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageDocs.map((doc) => {
                    const uploaderInitials = (() => {
                      const parts = doc.uploadedBy.name.trim().split(" ");
                      return parts.length >= 2
                        ? ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
                        : doc.uploadedBy.name.slice(0, 2).toUpperCase();
                    })();
                    return (
                      <tr
                        key={doc.id}
                        className="group cursor-pointer border-b transition-colors hover:bg-surface"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <td className="pl-4 py-3 align-middle">
                          <FileTypeIcon kind={mimeToKind(doc.mimeType)} size="sm" />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="block max-w-[240px] truncate font-semibold text-foreground">
                            {doc.title || doc.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-wrap items-center gap-1">
                            {doc.tags.slice(0, 2).map((t) => (
                              <TagChip key={t} label={t} />
                            ))}
                            {doc.tags.length > 2 && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                +{doc.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-muted-foreground">
                          {formatBytes(doc.sizeBytes)}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              user={{ initials: uploaderInitials, name: doc.uploadedBy.name, color: "bg-brand" }}
                              size="xs"
                            />
                            <span>{doc.uploadedBy.name}</span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 align-middle text-muted-foreground"
                          title={new Date(doc.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        >
                          {formatRelativeDate(doc.createdAt)}
                        </td>
                        <td
                          className="pr-4 py-3 align-middle text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FolderInput className="mr-2 h-4 w-4" /> Move
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* MOBILE CARD LIST */}
            <div className="flex flex-col gap-2 sm:hidden">
              {pageDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left"
                >
                  <FileTypeIcon kind={mimeToKind(doc.mimeType)} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{doc.title || doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(doc.sizeBytes)} · {formatRelativeDate(doc.createdAt)}
                    </p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
              <span>
                {startIdx}–{endIdx} of {sorted.length} document{sorted.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    className={cn(p === currentPage && "bg-brand-soft")}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultFolderId={folderId}
      />

      <DocDetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </>
  );
}
