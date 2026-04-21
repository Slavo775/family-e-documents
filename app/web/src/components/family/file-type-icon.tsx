import { FileText, FileImage, FileSpreadsheet, FileType, File as FileIcon } from "lucide-react";
import { cn } from "@family-docs/ui";

export type FileKind = "pdf" | "image" | "doc" | "sheet" | "other";

const map: Record<FileKind, { icon: typeof FileText; bg: string; fg: string }> = {
  pdf: { icon: FileType, bg: "bg-destructive-soft", fg: "text-destructive" },
  image: { icon: FileImage, bg: "bg-chart-4-soft", fg: "text-chart-4" },
  doc: { icon: FileText, bg: "bg-brand-soft", fg: "text-brand" },
  sheet: { icon: FileSpreadsheet, bg: "bg-success-soft", fg: "text-success" },
  other: { icon: FileIcon, bg: "bg-muted", fg: "text-muted-foreground" },
};

export function FileTypeIcon({
  kind,
  size = "md",
  className,
}: {
  kind: FileKind;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const cfg = map[kind];
  const Icon = cfg.icon;
  const dim =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12 rounded-xl" : "h-10 w-10 rounded-lg";
  const iconDim = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        dim,
        cfg.bg,
        className,
      )}
    >
      <Icon className={cn(iconDim, cfg.fg)} />
    </div>
  );
}
