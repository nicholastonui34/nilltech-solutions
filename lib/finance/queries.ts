import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Clients for pickers, labelled "Company — Contact" when there's a company. */
export async function getClientOptions() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("clients")
    .select("id, name, company")
    .order("company", { ascending: true, nullsFirst: false })
    .order("name");
  return (data ?? []).map((client) => ({
    id: client.id,
    label: client.company ? `${client.company} — ${client.name}` : client.name,
  }));
}
