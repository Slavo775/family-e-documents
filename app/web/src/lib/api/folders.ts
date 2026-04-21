import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { FolderNode as ApiFolderNode } from "@family-docs/types";
import type { FolderNode as TreeFolderNode } from "@/components/family/folder-tree";

function buildTree(flat: ApiFolderNode[]): TreeFolderNode[] {
  const map = new Map<string, TreeFolderNode & { children: TreeFolderNode[] }>();
  for (const f of flat) {
    map.set(f.id, { id: f.id, name: f.name, children: [] });
  }
  const roots: TreeFolderNode[] = [];
  for (const f of flat) {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function useFolders() {
  return useQuery<ApiFolderNode[]>({
    queryKey: ["folders"],
    queryFn: () => apiFetch<ApiFolderNode[]>("/api/v1/folders"),
  });
}

export function useFolderTree() {
  const { data: flat = [], ...rest } = useFolders();
  return { data: buildTree(flat), flat, ...rest };
}
