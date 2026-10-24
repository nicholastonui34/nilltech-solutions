"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { ctaConfig, type CtaIntent } from "@/config/cta";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type CtaButtonProps = {
  intent: CtaIntent;
  label?: string;
  className?: string;
} & VariantProps<typeof buttonVariants>;

export function CtaButton({ intent, label, className, variant, size }: CtaButtonProps) {
  const cta = ctaConfig[intent];

  const handleClick = () => {
    trackEvent(cta.event, { intent });
  };

  if (cta.external) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(buttonVariants({ variant, size }), className)}
      >
        {label ?? cta.label}
      </a>
    );
  }

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <Link href={cta.href}>{label ?? cta.label}</Link>
    </Button>
  );
}
