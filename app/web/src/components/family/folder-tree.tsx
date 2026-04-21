"use client";

import { useState } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { cn } from "@family-docs/ui";

export interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
}

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

  return (
    <div>
      <div
        className={cn(
          "group relative flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          active && "bg-brand-soft text-foreground",
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {active && (
          <span
            className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-brand"
            aria-hidden
          />
        )}
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
            />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <button
          onClick={() => onSelect(node.id)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {active ? (
            <FolderOpen className="h-4 w-4 text-brand" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
      </div>
      {hasChildren && open && (
        <div>
          {node.children!.map((child) => (
            <FolderItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  data,
  activeId,
  onSelect,
  className,
}: {
  data: FolderNode[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {data.map((node) => (
        <FolderItem
          key={node.id}
          node={node}
          depth={0}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
