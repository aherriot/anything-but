import { CUISINE_MAP } from "@/utils/constants";

/** Map Google's PRICE_LEVEL_* enum to a "$"–"$$$$" range. */
export function mapPriceLevel(priceLevel?: string): string {
  const priceLevelMap: Record<string, string> = {
    PRICE_LEVEL_FREE: "$",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return priceLevelMap[priceLevel || ""] || "$$";
}

/**
 * Resolve a Google place's cuisine type to one we recognise: prefer the
 * primaryType, otherwise the first known type, otherwise "generic_restaurant".
 */
export function resolveCuisineType(
  primaryType: string | undefined,
  types: string[] | undefined,
): string {
  if (primaryType && CUISINE_MAP[primaryType]) {
    return primaryType;
  }
  return types?.find((t) => CUISINE_MAP[t]) || "generic_restaurant";
}
