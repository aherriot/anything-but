"use client";

import { CUISINES } from "@/utils/constants";
import { PersonalRestriction } from "@/types";
import toggleRestriction from "../toggleRestriction";
import { Button } from "@/components/ui/button";
import { CheckboxListItem } from "@/components/ui/checkbox-list-item";
import Link from "next/link";

type ExcludedCuisine = {
  id: string;
  guestId: string;
  cuisineId: string;
};

type CuisineProps = {
  guestId: string;
  groupId: string;
  excludedCuisines: ExcludedCuisine[];
};

export default function Cuisine({
  guestId,
  groupId,
  excludedCuisines,
}: CuisineProps) {
  const cuisineIds = new Map<string, PersonalRestriction>();

  excludedCuisines.forEach((cuisine) => {
    if (!cuisineIds.has(cuisine.cuisineId) && cuisine.guestId === guestId) {
      cuisineIds.set(cuisine.cuisineId, {
        cuisineId: cuisine.cuisineId,
        restrictionId: cuisine.id,
      });
    }
  });

  return (
    <div className="">
      <div className="max-w-2xl mx-auto">
        <h2 className="heading-lg text-primary-300 mb-2">
          What food will you NOT eat?
        </h2>
        <div className="bg-black shadow-md mb-8">
          {CUISINES.map((cuisine) => {
            const restriction = cuisineIds.get(cuisine.id);
            return (
              <CheckboxListItem
                key={cuisine.id}
                id={cuisine.id}
                label={cuisine.name}
                checked={!!restriction}
                onChange={(isChecked) => {
                  toggleRestriction({
                    groupId,
                    guestId,
                    cuisineId: cuisine.id,
                    isChecked,
                  });
                }}
              />
            );
          })}
        </div>

        <div className="mb-8 w-full flex justify-center">
          <Link href={`/groups/${groupId}/results`}>
            <Button variant="primary" size="lg">
              See Results
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
