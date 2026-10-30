import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/finance/labels";
import { cn } from "@/lib/utils";

const styles: Record<QuoteStatus | "expired", string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-muted text-muted-foreground",
  expired: "bg-amber-100 text-amber-900",
};

const pill = "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function QuoteStatusBadge({
  status,
  expired = false,
}: {
  status: QuoteStatus;
  expired?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span className={cn(pill, styles[status])}>{QUOTE_STATUS_LABELS[status]}</span>
      {expired ? <span className={cn(pill, styles.expired)}>Expired</span> : null}
    </span>
  );
}
