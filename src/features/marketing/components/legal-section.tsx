import type { ReactNode } from "react";

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-heading text-xl font-bold tracking-tight text-[#082b46] sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-[#405466]">
        {children}
      </div>
    </section>
  );
}
