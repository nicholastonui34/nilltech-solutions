/**
 * NillTech's founders (owner, 2026-10-25). Real people only (CLAUDE.md §2).
 * Bios and photos come later: add `bio`, and `photo` as a path under
 * public/ (e.g. "/team/nicholas-tonui.jpg"). Until then /about shows an
 * initials badge and no bio line. Also feeds the Organization schema.
 */
export type Founder = { name: string; role: string; bio?: string; photo?: string };

export const founders: Founder[] = [
  { name: "Nicholas Tonui", role: "Co-founder" },
  { name: "Wendy Achieng", role: "Co-founder" },
  { name: "Fumbwe Hamisi", role: "Co-founder" },
];
