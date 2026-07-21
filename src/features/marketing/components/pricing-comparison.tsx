"use client";

import { Check, Minus, X } from "lucide-react";
import { FadeIn } from "@/components/common";
import { OFFICIAL_PLAN_SLUGS } from "@/features/subscriptions/lib/official-plan-slugs";
import { PRICING_PAGE } from "../lib/pricing-content";
import type {
  ComparisonCell,
  ComparisonGroup,
} from "../lib/pricing-presentation";
import { cn } from "@/lib/utils";

type PricingComparisonProps = {
  groups: ComparisonGroup[];
  planNames: Record<string, string>;
};

const COLUMNS = [
  OFFICIAL_PLAN_SLUGS.DECOUVERTE,
  OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
  OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
] as const;

function CellValue({ cell }: { cell: ComparisonCell }) {
  if (cell.kind === "yes") {
    return (
      <span className="inline-flex items-center justify-center gap-1 text-[#0f766e]">
        <Check className="size-4" aria-hidden />
        <span className="sr-only">Inclus</span>
      </span>
    );
  }
  if (cell.kind === "no") {
    return (
      <span className="inline-flex items-center justify-center gap-1 text-[#94a3b8]">
        <X className="size-4" aria-hidden />
        <span className="sr-only">Non inclus</span>
      </span>
    );
  }
  if (cell.kind === "limited") {
    return (
      <span className="inline-flex items-center gap-1 text-[0.78rem] font-medium text-[#8a4b1a]">
        <Minus className="size-3.5" aria-hidden />
        {cell.label}
      </span>
    );
  }
  return (
    <span className="text-[0.8rem] font-medium text-[#082b46]">
      {cell.label}
    </span>
  );
}

export function PricingComparison({
  groups,
  planNames,
}: PricingComparisonProps) {
  return (
    <section
      id="comparaison"
      className="scroll-mt-28 bg-[#f7f9fc] py-12 sm:py-16"
      aria-labelledby="pricing-comparison-heading"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-comparison-heading"
            className="font-heading text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2.1rem]"
          >
            {PRICING_PAGE.comparison.title}
          </h2>
          <p className="mt-2 text-[1.02rem] text-[#60758a]">
            {PRICING_PAGE.comparison.subtitle}
          </p>
        </FadeIn>

        {/* Desktop table */}
        <div className="mt-8 hidden overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_12px_40px_rgba(8,43,70,0.06)] lg:block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Comparaison des capacités par forfait Sebavio
            </caption>
            <thead>
              <tr className="border-b border-[#dfe7ef] bg-[#f7f9fc]/80">
                <th
                  scope="col"
                  className="px-5 py-4 text-sm font-semibold text-[#60758a]"
                >
                  Capacité
                </th>
                {COLUMNS.map((slug) => (
                  <th
                    key={slug}
                    scope="col"
                    className={cn(
                      "px-4 py-4 text-center text-sm font-semibold",
                      slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS
                        ? "text-[#3b82f6]"
                        : "text-[#082b46]",
                    )}
                  >
                    {planNames[slug] ?? slug}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <FragmentGroup key={group.id} group={group} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / tablet accordions */}
        <div className="mt-8 space-y-3 lg:hidden">
          {groups.map((group) => (
            <details
              key={group.id}
              className="group rounded-2xl border border-[#dfe7ef] bg-white open:shadow-[0_8px_24px_rgba(8,43,70,0.06)]"
            >
              <summary className="font-heading cursor-pointer list-none px-4 py-3.5 text-base font-semibold text-[#082b46] marker:content-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/45 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {group.title}
                  <span
                    className="text-[#3b82f6] transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <div className="space-y-4 border-t border-[#dfe7ef] px-4 py-4">
                {group.rows.map((row) => (
                  <div key={row.id}>
                    <p className="text-sm font-medium text-[#082b46]">
                      {row.label}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {COLUMNS.map((slug) => (
                        <li
                          key={slug}
                          className="flex items-center justify-between gap-3 rounded-lg bg-[#f7f9fc] px-3 py-2 text-sm"
                        >
                          <span className="text-[#60758a]">
                            {planNames[slug] ?? slug}
                          </span>
                          <CellValue cell={row.cells[slug] ?? { kind: "no" }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FragmentGroup({ group }: { group: ComparisonGroup }) {
  return (
    <>
      <tr className="bg-[#f0f4f8]">
        <th
          colSpan={4}
          scope="colgroup"
          className="px-5 py-2.5 text-xs font-semibold tracking-wide text-[#3b82f6] uppercase"
        >
          {group.title}
        </th>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.id} className="border-t border-[#eef2f6]">
          <th
            scope="row"
            className="px-5 py-3 text-sm font-medium text-[#082b46]"
          >
            {row.label}
          </th>
          {COLUMNS.map((slug) => (
            <td key={slug} className="px-4 py-3 text-center">
              <CellValue cell={row.cells[slug] ?? { kind: "no" }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
