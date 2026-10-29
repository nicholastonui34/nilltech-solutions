"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { CtaButton } from "@/components/cta/cta-button";
import { Container } from "@/components/sections/container";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { primaryNav } from "@/config/nav";
import { siteConfig } from "@/config/site.config";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label={siteConfig.name}>
          <BrandMark size={36} priority />
          <span className="hidden text-sm font-semibold sm:inline">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <CtaButton intent="discovery-call" />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>{siteConfig.name}</SheetTitle>
            <nav aria-label="Primary" className="mt-6 flex flex-col gap-6">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6">
              <CtaButton intent="discovery-call" className="w-full" />
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}
