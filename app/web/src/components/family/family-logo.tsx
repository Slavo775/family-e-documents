import { Files } from "lucide-react";
import { cn } from "@family-docs/ui";

export function FamilyLogo({
  size = "md",
  hideText,
  className,
}: {
  size?: "sm" | "md" | "lg";
  hideText?: boolean;
  className?: string;
}) {
  const box =
    size === "lg" ? "h-11 w-11 rounded-xl" : size === "sm" ? "h-7 w-7 rounded-md" : "h-9 w-9 rounded-lg";
  const icon = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const text = size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "text-base";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex items-center justify-center bg-primary text-primary-foreground", box)}>
        <Files className={icon} />
      </div>
      {!hideText && <span className={cn("font-semibold tracking-tight", text)}>Family Docs</span>}
    </div>
  );
}
