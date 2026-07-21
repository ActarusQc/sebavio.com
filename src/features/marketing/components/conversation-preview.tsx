import { Plus, Send } from "lucide-react";
import { LANDING } from "../lib/landing-content";
import { BRAND_ASSETS } from "../lib/brand-assets";
import Image from "next/image";

/** Panneau agent conversationnel — démonstration non interactive. */
export function ConversationPreview() {
  const demo = LANDING.conversationDemo;

  return (
    <article
      id="demo-agent"
      className="bg-sebavio-night-elevated/85 flex w-full max-w-[20rem] flex-col rounded-2xl border border-white/12 shadow-lg backdrop-blur-md"
      aria-label="Démonstration de l’agent conversationnel Sebavio"
    >
      <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <span className="relative size-7 overflow-hidden rounded-full">
          <Image
            src={BRAND_ASSETS.logoBlanc}
            alt=""
            fill
            className="object-cover object-top"
            sizes="28px"
            aria-hidden
          />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">
            Sebavio · Copilote de voyage
          </p>
          <p className="text-[0.65rem] text-white/50">Démonstration</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="ml-4 rounded-2xl rounded-tr-sm bg-white/10 px-3 py-2 text-xs leading-relaxed text-white/90">
          {demo.userMessage}
        </div>

        <div className="mr-2 space-y-2">
          <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-[#1e3a5f]/80 to-[#2a1f4a]/80 px-3 py-2 text-xs leading-relaxed text-white/95">
            {demo.assistantMessage}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <div className="from-sebavio-slate/50 to-sebavio-navy flex h-20 items-end bg-gradient-to-br p-2">
              <span className="rounded bg-black/40 px-1.5 py-0.5 text-[0.6rem] text-white/80">
                Exemple de démonstration
              </span>
            </div>
            <div className="space-y-1 p-2.5">
              <p className="text-xs font-semibold text-white">
                {demo.suggestion.name}
              </p>
              <p className="text-[0.65rem] text-white/55">
                {demo.suggestion.region}
              </p>
              <p className="text-sebavio-teal text-[0.65rem]">
                {demo.suggestion.detour}
              </p>
              <p className="text-[0.7rem] leading-snug text-white/70">
                {demo.suggestion.description}
              </p>
              <button
                type="button"
                tabIndex={-1}
                disabled
                className="from-sebavio-gradient-from to-sebavio-gradient-to mt-2 inline-flex w-full cursor-default items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r px-3 py-2 text-xs font-semibold text-white opacity-90"
                aria-label="Ajouter au trajet (démonstration non interactive)"
              >
                <Plus className="size-3.5" aria-hidden />
                Ajouter au trajet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-2.5">
        <div
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
          aria-hidden
        >
          <span className="flex-1 text-xs text-white/40">
            {demo.inputPlaceholder}
          </span>
          <span className="bg-sebavio-gradient-from/90 inline-flex size-7 items-center justify-center rounded-full text-white">
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
