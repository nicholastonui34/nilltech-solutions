import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { OfferArt, type OfferArtKey } from "@/components/brand/offer-art";
import { cn } from "@/lib/utils";

export type CardAccent = "purple" | "blue" | "gold";

/** A real photo for the card. Takes priority over `art` once one exists. */
export type CardPhoto = { src: string; alt: string };

type ServiceCardProps = {
  title: string;
  description: string;
  href: string;
  // Action-specific link text (CLAUDE.md §5: never a generic "Learn more").
  linkLabel: string;
  /** Brand illustration shown until a photo is supplied. */
  art?: OfferArtKey;
  photo?: CardPhoto;
  accent?: CardAccent;
};

const accentEdge: Record<CardAccent, string> = {
  purple: "border-l-nilltech-purple",
  blue: "border-l-nilltech-blue",
  gold: "border-l-nilltech-gold",
};

/** Cycles accents across a grid so neighbouring cards differ. */
export function accentAt(index: number): CardAccent {
  const order: CardAccent[] = ["purple", "blue", "gold"];
  return order[index % order.length];
}

/**
 * Offer/deliverable card: optional picture on top (a photo, or a brand
 * illustration until photos exist), a coloured brand edge, title, text and
 * an outlined action button. Cards without a picture keep the same edge and
 * button so a grid reads as one set.
 */
export function ServiceCard({
  title,
  description,
  href,
  linkLabel,
  art,
  photo,
  accent = "purple",
}: ServiceCardProps) {
  const hasMedia = Boolean(photo ?? art);

  return (
    <article
      className={cn(
        "bg-card flex h-full flex-col overflow-hidden rounded-2xl border border-l-4 shadow-md transition-shadow hover:shadow-xl",
        accentEdge[accent],
      )}
    >
      {hasMedia ? (
        <div className="relative aspect-[5/3] overflow-hidden">
          {photo ? (
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : art ? (
            <OfferArt art={art} />
          ) : null}
        </div>
      ) : null}
      <div className="flex grow flex-col gap-3 p-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground mb-2 leading-relaxed">{description}</p>
        <Link
          href={href}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-ring mt-auto inline-flex items-center justify-center gap-2 self-center rounded-full border-2 px-6 py-2.5 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
