import "server-only";

/**
 * Freelancer ID verification (CLAUDE.md §11). Deferred by owner decision:
 * no vendor is chosen (Persona's cheapest plan is far over budget, §3).
 * Everything talks to this interface, so a real provider drops in later
 * without touching onboarding. We only ever store a provider inquiry ID
 * and status — never ID images.
 */
export type VerificationStatus = "pending_setup" | "pending" | "approved" | "rejected";

export interface IdVerificationProvider {
  readonly configured: boolean;
  startVerification(applicationId: string): Promise<{ inquiryId: string } | null>;
}

class ComingSoonProvider implements IdVerificationProvider {
  readonly configured = false;
  async startVerification() {
    return null;
  }
}

export function getIdVerificationProvider(): IdVerificationProvider {
  return new ComingSoonProvider();
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending_setup: "Coming soon",
  pending: "In progress",
  approved: "Verified",
  rejected: "Not verified",
};
