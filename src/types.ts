export type GroupScreen = "name" | "cuisine" | "diet" | "price";

export type StartScreen = "start" | "location";

export type Restriction = {
  cuisineId: string;
  restrictionId: string;
  guestId: string;
};

export type PersonalRestriction = {
  cuisineId: string;
  restrictionId: string;
};

export type ExcludedCuisine = {
  id: string;
  guestId: string;
  cuisineId: string;
};

export type Restaurant = {
  id: string;
  type: string;
  name: string;
  cuisine: string;
  rating: string;
  priceRange: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  website: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
};

export type RestaurantApiResponse = {
  success: boolean;
  data: {
    restaurants: Restaurant[];
    filters: {
      cuisines: string[];
    };
    total: number;
  } | null;
  error?: string;
};

export type ToggleRestrictionParams = {
  groupId: string;
  guestId: string;
  restrictionId: string;
  cuisineId: string;
  isChecked: boolean;
};
