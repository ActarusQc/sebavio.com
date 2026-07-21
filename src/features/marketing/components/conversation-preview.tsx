import Image from "next/image";
import { Plus, Send } from "lucide-react";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { LANDING } from "../lib/landing-content";

/** Panneau agent — démonstration HTML, aligné à la carte voyage. */
export function ConversationPreview() {
  const demo = LANDING.conversationDemo;

  return (
    <article
      id="demo-agent"
      className="flex h-full w-full max-w-[21.5rem] flex-col rounded-[1.25rem] border border-[#2a3f5c]/80 bg-[#0c1e38]/95 shadow-[0_28px_50px_rgba(0,0,0,0.5)] backdrop-blur-md"
      aria-label="Démonstration de l’agent conversationnel Sebavio"
    >
      <header className="flex items-center gap-2.5 border-b border-white/10 px-3.5 py-3">
        <span className="relative size-8 overflow-hidden rounded-full ring-1 ring-white/15">
          <Image
            src={BRAND_ASSETS.logoBlanc}
            alt=""
            fill
            className="object-cover object-top"
            sizes="32px"
            aria-hidden
          />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Sebavio</p>
          <p className="text-[0.7rem] text-white/50">Copilote de voyage</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-3.5">
        <div className="ml-3 rounded-2xl rounded-tr-md bg-white/10 px-3 py-2.5 text-[0.78rem] leading-relaxed text-white/90">
          {demo.userMessage}
        </div>

        <div className="mr-1 space-y-2.5">
          <div className="rounded-2xl rounded-tl-md bg-gradient-to-br from-[#1a3358] to-[#2a1f4a] px-3 py-2.5 text-[0.78rem] leading-relaxed text-white/95">
            {demo.assistantMessage}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <div
              className="relative flex h-[5.5rem] items-end bg-gradient-to-br from-[#1e4a5c] via-[#245868] to-[#0e2d46] p-2"
              aria-hidden
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(56,189,248,0.25),transparent_55%)]" />
              <span className="relative rounded bg-black/45 px-1.5 py-0.5 text-[0.6rem] text-white/85">
                Exemple de démonstration
              </span>
            </div>
            <div className="space-y-1 p-3">
              <p className="text-[0.8rem] font-semibold text-white">
                {demo.suggestion.name}
              </p>
              <p className="text-[0.68rem] text-white/50">
                {demo.suggestion.region}
              </p>
              <p className="text-[0.68rem] text-[#2dd4bf]">
                {demo.suggestion.detour}
              </p>
              <p className="text-[0.72rem] leading-snug text-white/65">
                {demo.suggestion.description}
              </p>
              <button
                type="button"
                tabIndex={-1}
                disabled
                className="mt-2.5 inline-flex w-full cursor-default items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-3 py-2.5 text-xs font-semibold text-white"
                aria-label="Ajouter au trajet (démonstration non interactive)"
              >
                <Plus className="size-3.5" aria-hidden />
                Ajouter au trajet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <div
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5"
          aria-hidden
        >
          <span className="flex-1 text-xs text-white/40">
            {demo.inputPlaceholder}
          </span>
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#3b82f6] text-white">
            <Send className="size-3.5" aria-hidden />
          </span>
        </div>
        <p className="sr-only">
          Champ de message illustratif — non actif sur la page publique.
        </p>
      </div>
    </article>
  );
}
