import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  LogOut,
  ScrollText,
  Shield,
  Users,
  Files as FilesIcon,
  List,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { folderTree, users, type FolderNode } from "@/lib/mock-data";
import { FamilyLogo } from "./logo";
import { UserAvatar } from "./avatar";

const navLinks = [
  { to: "/files", label: "Files", icon: FilesIcon },
  { to: "/files/list", label: "Explorer", icon: List },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/permissions", label: "Permissions", icon: Shield },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
] as const;

interface FolderItemProps {
  node: FolderNode;
  depth: number;
  activeId: string;
  onSelect: (id: string) => void;
}

function FolderItem({ node, depth, activeId, onSelect }: FolderItemProps) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = !!node.children?.length;
  const active = node.id === activeId;
  const Icon = active ? FolderOpen : Folder;

  if (depth === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={active}
          onClick={() => {
            onSelect(node.id);
            if (hasChildren) setOpen(!open);
          }}
          tooltip={node.name}
        >
          <Icon />
          <span>{node.name}</span>
          {hasChildren && (
            <ChevronRight
              className={cn(
                "ml-auto h-3.5 w-3.5 transition-transform",
                open && "rotate-90",
              )}
            />
          )}
        </SidebarMenuButton>
        {hasChildren && open && (
          <SidebarMenuSub>
            {node.children!.map((child) => (
              <NestedFolder
                key={child.id}
                node={child}
                depth={depth + 1}
                activeId={activeId}
                onSelect={onSelect}
              />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }
  return null;
}

function NestedFolder({
  node,
  depth,
  activeId,
  onSelect,
}: FolderItemProps) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = !!node.children?.length;
  const active = node.id === activeId;
  const Icon = active ? FolderOpen : Folder;

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        isActive={active}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) setOpen(!open);
        }}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{node.name}</span>
        {hasChildren && (
          <ChevronRight
            className={cn(
              "ml-auto h-3 w-3 transition-transform",
              open && "rotate-90",
            )}
          />
        )}
      </SidebarMenuSubButton>
      {hasChildren && open && (
        <SidebarMenuSub>
          {node.children!.map((child) => (
            <NestedFolder
              key={child.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
  );
}

interface FamilySidebarProps {
  activeFolder: string;
  onSelectFolder: (id: string) => void;
}

export function FamilySidebar({ activeFolder, onSelectFolder }: FamilySidebarProps) {
  const me = users[0];
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { location } = useRouterState();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div
          className={cn(
            "flex h-10 items-center px-1",
            collapsed ? "justify-center" : "justify-start",
          )}
        >
          <FamilyLogo size="sm" hideText={collapsed} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {folderTree.map((node) => (
                <FolderItem
                  key={node.id}
                  node={node}
                  depth={0}
                  activeId={activeFolder}
                  onSelect={onSelectFolder}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((l) => {
                const isActive = location.pathname.startsWith(l.to);
                const Icon = l.icon;
                return (
                  <SidebarMenuItem key={l.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={l.label}>
                      <Link to={l.to}>
                        <Icon />
                        <span>{l.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={me.name} className="h-auto py-2">
              <UserAvatar user={me} size="sm" />
              {!collapsed && (
                <div className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-sm font-medium">{me.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{me.email}</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sign out">
              <Link to="/login">
                <LogOut />
                <span>Sign out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
