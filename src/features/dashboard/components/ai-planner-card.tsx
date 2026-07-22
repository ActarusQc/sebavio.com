import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function AiPlannerCard() {
  return (
    <section
      aria-labelledby="ai-planner-heading"
      className="from-client-beige via-client-warm-white to-client-turquoise relative flex h-full flex-col overflow-hidden rounded-[var(--client-radius)] bg-gradient-to-br p-6 shadow-[var(--client-shadow)] sm:p-7"
    >
      <div className="relative z-10 flex flex-1 flex-col gap-4">
        <div className="text-client-star flex items-center gap-1" aria-hidden>
          <Sparkles className="size-4" />
          <Sparkles className="size-3 opacity-70" />
          <Sparkles className="size-3.5 opacity-85" />
        </div>
        <div className="space-y-2">
          <h2
            id="ai-planner-heading"
            className="font-heading text-client-night text-xl font-bold tracking-tight sm:text-2xl"
          >
            L’IA à votre service
          </h2>
          <p className="text-client-text-muted max-w-sm text-sm leading-relaxed">
            Obtenez des suggestions personnalisées, des itinéraires optimisés et
            bien plus encore.
          </p>
        </div>
        <Button
          className="bg-client-night hover:bg-client-petrol mt-auto w-full gap-2 border-0 text-white shadow-none sm:w-auto"
          size="lg"
          render={<Link href="/dashboard/ai" />}
        >
          <Sparkles className="size-4" aria-hidden />
          Planifier avec l’IA
        </Button>
      </div>
    </section>
  );
}
