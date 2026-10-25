import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";

import { StatusBadge, TierBadge } from "@/components/portal/lead-badges";
import { LeadStatusForm } from "@/components/portal/lead-status-form";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import {
  budgetLabel,
  regionLabel,
  serviceLabel,
  sourceLabel,
  timelineLabel,
} from "@/lib/leads/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Renders estimator answers stored in leads.metadata as label/value rows. */
function metadataRows(metadata: Json): [string, string][] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  return Object.entries(metadata).flatMap(([key, value]): [string, string][] => {
    if (value === null || value === undefined || value === "") return [];
    const text = Array.isArray(value)
      ? value.join(", ") || "None"
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
    return [[key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), text]];
  });
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserWithRole(["sales", "super_admin"]);
  if (!user) return <NoAccess />;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!lead) notFound();

  const whatsappNumber = lead.phone?.replace(/[^\d]/g, "");

  const details: [string, string][] = [
    ["Received", formatDateTime(lead.created_at)],
    ["Source", sourceLabel(lead.source)],
    ["Interested in", serviceLabel(lead.service_interest)],
    ["Timeline", timelineLabel(lead.timeline_urgency)],
    ["Budget", budgetLabel(lead.budget_band)],
    ["Region", regionLabel(lead.region)],
    ["Company", lead.company ?? "n/a"],
  ];

  return (
    <>
      <Link
        href="/portal/sales"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All leads
      </Link>
      <PageHeader
        title={lead.name}
        description={lead.email}
        actions={
          <div className="flex items-center gap-2">
            <TierBadge tier={lead.tier} />
            <span className="text-muted-foreground text-sm tabular-nums">
              Score {lead.score}
            </span>
            <StatusBadge status={lead.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Panel title="Message">
            {lead.message ? (
              <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                No message. This lead came from an estimator.
              </p>
            )}
          </Panel>

          <Panel title="Details">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[...details, ...metadataRows(lead.metadata)].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-muted-foreground text-xs">{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Pipeline">
            <LeadStatusForm leadId={lead.id} status={lead.status} />
          </Panel>
          <Panel title="Reach out">
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a
                  href={`mailto:${lead.email}`}
                  className="text-primary inline-flex items-center gap-2 hover:underline"
                >
                  <Mail className="size-4" /> {lead.email}
                </a>
              </li>
              {lead.phone ? (
                <li>
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-primary inline-flex items-center gap-2 hover:underline"
                  >
                    <Phone className="size-4" /> {lead.phone}
                  </a>
                </li>
              ) : null}
              {whatsappNumber ? (
                <li>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-2 hover:underline"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                </li>
              ) : null}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
