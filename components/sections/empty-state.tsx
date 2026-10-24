export function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-border rounded-lg border border-dashed py-16 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
