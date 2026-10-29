import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-border bg-card rounded-xl border p-5", className)}>
      {title ? <h2 className="font-semibold">{title}</h2> : null}
      {description ? (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      ) : null}
      <div className={title || description ? "mt-4" : undefined}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

/** Horizontal bars, server-rendered — no chart library on any page. */
export function BarList({
  rows,
  emptyLabel = "No data yet.",
  alwaysShow = false,
}: {
  // `display` overrides the number shown (e.g. a formatted amount).
  rows: { label: string; value: number; display?: string }[];
  emptyLabel?: string;
  // Show the rows even when every bar is empty (e.g. months at a loss).
  alwaysShow?: boolean;
}) {
  const max = Math.max(0, ...rows.map((row) => row.value));
  if (max === 0 && !alwaysShow) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex justify-between text-sm">
            <span>{row.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {row.display ?? row.value}
            </span>
          </div>
          <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: max ? `${(row.value / max) * 100}%` : 0 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Honest placeholder for a data source that isn't wired up yet. */
export function NotConnected({ title, reason }: { title: string; reason: string }) {
  return (
    <section className="border-border rounded-xl border border-dashed p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{reason}</p>
    </section>
  );
}

export function NoAccess() {
  return (
    <div className="border-border bg-card rounded-xl border p-8 text-center">
      <h1 className="text-lg font-semibold">You don&rsquo;t have access to this page</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Ask a super admin to assign you the right role.
      </p>
    </div>
  );
}
