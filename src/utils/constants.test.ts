import {
  getRadiusOptions,
  getDefaultRadius,
  METRIC_RADIUS_OPTIONS,
  IMPERIAL_RADIUS_OPTIONS,
  CUISINE_MAP,
} from "./constants";

describe("getRadiusOptions", () => {
  it("returns metric options for metric", () => {
    expect(getRadiusOptions("metric")).toBe(METRIC_RADIUS_OPTIONS);
  });

  it("returns imperial options for imperial", () => {
    expect(getRadiusOptions("imperial")).toBe(IMPERIAL_RADIUS_OPTIONS);
  });
});

describe("getDefaultRadius", () => {
  it("defaults to 5 km for metric", () => {
    expect(getDefaultRadius("metric")).toEqual({ label: "5 km", meters: 5000 });
  });

  it("defaults to 3 mi for imperial", () => {
    expect(getDefaultRadius("imperial")).toEqual({ label: "3 mi", meters: 4828 });
  });

  it("returns an option present in the matching option list", () => {
    expect(METRIC_RADIUS_OPTIONS).toContainEqual(getDefaultRadius("metric"));
    expect(IMPERIAL_RADIUS_OPTIONS).toContainEqual(getDefaultRadius("imperial"));
  });
});

describe("CUISINE_MAP", () => {
  it("maps known place types to friendly labels", () => {
    expect(CUISINE_MAP["italian_restaurant"]).toBe("Italian");
    expect(CUISINE_MAP["generic_restaurant"]).toBe("Restaurant");
  });
});
