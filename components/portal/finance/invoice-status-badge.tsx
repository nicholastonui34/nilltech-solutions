import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/finance/labels";
import { cn } from "@/lib/utils";

const styles: Record<InvoiceStatus | "overdue", string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-primary/10 text-primary",
  partially_paid: "bg-amber-100 text-amber-900",
  paid: "bg-emerald-100 text-emerald-800",
  void: "bg-muted text-muted-foreground line-through",
  overdue: "bg-red-100 text-red-800",
};

export function InvoiceStatusBadge({
  status,
  overdue = false,
}: {
  status: InvoiceStatus;
  overdue?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span
        className={cn(
          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
          styles[status],
        )}
      >
        {INVOICE_STATUS_LABELS[status]}
      </span>
      {overdue ? (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
            styles.overdue,
          )}
        >
          Overdue
        </span>
      ) : null}
    </span>
  );
}
