import { useQuery } from "@tanstack/react-query";
import type { AuditLogsResponse } from "@family-docs/types";
import { apiFetch } from "@/lib/api";

interface AuditFilters {
  userId?: string;
  method?: string;
  statusCode?: string;
  page?: number;
  limit?: number;
}

export function useAuditLog(filters: AuditFilters = {}) {
  const params = new URLSearchParams();
  if (filters.userId && filters.userId !== "all") params.set("userId", filters.userId);
  if (filters.method && filters.method !== "ALL") params.set("method", filters.method);
  if (filters.statusCode && filters.statusCode !== "all") {
    // Map "2xx" → min/max status codes via a range filter if supported
    // Pass raw value and let API handle it or filter client-side
    params.set("statusCode", filters.statusCode);
  }
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();

  return useQuery<AuditLogsResponse>({
    queryKey: ["audit", filters],
    queryFn: () => apiFetch<AuditLogsResponse>(`/api/v1/audit${query ? `?${query}` : ""}`),
  });
}
