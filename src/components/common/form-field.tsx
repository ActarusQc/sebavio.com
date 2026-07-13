import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FormFieldProps = {
  /** Identifiant du contrôle associé (htmlFor / id). */
  htmlFor: string;
  /** Libellé accessible du champ. */
  label: string;
  children: ReactNode;
  /** Message d’erreur affiché sous le champ. */
  error?: string;
  /** Texte d’aide optionnel. */
  hint?: string;
  /** Marque le champ comme obligatoire (visuel + aria). */
  required?: boolean;
  className?: string;
};

/**
 * Champ de formulaire accessible : label, contrôle, aide et erreur.
 * Aucune logique métier — rendu uniquement.
 */
export function FormField({
  htmlFor,
  label,
  children,
  error,
  hint,
  required = false,
  className,
}: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      <div
        className="contents"
        {...(describedBy ? { "data-describedby": describedBy } : undefined)}
      >
        {children}
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
