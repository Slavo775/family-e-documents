"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import { AppShell } from "@/components/family/app-shell";
import type { AvatarUser } from "@/components/family/user-avatar";

interface AppShellWrapperProps {
  user: AvatarUser & { email: string };
  children: ReactNode;
}

export function AppShellWrapper({ user, children }: AppShellWrapperProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppShell breadcrumbs={["Family Docs"]} user={user}>
          {children}
        </AppShell>
      </AuthProvider>
    </QueryProvider>
  );
}
