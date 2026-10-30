import {
  addShareholder,
  deleteShareholder,
  updateShareholder,
} from "@/app/actions/admin";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/portal/page-header";
import { ShareRegister } from "@/components/portal/share-register";
import { NoAccess, Panel } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { getUserWithRole } from "@/lib/auth/dal";
import { listAuthUsers } from "@/lib/auth/users";
import {
  formatPercent,
  getShareholderOverview,
  ownershipPercent,
} from "@/lib/shareholders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Holder = {
  id: string;
  name: string;
  shares: number;
  holder_type: string;
  user_id: string | null;
  ownership_percent: number | null;
};

function HolderFields({
  holder,
  users,
}: {
  holder?: Holder;
  users: { id: string; email: string }[];
}) {
  const id = holder?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1.5fr_2fr]">
      <div>
        <Label htmlFor={`name-${id}`}>Name</Label>
        <Input
          id={`name-${id}`}
          name="name"
          defaultValue={holder?.name}
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor={`shares-${id}`}>Shares</Label>
        <Input
          id={`shares-${id}`}
          name="shares"
          type="number"
          min={1}
          step={1}
          defaultValue={holder?.shares}
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor={`pct-${id}`}>Registered %</Label>
        <Input
          id={`pct-${id}`}
          name="ownershipPercent"
          inputMode="decimal"
          defaultValue={holder?.ownership_percent ?? ""}
          placeholder="Auto"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor={`type-${id}`}>Type</Label>
        <NativeSelect
          id={`type-${id}`}
          name="holderType"
          defaultValue={holder?.holder_type ?? "investor"}
          className="mt-1.5"
        >
          <option value="director">Director shareholder</option>
          <option value="investor">Investor</option>
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor={`user-${id}`}>Portal login</Label>
        <NativeSelect
          id={`user-${id}`}
          name="userId"
          defaultValue={holder?.user_id ?? ""}
          className="mt-1.5"
        >
          <option value="">Not linked</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

/**
 * Share register (moved here from Main Admin, owner 2026-10-30). Directors
 * see every holder read-only; super admins also edit holdings and link
 * logins. RLS enforces the same split; a trigger audit-logs every change.
 */
export default async function ShareRegisterPage() {
  const user = await getUserWithRole(["director", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;
  const canEdit = user.roles.includes("super_admin");

  const [{ data }, authUsers, overview] = await Promise.all([
    supabase
      .from("shareholders")
      .select("id, name, shares, holder_type, user_id, ownership_percent")
      .order("shares", { ascending: false })
      .order("name"),
    canEdit ? listAuthUsers() : Promise.resolve(null),
    getShareholderOverview(),
  ]);
  const holders = data ?? [];
  const users = (authUsers ?? []).map((u) => ({ id: u.id, email: u.email }));
  const total = holders.reduce((sum, h) => sum + h.shares, 0);
  const pct = (h: Holder) =>
    ownershipPercent({ shares: h.shares, ownershipPercent: h.ownership_percent }, total);
  // Registered percentages should add up to 100; flag it when they don't.
  const pctTotal = holders.reduce((sum, h) => sum + pct(h), 0);
  const pctOff = holders.length > 0 && Math.abs(pctTotal - 100) > 0.005;

  return (
    <>
      <Link
        href="/portal/director"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Director dashboard
      </Link>
      <PageHeader
        title="Share register"
        description="Every shareholder, their shares and ownership. Every change is kept in the audit log."
      />

      <ShareRegister
        holders={holders}
        netWorthKes={overview?.currencies.KES.netWorth ?? 0}
        currentUserId={user.id}
      />

      {canEdit ? (
        <>
          <Panel
            className="mt-6"
            title="Edit holdings"
            description="Registered % is the figure from the company's share register; leave it blank to calculate from share counts. Link each holder to their portal login so My shareholding shows their shares. Investors also need the Investor role and directors the Director role (Main Admin, Users and roles)."
          >
            {pctOff ? (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
              >
                Ownership adds up to {formatPercent(pctTotal)}, not 100%. Check the
                registered percentages.
              </p>
            ) : null}
            {authUsers === null ? (
              <p className="text-muted-foreground mb-4 text-sm">
                SUPABASE_SERVICE_ROLE_KEY isn&rsquo;t set, so portal logins can&rsquo;t be
                listed.
              </p>
            ) : null}
            <ul className="divide-border divide-y">
              {holders.map((holder) => (
                <li key={holder.id} className="py-4">
                  <form action={updateShareholder} className="flex flex-col gap-3">
                    <input type="hidden" name="shareholderId" value={holder.id} />
                    <HolderFields holder={holder} users={users} />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                      <span className="text-muted-foreground text-sm">
                        {formatPercent(pct(holder))} of the company
                      </span>
                    </div>
                  </form>
                  <form action={deleteShareholder} className="mt-2">
                    <input type="hidden" name="shareholderId" value={holder.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                    >
                      Remove {holder.name}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Add a shareholder" className="mt-6">
            <form action={addShareholder} className="flex flex-col gap-3">
              <HolderFields users={users} />
              <div>
                <Button type="submit">Add shareholder</Button>
              </div>
            </form>
          </Panel>
        </>
      ) : null}
    </>
  );
}
