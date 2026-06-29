/** Debounce delay (ms) before firing a location autocomplete request. */
export const LOCATION_SEARCH_DEBOUNCE_MS = 300;

/** Options passed to navigator.geolocation.getCurrentPosition. */
export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 300000,
};

export type UnitSystem = "metric" | "imperial";

export type RadiusOption = {
  label: string;
  meters: number;
};

export const METRIC_RADIUS_OPTIONS: RadiusOption[] = [
  { label: "500 m", meters: 500 },
  { label: "1 km", meters: 1000 },
  { label: "5 km", meters: 5000 },
  { label: "10 km", meters: 10000 },
  { label: "25 km", meters: 25000 },
  { label: "50 km", meters: 50000 },
];

export const IMPERIAL_RADIUS_OPTIONS: RadiusOption[] = [
  { label: "0.25 mi", meters: 402 },
  { label: "0.5 mi", meters: 805 },
  { label: "3 mi", meters: 4828 },
  { label: "5 mi", meters: 8047 },
  { label: "15 mi", meters: 24140 },
  { label: "30 mi", meters: 48280 },
];

export function getRadiusOptions(units: UnitSystem): RadiusOption[] {
  return units === "imperial" ? IMPERIAL_RADIUS_OPTIONS : METRIC_RADIUS_OPTIONS;
}

export function getDefaultRadius(units: UnitSystem): RadiusOption {
  return units === "imperial"
    ? IMPERIAL_RADIUS_OPTIONS[2] // 3 mi
    : METRIC_RADIUS_OPTIONS[2]; // 5 km
}

export const CUISINE_MAP: Record<string, string> = {
  afghani_restaurant: "Afghani",
  african_restaurant: "African",
  american_restaurant: "American",
  asian_restaurant: "Asian",
  bar_and_grill: "Bar and Grill", // a bar and grill
  bar: "Bar", // a bar
  barbecue_restaurant: "Barbecue",
  brazilian_restaurant: "Brazilian",
  breakfast_restaurant: "Breakfast",
  brunch_restaurant: "Brunch",
  buffet_restaurant: "Buffet",
  cafeteria: "Cafeteria",
  chinese_restaurant: "Chinese",
  coffee_shop: "Coffee shop", // a coffee shop
  dessert_restaurant: "Dessert",
  diner: "Diner", // a diner
  fast_food_restaurant: "Fast Food",
  fine_dining_restaurant: "Fine Dining",
  french_restaurant: "French",
  generic_restaurant: "Restaurant",
  greek_restaurant: "Greek",
  hamburger_restaurant: "Hamburger",
  indian_restaurant: "Indian",
  indonesian_restaurant: "Indonesian",
  italian_restaurant: "Italian",
  japanese_restaurant: "Japanese",
  korean_restaurant: "Korean",
  lebanese_restaurant: "Lebanese",
  meal_takeaway: "Takeaway",
  mediterranean_restaurant: "Mediterranean",
  mexican_restaurant: "Mexican",
  middle_eastern_restaurant: "Middle Eastern",
  pizza_restaurant: "Pizza",
  pub: "Pub", // a pub
  ramen_restaurant: "Ramen",
  seafood_restaurant: "Seafood",
  spanish_restaurant: "Spanish",
  steak_house: "Steakhouse", // a steakhouse
  sushi_restaurant: "Sushi",
  thai_restaurant: "Thai",
  turkish_restaurant: "Turkish",
  vegan_restaurant: "Vegan",
  vegetarian_restaurant: "Vegetarian",
  vietnamese_restaurant: "Vietnamese",
} as const;

/**
 * Grammatical category for a cuisine, used to build natural-sounding sentences
 * like "No, I don't want ___":
 *
 * - "adjective": a descriptor that needs "food" to read as a noun phrase
 *     → "Mexican food", "Italian food". This is the default.
 * - "dish": a standalone food noun that stands on its own
 *     → "Sushi", "Pizza", "Brunch".
 * - "place": a countable venue that needs an article
 *     → "a Bar", "a Pub", "a Steakhouse".
 */
export type CuisineGrammar = "adjective" | "dish" | "place";

/** Cuisines that read as standalone food nouns (no trailing "food", no article). */
const DISH_CUISINES = new Set<string>([
  "barbecue_restaurant",
  "breakfast_restaurant",
  "brunch_restaurant",
  "dessert_restaurant",
  "fast_food_restaurant",
  "fine_dining_restaurant",
  "hamburger_restaurant",
  "meal_takeaway",
  "pizza_restaurant",
  "ramen_restaurant",
  "seafood_restaurant",
  "sushi_restaurant",
]);

/** Cuisines that name a venue and need an article ("a Bar", "a Pub"). */
const PLACE_CUISINES = new Set<string>([
  "bar",
  "bar_and_grill",
  "buffet_restaurant",
  "cafeteria",
  "coffee_shop",
  "diner",
  "pub",
  "steak_house",
]);

export function getCuisineGrammar(type: string): CuisineGrammar {
  if (PLACE_CUISINES.has(type)) return "place";
  if (DISH_CUISINES.has(type)) return "dish";
  return "adjective";
}

/**
 * Returns the unstyled text that wraps a cuisine name in a negation like
 * "No, I don't want {prefix}{name}{suffix}". The cuisine name itself
 * (CUISINE_MAP[type]) is rendered separately so it can be styled.
 */
export function getCuisineNegationAffixes(type: string): {
  prefix: string;
  suffix: string;
} {
  switch (getCuisineGrammar(type)) {
    case "place": {
      const name = CUISINE_MAP[type] ?? "";
      return { prefix: /^[aeiou]/i.test(name) ? "an " : "a ", suffix: "" };
    }
    case "dish":
      return { prefix: "", suffix: "" };
    case "adjective":
    default:
      return { prefix: "", suffix: " food" };
  }
}
