import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/common";
import { Button } from "@/components/ui";
import { BRAND_ASSETS } from "../lib/brand-assets";

export function CtaBanner() {
  return (
    <section className="bg-sebavio-background py-12 sm:py-16">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="from-sebavio-navy to-sebavio-slate relative overflow-hidden rounded-[1.25rem] bg-gradient-to-r px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
            <Image
              src={BRAND_ASSETS.sparkle}
              alt=""
              width={40}
              height={40}
              className="absolute top-6 right-6 size-8 opacity-90 sm:size-10"
              aria-hidden
            />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <div className="mb-3 flex items-center gap-2">
                  <Image
                    src={BRAND_ASSETS.sparkle}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6"
                    aria-hidden
                  />
                  <p className="text-sebavio-gold text-xs font-semibold tracking-wide uppercase">
                    L’étoile qui guide votre route
                  </p>
                </div>
                <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
                  Prêt pour votre prochaine aventure&nbsp;?
                </h2>
                <p className="text-sebavio-sand mt-2 text-sm leading-relaxed sm:text-base">
                  Créez votre compte gratuitement et commencez à planifier des
                  voyages plus simples et plus économiques.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full shrink-0 sm:w-auto"
                render={<Link href="/register" />}
              >
                Commencer gratuitement
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
