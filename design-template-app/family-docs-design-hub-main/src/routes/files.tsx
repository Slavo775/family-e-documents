import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, List, Upload } from "lucide-react";
import { AppShell } from "@/components/family/app-shell";
import { Button } from "@/components/ui/button";
import { FileTypeIcon } from "@/components/family/file-icon";
import { TagChip } from "@/components/family/tag";
import { UserAvatar } from "@/components/family/avatar";
import { documents, findUser } from "@/lib/mock-data";
import { UploadDialog } from "@/components/family/upload-dialog";
import { DocDetailPanel } from "@/components/family/doc-detail";
import type { MockDoc } from "@/lib/mock-data";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "Files — Family Docs" },
      { name: "description", content: "Browse your family document library." },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const [activeFolder, setActiveFolder] = useState("root");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<MockDoc | null>(null);

  return (
    <AppShell
      breadcrumbs={["Family Documents", "Finance"]}
      activeFolder={activeFolder}
      onSelectFolder={setActiveFolder}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {documents.length} documents · updated today
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
                to="/files/list"
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

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map((doc) => {
            const uploader = findUser(doc.uploaderId);
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="group flex flex-col rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <FileTypeIcon kind={doc.kind} size="lg" />
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
                <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{doc.name}</p>
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
                  <span>{doc.dateAgo}</span>
                  {uploader && (
                    <div className="flex items-center gap-1.5">
                      <UserAvatar user={uploader} size="xs" />
                      <span>{uploader.name}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} folder="Finance" />
      <DocDetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </AppShell>
  );
}
