import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateDocumentDto, DocumentListResponse, DocumentPublic, UpdateDocumentDto, UploadInitResponse } from "@family-docs/types";
import { apiFetch } from "@/lib/api";

export function useDocuments(folderId?: string) {
  return useQuery<DocumentPublic[]>({
    queryKey: ["documents", folderId ?? null],
    queryFn: async () => {
      const params = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
      const res = await apiFetch<DocumentListResponse>(`/api/v1/documents${params}`);
      return res.data;
    },
  });
}

export function useDocumentDownloadUrl(id: string | null) {
  return useQuery<{ url: string }>({
    queryKey: ["documents", id, "download-url"],
    queryFn: () => apiFetch<{ url: string }>(`/api/v1/documents/${id}/download-url`),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useCreateDocument() {
  return useMutation({
    mutationFn: (data: CreateDocumentDto) =>
      apiFetch<UploadInitResponse>("/api/v1/documents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useConfirmDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DocumentPublic>(`/api/v1/documents/${id}/confirm`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUpdateDocumentMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentDto }) =>
      apiFetch<DocumentPublic>(`/api/v1/documents/${id}/metadata`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents", id] });
    },
  });
}
