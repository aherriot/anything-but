import { CUISINES } from "@/utils/constants";

const getFilteredCuisines = (
  cuisines: string[],
): (typeof CUISINES)[number][] => {
  return CUISINES.filter((cuisine) => !cuisines.includes(cuisine.id));
};

export { getFilteredCuisines };
