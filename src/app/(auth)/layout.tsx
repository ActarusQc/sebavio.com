import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS } from "@/features/marketing";
import { NOINDEX_FOLLOW_ROBOTS } from "@/lib/site-url";

export const metadata: Metadata = {
  robots: NOINDEX_FOLLOW_ROBOTS,
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      data-auth-page
      className="relative flex min-h-dvh flex-1 flex-col items-center justify-center bg-gradient-to-b from-[#faf9f6] via-[#f5f7f6] to-[#eef3f3] py-6 text-[#0E2D46] dark:from-[#faf9f6] dark:via-[#f5f7f6] dark:to-[#eef3f3] dark:text-[#0E2D46]"
    >
      <div className="mx-auto flex w-[calc(100%-32px)] max-w-[420px] flex-col justify-center px-6 py-6">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="focus-visible:ring-ring mx-auto mb-3 inline-block focus-visible:ring-2 focus-visible:outline-none"
          >
            <Image
              src={BRAND_ASSETS.logo}
              alt="Sebavia — L’étoile qui guide votre route"
              width={731}
              height={723}
              className="mx-auto h-auto w-[200px] max-w-full"
              sizes="200px"
              priority
              unoptimized
            />
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
