import Image from "next/image";

/**
 * Brand illustrations for the six offers (owner, 2026-10-29: custom brand
 * graphics until real photos exist). Static SVGs in public/art/ (~3 KB each),
 * lazy-loaded so they never compete with the hero for LCP; inlining them
 * nearly doubled the home page HTML. No faces, and text only as short
 * labels (the AI Solutions workflow, owner-approved 2026-10-29): they
 * illustrate the offer, they never pose as NillTech's people or clients
 * (CLAUDE.md §2). Decorative, so empty alt; the card title carries meaning.
 *
 * Edit the SVG files directly; colours are the brand tokens from CLAUDE.md §1.
 */

export type OfferArtKey =
  | "services"
  | "ai-solutions"
  | "ai-data-services"
  | "managed-teams"
  | "academy"
  | "partnerships";

export function OfferArt({ art }: { art: OfferArtKey }) {
  return (
    <Image
      src={`/art/${art}.svg`}
      alt=""
      fill
      unoptimized
      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
      className="bg-nilltech-navy object-cover"
    />
  );
}
