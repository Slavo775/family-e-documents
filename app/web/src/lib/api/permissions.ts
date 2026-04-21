import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { FolderPermissionEntry } from "@family-docs/types";

export function useFolderPermissions(folderId: string | null) {
  return useQuery<FolderPermissionEntry[]>({
    queryKey: ["permissions", folderId],
    queryFn: () =>
      apiFetch<FolderPermissionEntry[]>(`/api/v1/folders/${folderId}/permissions`),
    enabled: !!folderId,
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      folderId,
      userId,
      actions,
    }: {
      folderId: string;
      userId: string;
      actions: string[];
    }) =>
      apiFetch(`/api/v1/folders/${folderId}/permissions/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ actions }),
      }),
    onSuccess: (_data, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ["permissions", folderId] });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, userId }: { folderId: string; userId: string }) =>
      apiFetch(`/api/v1/folders/${folderId}/permissions/${userId}`, { method: "DELETE" }),
    onSuccess: (_data, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ["permissions", folderId] });
    },
  });
}
