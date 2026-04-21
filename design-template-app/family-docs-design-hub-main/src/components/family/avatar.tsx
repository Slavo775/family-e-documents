import { cn } from "@/lib/utils";
import type { MockUser } from "@/lib/mock-data";

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<MockUser, "initials" | "color" | "name">;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "xs"
      ? "h-6 w-6 text-[10px]"
      : size === "sm"
        ? "h-7 w-7 text-xs"
        : size === "lg"
          ? "h-10 w-10 text-sm"
          : "h-8 w-8 text-xs";
  return (
    <span
      title={user.name}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shadow-sm",
        user.color,
        dim,
        className,
      )}
    >
      {user.initials}
    </span>
  );
}
