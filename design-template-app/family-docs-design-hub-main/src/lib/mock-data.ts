// Shared mock data for the Family Docs prototype.

export type FileKind = "pdf" | "image" | "doc" | "sheet" | "other";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string; // tailwind bg class for avatar
  role: "ADMIN" | "USER";
  canRestrict: boolean;
  createdAgo: string;
}

export interface MockDoc {
  id: string;
  name: string;
  kind: FileKind;
  size: string;
  tags: string[];
  uploaderId: string;
  dateAgo: string;
  dateFull: string;
  status: "ACTIVE" | "PENDING";
  folder: string;
  description?: string;
  restricted?: boolean;
}

export interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
}

export const folderTree: FolderNode[] = [
  {
    id: "root",
    name: "Family Documents",
    children: [
      {
        id: "finance",
        name: "Finance",
        children: [
          { id: "tax", name: "Tax Returns" },
          { id: "insurance", name: "Insurance" },
          { id: "reports", name: "Reports" },
        ],
      },
      { id: "medical", name: "Medical" },
      { id: "legal", name: "Legal" },
      { id: "photos", name: "Photos" },
    ],
  },
];

export const users: MockUser[] = [
  {
    id: "u1",
    name: "Dad",
    email: "dad@family.com",
    initials: "DA",
    color: "bg-brand",
    role: "ADMIN",
    canRestrict: true,
    createdAgo: "2 months ago",
  },
  {
    id: "u2",
    name: "Mom",
    email: "mom@family.com",
    initials: "MO",
    color: "bg-success",
    role: "USER",
    canRestrict: true,
    createdAgo: "2 months ago",
  },
  {
    id: "u3",
    name: "Alice",
    email: "alice@family.com",
    initials: "AL",
    color: "bg-warning",
    role: "USER",
    canRestrict: false,
    createdAgo: "1 month ago",
  },
  {
    id: "u4",
    name: "Ben",
    email: "ben@family.com",
    initials: "BE",
    color: "bg-chart-4",
    role: "USER",
    canRestrict: false,
    createdAgo: "3 weeks ago",
  },
];

export const documents: MockDoc[] = [
  {
    id: "d1",
    name: "annual-report-2024.pdf",
    kind: "pdf",
    size: "3.2 MB",
    tags: ["tax", "2024", "annual"],
    uploaderId: "u1",
    dateAgo: "3 days ago",
    dateFull: "April 17, 2026, 10:24",
    status: "ACTIVE",
    folder: "Finance / Reports",
    description: "Family annual financial summary including investments and tax overview.",
    restricted: false,
  },
  {
    id: "d2",
    name: "tax-return-2023.pdf",
    kind: "pdf",
    size: "1.8 MB",
    tags: ["tax", "2023"],
    uploaderId: "u2",
    dateAgo: "1 week ago",
    dateFull: "April 13, 2026",
    status: "ACTIVE",
    folder: "Finance / Tax Returns",
    restricted: true,
  },
  {
    id: "d3",
    name: "insurance-policy.pdf",
    kind: "pdf",
    size: "942 KB",
    tags: ["insurance", "home"],
    uploaderId: "u1",
    dateAgo: "2 weeks ago",
    dateFull: "April 6, 2026",
    status: "PENDING",
    folder: "Finance / Insurance",
  },
  {
    id: "d4",
    name: "family-photo.jpg",
    kind: "image",
    size: "4.7 MB",
    tags: ["personal"],
    uploaderId: "u3",
    dateAgo: "Yesterday",
    dateFull: "April 19, 2026",
    status: "ACTIVE",
    folder: "Photos",
  },
  {
    id: "d5",
    name: "school-records.docx",
    kind: "doc",
    size: "286 KB",
    tags: ["school", "alice"],
    uploaderId: "u2",
    dateAgo: "5 days ago",
    dateFull: "April 15, 2026",
    status: "ACTIVE",
    folder: "Legal",
  },
  {
    id: "d6",
    name: "household-budget.xlsx",
    kind: "sheet",
    size: "112 KB",
    tags: ["budget", "2026"],
    uploaderId: "u1",
    dateAgo: "Today",
    dateFull: "April 20, 2026, 09:12",
    status: "ACTIVE",
    folder: "Finance",
  },
  {
    id: "d7",
    name: "passport-scan.pdf",
    kind: "pdf",
    size: "510 KB",
    tags: ["legal", "id"],
    uploaderId: "u1",
    dateAgo: "1 month ago",
    dateFull: "March 18, 2026",
    status: "ACTIVE",
    folder: "Legal",
    restricted: true,
  },
  {
    id: "d8",
    name: "vacation-itinerary.pdf",
    kind: "pdf",
    size: "203 KB",
    tags: ["travel", "summer", "2026", "europe"],
    uploaderId: "u4",
    dateAgo: "6 days ago",
    dateFull: "April 14, 2026",
    status: "PENDING",
    folder: "Family Documents",
  },
];

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string | null;
  method: "POST" | "PATCH" | "DELETE" | "GET";
  path: string;
  status: number;
  duration: string;
  ip: string;
  body?: Record<string, unknown>;
}

export const auditEntries: AuditEntry[] = [
  {
    id: "a1",
    timestamp: "Apr 20, 17:32:05",
    userId: "u1",
    method: "POST",
    path: "/api/v1/documents",
    status: 201,
    duration: "124ms",
    ip: "10.0.0.4",
    body: { title: "Household budget", folder: "Finance", password: "***" },
  },
  {
    id: "a2",
    timestamp: "Apr 20, 17:18:51",
    userId: "u2",
    method: "PATCH",
    path: "/api/v1/documents/cm9k...",
    status: 200,
    duration: "62ms",
    ip: "10.0.0.7",
    body: { tags: ["tax", "2024"] },
  },
  {
    id: "a3",
    timestamp: "Apr 20, 16:55:02",
    userId: null,
    method: "POST",
    path: "/api/v1/auth/login",
    status: 401,
    duration: "210ms",
    ip: "82.142.18.5",
    body: { email: "intruder@x.com", password: "***" },
  },
  {
    id: "a4",
    timestamp: "Apr 20, 16:40:13",
    userId: "u1",
    method: "DELETE",
    path: "/api/v1/documents/cm5z...",
    status: 204,
    duration: "88ms",
    ip: "10.0.0.4",
  },
  {
    id: "a5",
    timestamp: "Apr 20, 15:12:44",
    userId: "u3",
    method: "POST",
    path: "/api/v1/folders/finance/permissions",
    status: 403,
    duration: "44ms",
    ip: "10.0.0.11",
    body: { userId: "u4", view: true },
  },
  {
    id: "a6",
    timestamp: "Apr 20, 14:02:09",
    userId: "u2",
    method: "PATCH",
    path: "/api/v1/users/u3",
    status: 200,
    duration: "71ms",
    ip: "10.0.0.7",
    body: { role: "USER", canRestrict: false },
  },
  {
    id: "a7",
    timestamp: "Apr 19, 22:45:33",
    userId: "u1",
    method: "DELETE",
    path: "/api/v1/users/u9",
    status: 500,
    duration: "1.2s",
    ip: "10.0.0.4",
  },
];

export function findUser(id: string | null) {
  if (!id) return null;
  return users.find((u) => u.id === id) ?? null;
}
