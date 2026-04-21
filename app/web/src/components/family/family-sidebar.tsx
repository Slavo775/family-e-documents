"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  cn,
} from "@family-docs/ui";
import { FamilyLogo } from "./family-logo";
import { UserAvatar, type AvatarUser } from "./user-avatar";
import type { FolderNode } from "./folder-tree";

const navLinks = [
  { href: "/files", label: "Files", icon: FilesIcon },
  { href: "/files/list", label: "Explorer", icon: List },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/permissions", label: "Permissions", icon: Shield },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
] as const;

// Static placeholder folder tree until API integration
const defaultFolderTree: FolderNode[] = [
  {
    id: "root",
    name: "Family Documents",
    children: [
      {
        id: "finance",
        name: "Finance",
        children: [
          { id: "tax", name: "Tax Returns" },
          { id: "insurance", name: "Insurance" },
          { id: "reports", name: "Reports" },
        ],
      },
      { id: "medical", name: "Medical" },
      { id: "legal", name: "Legal" },
      { id: "photos", name: "Photos" },
    ],
  },
];

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

function NestedFolder({ node, depth, activeId, onSelect }: FolderItemProps) {
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
  user: AvatarUser & { email: string };
}

export function FamilySidebar({ user }: FamilySidebarProps) {
  const [activeFolder, setActiveFolder] = useState("root");
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

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
              {defaultFolderTree.map((node) => (
                <FolderItem
                  key={node.id}
                  node={node}
                  depth={0}
                  activeId={activeFolder}
                  onSelect={setActiveFolder}
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
                const isActive = pathname.startsWith(l.href);
                const Icon = l.icon;
                return (
                  <SidebarMenuItem key={l.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={l.label}>
                      <Link href={l.href}>
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
            <SidebarMenuButton tooltip={user.name} className="h-auto py-2">
              <UserAvatar user={user} size="sm" />
              {!collapsed && (
                <div className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sign out">
              <Link href="/api/auth/signout">
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
