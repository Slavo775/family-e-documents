import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppShellWrapper } from "./app-shell-wrapper";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShellWrapper
      user={{
        name: session.user.name,
        email: session.user.email,
        initials: session.user.name.slice(0, 2).toUpperCase(),
        color: "bg-brand",
      }}
    >
      {children}
    </AppShellWrapper>
  );
}
