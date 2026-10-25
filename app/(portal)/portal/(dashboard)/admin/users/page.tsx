import { X } from "lucide-react";

import { grantRole, revokeRole } from "@/app/actions/admin";
import { AdminTabs } from "@/components/portal/admin-tabs";
import { CreateUserForm } from "@/components/portal/create-user-form";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ALL_ROLES, ROLE_LABELS, type AppRole } from "@/config/portal";
import { getUserWithRole } from "@/lib/auth/dal";
import { listAuthUsers } from "@/lib/auth/users";
import { formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const me = await getUserWithRole(["super_admin"]);
  if (!me) return <NoAccess />;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [authUsers, { data: roleRows }, { data: profiles }] = await Promise.all([
    listAuthUsers(),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of roleRows ?? []) {
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role]);
  }
  const namesById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <>
      <PageHeader
        title="Main Admin"
        description="Invite people, then grant or revoke roles. Every change is audit-logged."
      />
      <AdminTabs current="/portal/admin/users" />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title="Users">
          {authUsers === null ? (
            <p className="text-muted-foreground text-sm">
              SUPABASE_SERVICE_ROLE_KEY isn&rsquo;t set on this deployment, so user emails
              can&rsquo;t be listed.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {authUsers.map((user) => {
                const roles = rolesByUser.get(user.id) ?? [];
                const grantable = ALL_ROLES.filter((role) => !roles.includes(role));
                return (
                  <li key={user.id} className="py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {namesById.get(user.id) ?? user.email}
                          {user.id === me.id ? (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {user.email} · last sign-in {formatDateTime(user.lastSignInAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {roles.length ? (
                        roles.map((role) => {
                          const locked = user.id === me.id && role === "super_admin";
                          return (
                            <span
                              key={role}
                              className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs font-medium"
                            >
                              {ROLE_LABELS[role]}
                              {locked ? (
                                <span className="w-1" />
                              ) : (
                                <form action={revokeRole}>
                                  <input type="hidden" name="userId" value={user.id} />
                                  <input type="hidden" name="role" value={role} />
                                  <button
                                    type="submit"
                                    className="hover:bg-background/60 rounded-full p-0.5"
                                    aria-label={`Revoke ${ROLE_LABELS[role]} from ${user.email}`}
                                  >
                                    <X className="size-3" />
                                  </button>
                                </form>
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground text-xs">No roles</span>
                      )}

                      {grantable.length ? (
                        <form action={grantRole} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={user.id} />
                          <label htmlFor={`role-${user.id}`} className="sr-only">
                            Role to grant {user.email}
                          </label>
                          <NativeSelect
                            id={`role-${user.id}`}
                            name="role"
                            className="h-8 w-auto"
                            defaultValue={grantable[0]}
                          >
                            {grantable.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </NativeSelect>
                          <Button type="submit" size="sm" variant="outline">
                            Grant
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Add a user"
          description="Creates the account with a one-time temporary password for you to share privately."
        >
          <CreateUserForm />
        </Panel>
      </div>
    </>
  );
}
