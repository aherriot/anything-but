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
