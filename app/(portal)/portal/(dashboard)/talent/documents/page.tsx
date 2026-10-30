import { FileDown } from "lucide-react";

import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { AcceptDocumentForm } from "@/components/portal/talent/freelancer-forms";
import { NoTalentProfile } from "@/components/portal/talent/no-profile";
import { TalentTabs } from "@/components/portal/talent/talent-tabs";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatBytes, formatDateTime } from "@/lib/format";
import { documentKindLabel } from "@/lib/talent/labels";
import { getOwnTalentProfile } from "@/lib/talent/own-profile";

export default async function TalentDocumentsPage() {
  const user = await getUserWithRole(["freelancer"]);
  if (!user) return <NoAccess />;
  const { supabase, profile } = await getOwnTalentProfile(user.id);
  if (!supabase || !profile) return <NoTalentProfile />;

  const { data: documents } = await supabase
    .from("talent_documents")
    .select(
      "id, kind, title, size_bytes, requires_acceptance, uploaded_at, accepted_at, accepted_name",
    )
    .eq("talent_id", profile.id)
    .order("uploaded_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Documents"
        description="Contracts, NDAs and letters from NillTech. Read each one before accepting it."
      />
      <TalentTabs current="/portal/talent/documents" stage={profile.stage} />

      <Panel>
        {documents?.length ? (
          <ul className="divide-border divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {documentKindLabel(doc.kind)} · {formatBytes(doc.size_bytes)} ·
                      added {formatDateTime(doc.uploaded_at)}
                    </p>
                  </div>
                  <a
                    href={`/portal/documents/talent/${doc.id}`}
                    target="_blank"
                    rel="noopener"
                    className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                  >
                    <FileDown className="size-4" /> Open PDF
                  </a>
                </div>
                {doc.accepted_at ? (
                  <p className="text-sm text-emerald-800">
                    Accepted by {doc.accepted_name} on {formatDateTime(doc.accepted_at)}.
                  </p>
                ) : doc.requires_acceptance ? (
                  <AcceptDocumentForm documentId={doc.id} fullName={profile.full_name} />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No documents yet.</p>
        )}
      </Panel>
    </>
  );
}
