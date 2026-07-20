import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function PlanFormSection({ title, description, children }: Props) {
  return (
    <section className="border-border bg-card flex flex-col gap-4 rounded-lg border p-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
