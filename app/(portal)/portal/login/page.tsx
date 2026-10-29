import { Suspense } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { LoginForm } from "@/components/portal/login-form";
import { siteConfig } from "@/config/site.config";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="border-border bg-card w-full max-w-sm rounded-xl border p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size={44} />
          <div>
            <h1 className="text-lg font-semibold">Team portal</h1>
            <p className="text-muted-foreground text-sm">{siteConfig.name}</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="text-muted-foreground mt-6 text-xs">
          Accounts are created by an administrator. There&rsquo;s no public sign-up.
        </p>
      </div>
    </main>
  );
}
