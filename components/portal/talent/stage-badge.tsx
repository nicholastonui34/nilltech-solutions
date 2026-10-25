import { STAGE_LABELS, type TalentStage } from "@/lib/talent/options";
import { cn } from "@/lib/utils";

const styles: Record<TalentStage, string> = {
  applied: "bg-primary/10 text-primary",
  screening: "bg-secondary text-secondary-foreground",
  test_task: "bg-amber-100 text-amber-900",
  test_review: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-muted text-muted-foreground",
};

export function StageBadge({ stage }: { stage: TalentStage }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        styles[stage],
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
