import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateUserDto, UpdateUserDto, UserPublic } from "@family-docs/types";
import { apiFetch } from "@/lib/api";

export function useUsers() {
  return useQuery<UserPublic[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch<UserPublic[]>("/api/v1/users"),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) =>
      apiFetch<UserPublic>("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      apiFetch<UserPublic>(`/api/v1/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
