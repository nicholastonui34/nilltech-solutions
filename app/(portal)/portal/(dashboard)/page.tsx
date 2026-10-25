import Link from "next/link";

import { PageHeader } from "@/components/portal/page-header";
import { canAccess, portalDashboards, ROLE_LABELS } from "@/config/portal";
import { requireUser } from "@/lib/auth/dal";

export default async function PortalOverviewPage() {
  const user = await requireUser();
  const dashboards = portalDashboards.filter((dashboard) =>
    canAccess(user.roles, dashboard.roles),
  );

  return (
    <>
      <PageHeader
        title={`Welcome${user.fullName ? `, ${user.fullName}` : ""}`}
        description={
          user.roles.length
            ? `Signed in as ${user.email} · ${user.roles.map((role) => ROLE_LABELS[role]).join(", ")}`
            : `Signed in as ${user.email}`
        }
      />
      {dashboards.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {dashboards.map((dashboard) => (
            <li key={dashboard.href}>
              <Link
                href={dashboard.href}
                className="border-border bg-card hover:border-primary block h-full rounded-xl border p-5 transition-colors"
              >
                <h2 className="font-semibold">{dashboard.label}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {dashboard.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-border bg-card rounded-xl border p-8 text-center">
          <h2 className="font-semibold">Your account doesn&rsquo;t have a role yet</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            A super admin needs to assign you a role before any dashboards appear here.
          </p>
        </div>
      )}
    </>
  );
}
