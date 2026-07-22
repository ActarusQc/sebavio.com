export function DashboardQuote() {
  return (
    <figure className="mx-auto max-w-3xl px-4 py-5 text-center">
      <blockquote className="text-[0.9375rem] leading-relaxed text-white/50 italic sm:text-base">
        « Chaque route commence par une étoile. À vous d’écrire votre histoire.
        »
      </blockquote>
      <div className="mt-3 flex items-center justify-center gap-3" aria-hidden>
        <span className="h-px w-14 bg-white/15 sm:w-20" />
        <span className="text-sm leading-none text-[#f0b64d]">★</span>
        <span className="h-px w-14 bg-white/15 sm:w-20" />
      </div>
    </figure>
  );
}
