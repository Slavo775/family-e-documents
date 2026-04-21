"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileType, UploadCloud, X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Progress,
  Textarea,
  cn,
} from "@family-docs/ui";
import { TagChip } from "./tag-chip";
import { useCreateDocument, useConfirmDocument } from "@/lib/api/documents";
import { uploadToS3 } from "@/lib/upload-to-s3";
import { apiFetch } from "@/lib/api";
import type { FolderNode } from "@family-docs/types";

type Step = "form" | "uploading" | "success";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDialog({
  open,
  onOpenChange,
  defaultFolderId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultFolderId?: string;
}) {
  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: folders = [] } = useQuery<FolderNode[]>({
    queryKey: ["folders"],
    queryFn: () => apiFetch<FolderNode[]>("/api/v1/folders"),
    enabled: open,
  });

  const createDocument = useCreateDocument();
  const confirmDocument = useConfirmDocument();

  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStep("form");
      setProgress(0);
      setError(null);
      setUploadedDocId(null);
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(() => onOpenChange(false), 2000);
    return () => clearTimeout(t);
  }, [step, onOpenChange]);

  function handleFileSelect(f: File) {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    if (!name)
      setName(
        f.name
          .replace(/\.[^.]+$/, "")
          .toLowerCase()
          .replace(/\s+/g, "-"),
      );
  }

  function addTag(t: string) {
    const v = t.trim();
    if (v && !tags.includes(v)) setTags((prev) => [...prev, v]);
    setTagInput("");
  }

  async function handleUpload() {
    if (!file || !title || !name || !folderId) return;
    setError(null);
    setStep("uploading");
    setProgress(0);

    try {
      const { documentId, uploadUrl } = await createDocument.mutateAsync({
        name,
        title,
        description: description || undefined,
        tags,
        folderId,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      await uploadToS3(uploadUrl, file, (pct) => setProgress(pct));

      await confirmDocument.mutateAsync(documentId);
      setUploadedDocId(documentId);
      setStep("success");
    } catch (err) {
      setStep("form");
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>

            {/* File dropzone */}
            <div
              className={cn(
                "flex h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                file
                  ? "border-border bg-muted/30"
                  : "border-brand/40 bg-brand-soft/40 hover:bg-brand-soft",
              )}
            >
              {file ? (
                <div className="flex items-center gap-3 px-4">
                  <FileType className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-accent"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 text-sm text-muted-foreground"
                >
                  <UploadCloud className="h-7 w-7 text-brand" />
                  <span>Click to browse or drop a file here</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="up-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="up-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Report 2024"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="up-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. annual-report-2024"
                />
                <p className="text-xs text-muted-foreground">
                  Used as unique identifier within this folder
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-desc">Description</Label>
                <Textarea
                  id="up-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5">
                  {tags.map((t) => (
                    <TagChip
                      key={t}
                      label={t}
                      onRemove={() => setTags(tags.filter((x) => x !== t))}
                    />
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add tag and press Enter"
                    className="flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-folder">
                  Folder <span className="text-destructive">*</span>
                </Label>
                <select
                  id="up-folder"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    Select a folder
                  </option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={!file || !title || !name || !folderId}
                onClick={handleUpload}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                Upload
              </Button>
            </div>
          </>
        )}

        {step === "uploading" && file && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-brand-soft">
              <UploadCloud className="h-8 w-8 text-brand" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Progress value={progress} />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Uploading to secure storage...</span>
                <span className="font-medium">{progress}%</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setStep("form");
                setProgress(0);
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {step === "success" && file && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-9 w-9 text-success" />
            </div>
            <h3 className="text-lg font-semibold">Upload Complete!</h3>
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <div className="mt-2 flex items-center gap-3">
              {uploadedDocId ? (
                <a
                  className="text-sm font-medium text-brand hover:underline"
                  href={`/files?doc=${uploadedDocId}`}
                >
                  View Document
                </a>
              ) : (
                <span className="text-sm font-medium text-brand">View Document</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setTitle("");
                  setName("");
                  setDescription("");
                  setTags([]);
                  setProgress(0);
                  setStep("form");
                }}
              >
                Upload Another
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
