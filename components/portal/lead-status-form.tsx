import { updateLeadStatus } from "@/app/actions/sales";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { LEAD_STATUSES, STATUS_LABELS, type LeadStatus } from "@/lib/leads/labels";
import { cn } from "@/lib/utils";

/** Plain server-action form — works without client JS. */
export function LeadStatusForm({
  leadId,
  status,
  compact = false,
}: {
  leadId: string;
  status: LeadStatus;
  compact?: boolean;
}) {
  const id = `status-${leadId}`;
  return (
    <form action={updateLeadStatus} className="flex items-center gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <label htmlFor={id} className={compact ? "sr-only" : "text-sm font-medium"}>
        Status
      </label>
      <NativeSelect
        id={id}
        name="status"
        defaultValue={status}
        className={cn("w-auto", compact && "h-8")}
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" variant="outline">
        Save
      </Button>
    </form>
  );
}
