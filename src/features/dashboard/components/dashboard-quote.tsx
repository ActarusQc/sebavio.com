export function DashboardQuote() {
  return (
    <figure className="mx-auto max-w-3xl px-4 py-5 text-center">
      <blockquote className="text-client-text-muted text-[0.9375rem] leading-relaxed italic sm:text-base">
        « Chaque route commence par une étoile. À vous d’écrire votre histoire.
        »
      </blockquote>
      <div className="mt-3 flex items-center justify-center gap-3" aria-hidden>
        <span className="bg-client-border h-px w-14 sm:w-20" />
        <span className="text-sebavio-gold text-sm leading-none">★</span>
        <span className="bg-client-border h-px w-14 sm:w-20" />
      </div>
    </figure>
  );
}
