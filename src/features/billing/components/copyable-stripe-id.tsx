"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyableStripeId({ value, label, className }: Props) {
  const [copied, setCopied] = useState(false);
  const short =
    value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {label ? (
        <span className="text-muted-foreground text-xs">{label}</span>
      ) : null}
      <code
        className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs"
        title={value}
      >
        {short}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="h-6 px-1.5 text-xs"
        onClick={onCopy}
      >
        {copied ? "Copié" : "Copier"}
      </Button>
    </span>
  );
}
