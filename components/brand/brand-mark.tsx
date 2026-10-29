import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  /** Outer diameter in pixels. */
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Circular brand mark: the gradient "N" on a white disc, ringed in the
 * purple-to-blue brand gradient, so it sits cleanly on both light and dark
 * surfaces. Uses public/brand/nilltech-mark.png (the N cropped from the
 * master logo, with the small wordmark left out because it's unreadable at
 * icon sizes). Decorative: callers label the surrounding link or text.
 */
export function BrandMark({ size = 36, className, priority }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "from-nilltech-purple to-nilltech-blue inline-flex shrink-0 rounded-full bg-gradient-to-br p-[2px] shadow-sm",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/nilltech-mark.png"
        alt=""
        width={size}
        height={size}
        priority={priority}
        className="size-full rounded-full bg-white object-cover"
      />
    </span>
  );
}
