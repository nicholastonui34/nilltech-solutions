"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

/** A submit button that asks the browser to confirm first, for actions that lock someone out. */
export function ConfirmSubmitButton({
  confirmMessage,
  ...props
}: ComponentProps<typeof Button> & { confirmMessage: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    />
  );
}
