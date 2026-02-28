export type UnitSystem = "metric" | "imperial";

export type RadiusOption = {
  metricLabel: string;
  imperialLabel: string;
  meters: number;
};

export const RADIUS_OPTIONS: RadiusOption[] = [
  { metricLabel: "500 m", imperialLabel: "0.3 mi", meters: 500 },
  { metricLabel: "1 km", imperialLabel: "0.6 mi", meters: 1000 },
  { metricLabel: "5 km", imperialLabel: "3 mi", meters: 5000 },
  { metricLabel: "10 km", imperialLabel: "6 mi", meters: 10000 },
  { metricLabel: "25 km", imperialLabel: "15 mi", meters: 25000 },
  { metricLabel: "50 km", imperialLabel: "30 mi", meters: 50000 },
];

export function getRadiusLabel(
  option: RadiusOption,
  units: UnitSystem,
): string {
  return units === "imperial" ? option.imperialLabel : option.metricLabel;
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
