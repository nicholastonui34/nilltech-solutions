import { BarList, Panel, StatCard } from "@/components/portal/panel";
import { countBy } from "@/lib/leads/stats";
import {
  EVENT_LABELS,
  buttonLabel,
  formLabel,
  getConversionRows,
  type ConversionRow,
} from "@/lib/conversion-stats";

const toBars = (pairs: [string, number][], top = 8) =>
  pairs.slice(0, top).map(([label, value]) => ({ label, value }));

const percent = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : "n/a";

/**
 * Conversion events from the public site (CLAUDE.md §5), last 30 days.
 * `detail` adds the per-button, per-page and per-source breakdowns used on
 * the Marketing page; Analytics shows the funnel only.
 */
export async function ConversionPanels({ detail = false }: { detail?: boolean }) {
  const rows = await getConversionRows(30);
  const count = (event: ConversionRow["event"]) =>
    rows.filter((r) => r.event === event).length;

  const clicks = count("cta_click");
  const started = count("form_start");
  const finished = count("form_submit") + count("booking_complete");

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Clicks and conversions, last 30 days</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Recorded anonymously on the public site: no cookies, no names, no IP addresses.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            "cta_click",
            "form_start",
            "form_submit",
            "booking_complete",
            "whatsapp_click",
            "call_click",
          ] as const
        ).map((event) => (
          <StatCard key={event} label={EVENT_LABELS[event]} value={count(event)} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Funnel"
          description="Button clicks, then forms started (including picking a call time), then forms sent or calls booked."
        >
          <BarList
            rows={[
              { label: "Button clicks", value: clicks },
              {
                label: `Forms started (${percent(started, clicks)} of clicks)`,
                value: started,
              },
              {
                label: `Sent or booked (${percent(finished, started)} of starts)`,
                value: finished,
              },
            ]}
            emptyLabel="No events yet. They appear here as visitors use the site."
          />
        </Panel>
        <Panel title="Completed by form" description="Forms sent and calls booked.">
          <BarList
            rows={toBars(
              countBy(
                rows.filter(
                  (r) => r.event === "form_submit" || r.event === "booking_complete",
                ),
                formLabel,
              ),
            )}
            emptyLabel="Nothing sent yet."
          />
        </Panel>

        {detail ? (
          <>
            <Panel title="Most clicked buttons">
              <BarList
                rows={toBars(
                  countBy(
                    rows.filter((r) => r.event === "cta_click"),
                    buttonLabel,
                  ),
                )}
                emptyLabel="No clicks yet."
              />
            </Panel>
            <Panel
              title="Pages where buttons were clicked"
              description="Which pages send visitors to a quote, a call or a message."
            >
              <BarList
                rows={toBars(
                  countBy(
                    rows.filter((r) => r.event === "cta_click"),
                    (r) => r.path,
                  ),
                )}
                emptyLabel="No clicks yet."
              />
            </Panel>
            <Panel
              title="Conversions by source"
              description="Forms sent and calls booked, by how the visitor arrived: campaign tag, else referring site, else direct."
            >
              <BarList
                rows={toBars(
                  countBy(
                    rows.filter(
                      (r) => r.event === "form_submit" || r.event === "booking_complete",
                    ),
                    (r) => r.source ?? "direct",
                  ),
                )}
                emptyLabel="Nothing sent yet."
              />
            </Panel>
          </>
        ) : null}
      </div>
    </section>
  );
}
