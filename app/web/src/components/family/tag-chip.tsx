import { cn } from "@family-docs/ui";

const palette = [
  "bg-brand-soft text-brand",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-chart-4-soft text-chart-4",
  "bg-destructive-soft text-destructive",
];

function colorFor(label: string) {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function TagChip({
  label,
  onRemove,
  className,
}: {
  label: string;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colorFor(label),
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="rounded-full opacity-70 hover:opacity-100"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
