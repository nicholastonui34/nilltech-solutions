import type { Database } from "@/lib/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super admin",
  director: "Director",
  finance: "Finance",
  marketing: "Marketing",
  sales: "Sales",
  quality: "Quality",
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
    href: "/portal/analytics",
    label: "Analytics",
    description: "Lead funnel and conversion data.",
    roles: ["director", "marketing", "super_admin"],
  },
];

export function canAccess(userRoles: readonly AppRole[], allowed: readonly AppRole[]) {
  return userRoles.some((role) => allowed.includes(role));
}
