import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Files,
  LayoutGrid,
  List,
  PanelRightOpen,
  Upload,
  Users,
  Shield,
  ScrollText,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { FamilyLogo } from "@/components/family/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family Docs — Prototype" },
      { name: "description", content: "Design prototype for the Family Docs app." },
      { property: "og:title", content: "Family Docs — Prototype" },
      { property: "og:description", content: "8-screen UI prototype for a private family document vault." },
    ],
  }),
  component: PrototypeIndex,
});

const screens = [
  {
    n: 1,
    to: "/login",
    title: "Login",
    desc: "Centered card, branded sign-in with error state.",
    icon: LogIn,
  },
  {
    n: 2,
    to: "/files",
    title: "Main App Shell",
    desc: "Sidebar, topbar, document grid (4 columns).",
    icon: LayoutGrid,
  },
  {
    n: 3,
    to: "/files/list",
    title: "Document Explorer",
    desc: "List view, filters, tags, pagination, empty state.",
    icon: List,
  },
  {
    n: 4,
    to: "/files",
    title: "Detail Slide-Over",
    desc: "Open from any document card or row.",
    icon: PanelRightOpen,
  },
  {
    n: 5,
    to: "/files",
    title: "Upload Modal",
    desc: "3-step: form → progress → success. Click Upload.",
    icon: Upload,
  },
  {
    n: 6,
    to: "/admin/users",
    title: "Admin · Users",
    desc: "Roles, restrict toggle, edit & delete flows.",
    icon: Users,
  },
  {
    n: 7,
    to: "/admin/permissions",
    title: "Admin · Permissions",
    desc: "Folder picker + per-user VIEW / UPLOAD / DELETE / MANAGE.",
    icon: Shield,
  },
  {
    n: 8,
    to: "/admin/audit",
    title: "Admin · Audit Log",
    desc: "API activity feed, filters, expandable JSON body.",
    icon: ScrollText,
  },
] as const;

function PrototypeIndex() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <FamilyLogo />
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open prototype <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            UI Prototype · 8 screens
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Family Docs design preview
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            A private, secure document vault for families. Explore each screen below — every page
            is designed for both desktop and mobile.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {screens.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.n}
                to={s.to}
                className="group flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Screen {s.n}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <Files className="h-5 w-5 text-brand" />
            <h3 className="font-semibold">Tip</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a static visual prototype with mock data — no real auth or storage.
            Try clicking documents to open the detail panel, or the Upload button to walk through
            the multi-step modal.
          </p>
        </div>
      </main>
    </div>
  );
}
