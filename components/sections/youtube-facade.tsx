"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Click-to-load YouTube embed (CLAUDE.md §12, §15): shows only a thumbnail
 * until clicked, so no YouTube JS runs on page load and LCP/INP stay
 * clean. Uses youtube-nocookie.com for the player.
 */
export function YoutubeFacade({
  videoId,
  title,
  vertical = false,
}: {
  videoId: string;
  title: string;
  vertical?: boolean;
}) {
  const [active, setActive] = useState(false);
  const aspect = vertical ? "aspect-[9/16]" : "aspect-video";

  if (active) {
    return (
      <div className={cn("overflow-hidden rounded-xl bg-black", aspect)}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl bg-black",
        aspect,
      )}
      aria-label={`Play: ${title}`}
    >
      <Image
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        fill
        unoptimized
        sizes="(min-width: 768px) 720px, 100vw"
        className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-105">
          <Play className="ml-1 size-7" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
