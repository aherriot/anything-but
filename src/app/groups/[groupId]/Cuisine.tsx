"use client";

import { CUISINES } from "@/utils/constants";
import { GroupQueryRestrictions, PersonalRestriction, Screen } from "@/types";
import toggleRestriction from "../toggleRestriction";
import { Button } from "@/components/ui/button";
import { CheckboxListItem } from "@/components/ui/checkbox-list-item";
import Link from "next/link";

type CuisineProps = {
  guestId: string;
  groupId: string;
  restrictions: GroupQueryRestrictions;
  setScreen: (screen: Screen) => void;
};

export default function Cuisine({
  guestId,
  groupId,
  restrictions,
  // setScreen,
}: CuisineProps) {
  const cuisineIds = new Map<string, PersonalRestriction>();

  restrictions.map((restriction) => {
    if (restriction.restrictionType === "cuisine") {
      if (
        !cuisineIds.has(restriction.referenceId) &&
        restriction.guestId === guestId
      ) {
        cuisineIds.set(restriction.referenceId, {
          cuisineId: restriction.referenceId,
          restrictionId: restriction.id,
        });
      }
    }
  });

  return (
    <div className="">
      <div className="max-w-2xl mx-auto">
        <h2 className="heading-lg text-primary-300 mb-2">
          What food will you NOT eat?
        </h2>
        {/* Checkbox list with no gaps */}
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
                    restrictionType: "cuisine",
                    restrictionId: restriction?.restrictionId ?? "",
                    referenceId: cuisine.id,
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
