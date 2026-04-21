import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { AppShell } from "@/components/family/app-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import { FileTypeIcon } from "@/components/family/file-icon";
import { TagChip } from "@/components/family/tag";
import { UserAvatar } from "@/components/family/avatar";
import { documents, findUser } from "@/lib/mock-data";
import { DocDetailPanel } from "@/components/family/doc-detail";
import type { MockDoc } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/files/list")({
  head: () => ({
    meta: [
      { title: "Document explorer — Family Docs" },
      { name: "description", content: "Filter, sort, and manage your documents." },
    ],
  }),
  component: ListView,
});

const ALL_TAGS = ["tax", "2024", "2023", "annual", "insurance", "school", "budget", "travel"];

function FilterBarContent({
  selectedTags,
  toggleTag,
  sort,
  setSort,
}: {
  selectedTags: string[];
  toggleTag: (t: string) => void;
  sort: string;
  setSort: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TAGS.map((t) => {
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
          onChange={(e) => setSort(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option>Date: Newest first</option>
          <option>Date: Oldest first</option>
          <option>Name: A → Z</option>
          <option>Size: Largest first</option>
        </select>
      </div>
    </div>
  );
}

function ListView() {
  const [activeFolder, setActiveFolder] = useState("root");
  const [selectedTags, setSelectedTags] = useState<string[]>(["tax", "2024"]);
  const [sort, setSort] = useState("Date: Newest first");
  const [selected, setSelected] = useState<MockDoc | null>(null);
  const [empty, setEmpty] = useState(false);

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const visible = empty ? [] : documents;

  return (
    <AppShell
      breadcrumbs={["Family Documents", "Finance"]}
      activeFolder={activeFolder}
      onSelectFolder={setActiveFolder}
    >
      {/* FILTER BAR — desktop */}
      <div className="hidden h-12 items-center gap-3 border-b border-border bg-card px-6 sm:flex">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tags:
          </span>
          {selectedTags.map((t) => (
            <TagChip key={t} label={t} onRemove={() => toggleTag(t)} />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent">
              + Add tag
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ALL_TAGS.filter((t) => !selectedTags.includes(t)).map((t) => (
                <DropdownMenuItem key={t} onClick={() => toggleTag(t)}>
                  {t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
              {sort}
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["Date: Newest first", "Date: Oldest first", "Name: A → Z", "Size: Largest first"].map(
                (s) => (
                  <DropdownMenuItem key={s} onClick={() => setSort(s)}>
                    {s}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            <Link
              to="/files"
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

          <button
            onClick={() => setEmpty(!empty)}
            className="rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            title="Toggle empty state"
          >
            {empty ? "Show docs" : "Empty state"}
          </button>
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
                toggleTag={toggleTag}
                sort={sort}
                setSort={setSort}
              />
            </div>
          </SheetContent>
        </Sheet>
        <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <div className="px-4 py-6 sm:px-6">
        {visible.length === 0 ? (
          <div className="mx-auto flex max-w-sm flex-col items-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No documents here yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your first document to start your family library.
            </p>
            <Button className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
              <Upload className="h-4 w-4" />
              Upload your first document
            </Button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <Card className="hidden overflow-hidden p-0 sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface hover:bg-surface">
                    <TableHead className="w-10 pl-4"></TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Tags</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Size</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Uploaded by</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                    <TableHead className="w-10 pr-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((doc) => {
                    const uploader = findUser(doc.uploaderId);
                    return (
                      <TableRow
                        key={doc.id}
                        className="group cursor-pointer hover:bg-surface"
                        onClick={() => setSelected(doc)}
                      >
                        <TableCell className="pl-4">
                          <FileTypeIcon kind={doc.kind} size="sm" />
                        </TableCell>
                        <TableCell>
                          <span className="block max-w-[240px] truncate font-semibold text-foreground">
                            {doc.name}
                          </span>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                        <TableCell>
                          {uploader && (
                            <div className="flex items-center gap-2">
                              <UserAvatar user={uploader} size="xs" />
                              <span>{uploader.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground" title={doc.dateFull}>
                          {doc.dateAgo}
                        </TableCell>
                        <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {/* MOBILE CARD LIST */}
            <div className="flex flex-col gap-2 sm:hidden">
              {visible.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelected(doc)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left"
                >
                  <FileTypeIcon kind={doc.kind} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.size} · {doc.dateAgo}
                    </p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
              <span>1–{visible.length} of 47 documents</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="bg-brand-soft">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <DocDetailPanel doc={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
