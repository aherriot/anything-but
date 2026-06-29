import { mapPriceLevel, resolveCuisineType } from "./places";

describe("mapPriceLevel", () => {
  it("maps each known Google price level", () => {
    expect(mapPriceLevel("PRICE_LEVEL_FREE")).toBe("$");
    expect(mapPriceLevel("PRICE_LEVEL_INEXPENSIVE")).toBe("$");
    expect(mapPriceLevel("PRICE_LEVEL_MODERATE")).toBe("$$");
    expect(mapPriceLevel("PRICE_LEVEL_EXPENSIVE")).toBe("$$$");
    expect(mapPriceLevel("PRICE_LEVEL_VERY_EXPENSIVE")).toBe("$$$$");
  });

  it("defaults to $$ for unknown or missing levels", () => {
    expect(mapPriceLevel(undefined)).toBe("$$");
    expect(mapPriceLevel("PRICE_LEVEL_UNSPECIFIED")).toBe("$$");
  });
});

describe("resolveCuisineType", () => {
  it("keeps a primaryType that's in the cuisine map", () => {
    expect(resolveCuisineType("italian_restaurant", ["restaurant"])).toBe(
      "italian_restaurant",
    );
  });

  it("falls back to the first known type when primaryType is unknown", () => {
    expect(
      resolveCuisineType("point_of_interest", ["establishment", "sushi_restaurant"]),
    ).toBe("sushi_restaurant");
  });

  it("falls back to the first known type when primaryType is missing", () => {
    expect(resolveCuisineType(undefined, ["thai_restaurant"])).toBe(
      "thai_restaurant",
    );
  });

  it("returns generic_restaurant when nothing is recognised", () => {
    expect(resolveCuisineType("unknown", ["establishment"])).toBe(
      "generic_restaurant",
    );
    expect(resolveCuisineType(undefined, undefined)).toBe("generic_restaurant");
  });
});
