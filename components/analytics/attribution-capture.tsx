"use client";

import { useEffect } from "react";

import { captureAttribution } from "@/lib/attribution";

/** Captures first-touch attribution on landing (lib/attribution.ts). Renders nothing. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
