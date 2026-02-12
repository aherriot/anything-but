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

export type CachedRestaurant = {
  id: string;
  googlePlaceId: string;
  name: string;
  rating?: string;
  priceRange: string;
  address?: string;
  phone?: string;
  description?: string;
  website: string;
  type: string;
  photoUrl?: string;
  votes: RestaurantVote[];
};

export type RestaurantVote = {
  id: string;
  guestId: string;
  vote: "yes" | "no_restaurant" | "no_cuisine";
  votedAt: string;
};
