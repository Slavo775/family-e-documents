import { useState, type ReactNode } from "react";
import { ChevronRight, Bell, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FamilySidebar } from "./family-sidebar";
import { UserAvatar } from "./avatar";
import { users } from "@/lib/mock-data";

interface AppShellProps {
  breadcrumbs: string[];
  activeFolder?: string;
  onSelectFolder?: (id: string) => void;
  children: ReactNode;
}

export function AppShell({
  breadcrumbs,
  activeFolder = "root",
  onSelectFolder,
  children,
}: AppShellProps) {
  const [folder, setFolder] = useState(activeFolder);
  const me = users[0];

  return (
    <SidebarProvider>
      <FamilySidebar
        activeFolder={folder}
        onSelectFolder={(id) => {
          setFolder(id);
          onSelectFolder?.(id);
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />

          <nav
            className="flex min-w-0 items-center gap-1.5 text-sm"
            aria-label="Breadcrumb"
          >
            <Link
              to="/files"
              className="hidden truncate font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              {breadcrumbs[0]}
            </Link>
            {breadcrumbs.slice(1).map((b, i) => (
              <span key={i} className="hidden items-center gap-1.5 sm:inline-flex">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate font-medium text-foreground">{b}</span>
              </span>
            ))}
            <span className="font-semibold sm:hidden">
              {breadcrumbs[breadcrumbs.length - 1]}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative hidden w-72 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search documents..." className="h-9 pl-9" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
            </Button>
            <UserAvatar user={me} size="sm" />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
