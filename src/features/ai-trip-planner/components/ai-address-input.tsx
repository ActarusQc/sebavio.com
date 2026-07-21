"use client";

import { useState } from "react";
import { Home, MapPin } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import type { AddressSelection } from "@/types/address";
import type { OriginSuggestionDto } from "@/features/ai-trip-planner/types";
import { Button } from "@/components/ui/button";

type Props = {
  field: "origin" | "destination";
  placeholder?: string | null;
  homeCity?: string | null;
  suggestions?: OriginSuggestionDto[];
  disabled?: boolean;
  onSelectAddress: (address: AddressSelection) => void;
  onUseHome?: () => void;
  onQuickCity?: (label: string) => void;
};

export function AIAddressInput({
  field,
  placeholder,
  homeCity,
  suggestions = [],
  disabled,
  onSelectAddress,
  onUseHome,
  onQuickCity,
}: Props) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-[#e4ebf2] bg-[#faf8f4] p-3 sm:p-4">
      <p className="text-sebavio-slate text-xs font-semibold tracking-wide uppercase">
        {field === "origin" ? "Point de départ" : "Destination"}
      </p>

      {homeCity && field === "origin" && onUseHome ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onUseHome}
          className="w-full justify-start"
        >
          <Home data-icon="inline-start" />
          Partir de mon domicile — {homeCity}
        </Button>
      ) : null}

      <AddressAutocomplete
        name={`planner-${field}`}
        geoNamePrefix={`planner${field}`}
        placeholder={placeholder ?? "Entrez une adresse ou une ville"}
        disabled={disabled}
        onAddressSelect={(addr) => {
          if (!addr) {
            setSelectedLabel(null);
            return;
          }
          setSelectedLabel(addr.formattedAddress);
          onSelectAddress(addr);
        }}
      />

      {selectedLabel ? (
        <p className="text-sebavio-navy flex items-start gap-1.5 text-xs">
          <MapPin className="text-sebavio-teal mt-0.5 size-3.5 shrink-0" />
          Sélectionné : {selectedLabel}
        </p>
      ) : null}

      {suggestions.length > 0 && onQuickCity ? (
        <div className="flex flex-wrap gap-2">
          {suggestions
            .filter((s) => s.kind !== "home")
            .slice(0, 6)
            .map((s) => (
              <button
                key={`${s.kind}-${s.label}`}
                type="button"
                disabled={disabled}
                onClick={() => onQuickCity(s.label)}
                className="text-sebavio-navy hover:border-sebavio-gold/60 rounded-full border border-[#d7e0ea] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#fff9ef] disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
