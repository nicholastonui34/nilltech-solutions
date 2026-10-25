import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/actions/auth";
import { PortalNav } from "@/components/portal/portal-nav";
import { Button } from "@/components/ui/button";
import { canAccess, portalDashboards } from "@/config/portal";
import { siteConfig } from "@/config/site.config";
import { requireUser } from "@/lib/auth/dal";

// Every portal page reads the session, so it can't be part of a static
// shell. Opt out of instant-navigation validation for the whole portal
// (see node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md).
export const instant = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-background border-b">
        <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
          <Link href="/portal" className="flex items-center gap-2">
            <Image
              src="/brand/nilltech-logo.jpg"
              alt=""
              width={28}
              height={28}
              className="rounded-sm"
            />
            <span className="text-sm font-semibold">{siteConfig.name} · Portal</span>
          </Link>
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </div>
        <Suspense fallback={<div className="h-11" />}>
          <Navigation />
        </Suspense>
      </header>
      <main className="flex-1 px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function UserMenu() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/portal/account"
        className="text-muted-foreground hover:text-foreground hidden truncate sm:inline"
      >
        {user.fullName ?? user.email}
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}

async function Navigation() {
  const user = await requireUser();
  const items = portalDashboards
    .filter((dashboard) => canAccess(user.roles, dashboard.roles))
    .map(({ href, label }) => ({ href, label }));
  return <PortalNav items={[{ href: "/portal", label: "Overview" }, ...items]} />;
}
