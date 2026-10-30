import { redirect } from "next/navigation";

/** The share register moved to the Director area (owner, 2026-10-30). */
export default function OldShareholdersPage() {
  redirect("/portal/director/shareholders");
}
