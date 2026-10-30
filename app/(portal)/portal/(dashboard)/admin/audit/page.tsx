import { AdminTabs } from "@/components/portal/admin-tabs";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { ROLE_LABELS, type AppRole } from "@/config/portal";
import { getUserWithRole } from "@/lib/auth/dal";
import { listAuthUsers } from "@/lib/auth/users";
import { formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

const ACTION_LABELS: Record<string, string> = {
  role_granted: "Granted role",
  role_revoked: "Revoked role",
  user_created: "Created account",
  user_deactivated: "Deactivated account",
  credit_note_issued: "Issued credit note",
  refund_recorded: "Recorded refund",
  quote_sent: "Finalised quote",
  quote_accepted: "Quote accepted",
  quote_declined: "Quote declined",
  quote_invoiced: "Invoiced quote",
  talent_profile_updated: "Freelancer updated their profile",
  test_task_submitted: "Test task submitted",
  talent_document_uploaded: "Uploaded talent document",
  talent_document_accepted: "Freelancer accepted document",
  freelancer_payment_recorded: "Recorded freelancer payment",
  freelancer_payment_voided: "Voided freelancer payment",
  user_reactivated: "Reactivated account",
};

function metadataSummary(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const role = metadata.role;
  if (typeof role === "string" && role in ROLE_LABELS)
    return ROLE_LABELS[role as AppRole];
  const email = metadata.email;
  return typeof email === "string" ? email : null;
}

export default async function AdminAuditPage() {
  const me = await getUserWithRole(["super_admin"]);
  if (!me) return <NoAccess />;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [{ data: entries }, authUsers] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, created_at, actor_id, action, entity_type, entity_id, metadata")
      .order("created_at", { ascending: false })
      .limit(100),
    listAuthUsers(),
  ]);

  const emailById = new Map((authUsers ?? []).map((u) => [u.id, u.email]));
  const who = (id: string | null) =>
    id ? (emailById.get(id) ?? `${id.slice(0, 8)}…`) : "System";

  return (
    <>
      <PageHeader
        title="Main Admin"
        description="Role changes and account creation, newest first (last 100)."
      />
      <AdminTabs current="/portal/admin/audit" />
      <Panel>
        {entries?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">When</th>
                  <th className="py-2 pr-4 font-medium">Who</th>
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 pr-4 font-medium">Detail</th>
                  <th className="py-2 font-medium">Affected user</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="py-2 pr-4">{who(entry.actor_id)}</td>
                    <td className="py-2 pr-4">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td className="py-2 pr-4">
                      {metadataSummary(entry.metadata) ?? "n/a"}
                    </td>
                    <td className="py-2">{who(entry.entity_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nothing logged yet.</p>
        )}
      </Panel>
    </>
  );
}
