import Link from "next/link";

/** Notice at the point of collection (Data Protection Act, 2019, s. 29). */
export function PrivacyLine({ purpose }: { purpose: string }) {
  return (
    <p className="text-muted-foreground text-xs">
      We use these details {purpose}. See our{" "}
      <Link href="/legal#privacy" className="text-primary underline underline-offset-2">
        privacy notice
      </Link>{" "}
      for how we handle your data and your rights.
    </p>
  );
}
