import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Download, Edit, FolderInput, Plus, Trash2 } from "lucide-react";
import { FileTypeIcon } from "./file-icon";
import { TagChip } from "./tag";
import { UserAvatar } from "./avatar";
import { findUser, users, type MockDoc } from "@/lib/mock-data";

export function DocDetailPanel({
  doc,
  onClose,
}: {
  doc: MockDoc | null;
  onClose: () => void;
}) {
  const [restricted, setRestricted] = useState(false);

  if (!doc) return null;
  const uploader = findUser(doc.uploaderId);

  return (
    <Sheet open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-[480px]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <FileTypeIcon kind={doc.kind} size="lg" />
            <div className="min-w-0 flex-1">
              <SheetHeader className="space-y-0">
                <SheetTitle className="truncate text-lg">{doc.name}</SheetTitle>
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

          {/* Quick actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
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
              <Meta label="Folder" value={doc.folder} />
              <Meta label="Size" value={doc.size} />
              <Meta label="Type" value={`application/${doc.kind}`} />
              <Meta
                label="Uploaded by"
                value={
                  uploader && (
                    <span className="flex items-center gap-1.5">
                      <UserAvatar user={uploader} size="xs" />
                      {uploader.name}
                    </span>
                  )
                }
              />
              <Meta label="Created" value={doc.dateFull} />
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
                <TagChip key={t} label={t} onRemove={() => {}} />
              ))}
              <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent">
                <Plus className="h-3 w-3" /> Add tag
              </button>
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
                  {restricted ? "Only allowed users can view" : "Public to all family members"}
                </p>
              </div>
              <Switch checked={restricted} onCheckedChange={setRestricted} />
            </div>
            {restricted && (
              <div className="mt-3 rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Allowed users
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {users.slice(0, 2).map((u) => (
                    <span
                      key={u.id}
                      className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs"
                    >
                      <UserAvatar user={u} size="xs" />
                      {u.name}
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
