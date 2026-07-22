import { MountainRoadIllustration } from "./mountain-road-illustration";

type DashboardHeroProps = {
  firstName: string | null;
};

export function DashboardHero({ firstName }: DashboardHeroProps) {
  const greeting = firstName?.trim()
    ? `Bonjour ${firstName.trim()}!`
    : "Bonjour !";

  return (
    <section className="border-client-border bg-client-warm-white relative overflow-hidden rounded-[var(--client-radius)] border p-6 shadow-[var(--client-shadow)] sm:p-8">
      <div className="relative z-10 max-w-xl space-y-2">
        <h1 className="font-heading text-client-night text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting}{" "}
          <span aria-hidden className="inline-block">
            👋
          </span>
        </h1>
        <p className="text-client-text-muted text-sm sm:text-base">
          Prêt pour votre prochaine aventure&nbsp;?
        </p>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] opacity-95 md:block"
        aria-hidden
      >
        <MountainRoadIllustration className="h-full w-full object-cover object-left" />
      </div>
    </section>
  );
}
