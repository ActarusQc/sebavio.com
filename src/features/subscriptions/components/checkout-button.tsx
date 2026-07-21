"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import {
  startPassCheckoutAction,
  startPlusCheckoutAction,
} from "@/features/subscriptions/actions/checkout";

type CheckoutKind = "pass" | "plus";

type CheckoutButtonProps = {
  kind: CheckoutKind;
  label: string;
  returnPath?: string;
  tripId?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
};

export function CheckoutButton({
  kind,
  label,
  returnPath,
  tripId,
  className,
  variant = "default",
  size = "default",
}: CheckoutButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "pass"
          ? await startPassCheckoutAction({ returnPath, tripId })
          : await startPlusCheckoutAction({ returnPath, tripId });

      if (!result.ok) {
        setError(result.message);
        return;
      }
      window.location.assign(result.url);
    });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? "Redirection…" : label}
      </Button>
      {error ? (
        <p className="text-destructive text-center text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
