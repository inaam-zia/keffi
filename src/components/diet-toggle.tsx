"use client";

import { useCustomerLocale } from "@/components/customer-locale-provider";
import type { DietFilter } from "@/lib/diet";

export type { DietFilter };
export { matchesDietFilter, isNonVegMenuItem } from "@/lib/diet";

export const DIET_FILTER_KEY = "cafe-diet-filter";

export function readDietFilter(): DietFilter {
  try {
    const saved = localStorage.getItem(DIET_FILTER_KEY);
    if (saved === "veg" || saved === "nonveg" || saved === "both") return saved;
  } catch {
    /* ignore */
  }
  return "both";
}

function VegMark() {
  return (
    <span className="diet-toggle__mark diet-toggle__mark--veg" aria-hidden>
      <span />
    </span>
  );
}

function NonVegMark() {
  return (
    <span className="diet-toggle__mark diet-toggle__mark--nonveg" aria-hidden>
      <span />
    </span>
  );
}

export default function DietToggle({
  value,
  onChange,
}: {
  value: DietFilter;
  onChange: (value: DietFilter) => void;
}) {
  const { copy } = useCustomerLocale();
  const options: { key: DietFilter; label: string }[] = [
    { key: "veg", label: copy.veg },
    { key: "nonveg", label: copy.nonVeg },
    { key: "both", label: copy.both },
  ];

  return (
    <div className="diet-toggle" role="radiogroup" aria-label={copy.dietFilterAria}>
      {options.map((option) => {
        const checked = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={checked}
            className={`diet-toggle__opt diet-toggle__opt--${option.key}`}
            onClick={() => onChange(option.key)}
          >
            {option.key === "veg" ? <VegMark /> : null}
            {option.key === "nonveg" ? <NonVegMark /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
