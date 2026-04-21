import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileType, UploadCloud, X } from "lucide-react";
import { TagChip } from "./tag";
import { cn } from "@/lib/utils";

type Step = "form" | "uploading" | "success";

export function UploadDialog({
  open,
  onOpenChange,
  folder = "Finance",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  folder?: string;
}) {
  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<{ name: string; size: string } | null>({
    name: "annual-report-2024.pdf",
    size: "3.2 MB",
  });
  const [title, setTitle] = useState("Annual Report 2024");
  const [name, setName] = useState("annual-report-2024");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>(["tax", "2024"]);
  const [tagInput, setTagInput] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("form");
        setProgress(0);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (step !== "uploading") return;
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setStep("success");
          return 100;
        }
        return Math.min(100, p + 11);
      });
    }, 220);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(() => onOpenChange(false), 2000);
    return () => clearTimeout(t);
  }, [step, onOpenChange]);

  const addTag = (t: string) => {
    const v = t.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>

            <div
              className={cn(
                "flex h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                file ? "border-border bg-muted/30" : "border-brand/40 bg-brand-soft/40 hover:bg-brand-soft",
              )}
            >
              {file ? (
                <div className="flex items-center gap-3 px-4">
                  <FileType className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
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
                  onClick={() =>
                    setFile({ name: "annual-report-2024.pdf", size: "3.2 MB" })
                  }
                  className="flex flex-col items-center gap-1 text-sm text-muted-foreground"
                >
                  <UploadCloud className="h-7 w-7 text-brand" />
                  <span>Drag &amp; drop your file here or click to browse</span>
                </button>
              )}
            </div>

            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="up-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input id="up-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input id="up-name" value={name} onChange={(e) => setName(e.target.value)} />
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
                    <TagChip key={t} label={t} onRemove={() => setTags(tags.filter((x) => x !== t))} />
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
                <Label htmlFor="up-folder">Folder</Label>
                <select
                  id="up-folder"
                  defaultValue={folder}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option>Family Documents</option>
                  <option>Finance</option>
                  <option>Finance / Tax Returns</option>
                  <option>Finance / Insurance</option>
                  <option>Medical</option>
                  <option>Legal</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={!file}
                onClick={() => setStep("uploading")}
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
              <p className="text-xs text-muted-foreground">{file.size}</p>
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
              <a className="text-sm font-medium text-brand hover:underline" href="#">
                View Document
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep("form");
                  setProgress(0);
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
