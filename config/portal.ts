import type { Database } from "@/lib/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super admin",
  director: "Director",
  investor: "Investor",
  finance: "Finance",
  marketing: "Marketing",
  sales: "Sales",
  quality: "Quality",
  recruitment: "Recruitment",
  freelancer: "Freelancer",
  client: "Client",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as AppRole[];

export type PortalDashboard = {
  href: string;
  label: string;
  description: string;
  roles: readonly AppRole[];
};

/**
 * Phase 4 dashboards (CLAUDE.md §10). Roles here must match the RLS
 * policies on the tables each dashboard reads — the database is the real
 * gate, this list only decides what's shown in the navigation.
 */
export const portalDashboards: readonly PortalDashboard[] = [
  {
    href: "/portal/director",
    label: "Director",
    description: "Revenue, margins, pipeline and the share register, read-only.",
    roles: ["director", "super_admin"],
  },
  {
    href: "/portal/investor",
    label: "Investor",
    description: "Company net worth, profit or loss, and your shareholding.",
    roles: ["investor", "super_admin"],
  },
  {
    href: "/portal/admin",
    label: "Main Admin",
    description: "Users, role assignment, audit log and system health.",
    roles: ["super_admin"],
  },
  {
    href: "/portal/sales",
    label: "Sales",
    description: "Leads, scoring and pipeline stages.",
    roles: ["sales", "super_admin"],
  },
  {
    href: "/portal/marketing",
    label: "Marketing",
    description: "Lead sources, service interest and volume over time.",
    roles: ["marketing", "super_admin"],
  },
  {
    href: "/portal/finance",
    label: "Finance",
    description: "Invoices, receipts, payments and clients.",
    roles: ["finance", "super_admin"],
  },
  {
    href: "/portal/invoices",
    label: "My invoices",
    description: "Your invoices and receipts.",
    roles: ["client"],
  },
  {
    href: "/portal/recruitment",
    label: "Recruitment",
    description: "Applications, screening, test tasks and the talent pool.",
    roles: ["recruitment", "super_admin"],
  },
  {
    href: "/portal/quality",
    label: "Quality",
    description: "Projects, QA checklists, delivery reviews and freelancer performance.",
    roles: ["quality", "super_admin"],
  },
  {
    href: "/portal/talent",
    label: "My profile",
    description: "Your application status, verification and assignments.",
    roles: ["freelancer"],
  },
  {
    href: "/portal/analytics",
    label: "Analytics",
    description: "Lead funnel and conversion data.",
    roles: ["director", "marketing", "super_admin"],
  },
];

export function canAccess(userRoles: readonly AppRole[], allowed: readonly AppRole[]) {
  return userRoles.some((role) => allowed.includes(role));
}
