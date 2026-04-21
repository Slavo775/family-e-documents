import { getSession } from "next-auth/react";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3011";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
    this.name = "ApiError";
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = await getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session) {
    // The token is stored in the JWT — access via the session callback isn't direct,
    // so we use the next-auth session endpoint to get a fresh token
    const tokenRes = await fetch("/api/auth/session");
    const tokenData = await tokenRes.json();
    if (tokenData?.apiToken) {
      headers["Authorization"] = `Bearer ${tokenData.apiToken}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
