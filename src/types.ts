export type Screen = "name" | "cuisine" | "diet" | "price";

export type Restriction = {
  cuisineId: string;
  restrictionId: string;
  guestId: string;
};

export type PersonalRestriction = {
  cuisineId: string;
  restrictionId: string;
};
