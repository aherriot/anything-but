"use client";

import { use } from "react";

import Link from "next/link";

import db from "@/utils/db";
import { Restriction } from "@/types";
import Header from "@/components/ui/header";
import RestaurantList from "./RestaurantList";
import { usePlaceDetails } from "@/hooks/usePlaceDetails";

export default function Group({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const guestId = db.useLocalId("guest");

  const { isLoading, error, data } = db.useQuery({
    groups: {
      $: {
        where: {
          id: groupId,
        },
        limit: 1,
      },
      excludedCuisines: {},
    },
  });

  const group = data?.groups?.[0];

  const {
    placeDetails: geo,
    isLoading: isPlaceLoading,
    error: placeError,
  } = usePlaceDetails(group?.placeId);

  if (!guestId) {
    return <div>No guestId found</div>;
  }

  if (isLoading || isPlaceLoading) {
    return (
      <div className="items-center text-white justify-items-center min-h-screen gap-16 bg-neutral-50">
        <Header showInvite />
        <div>Loading...</div>
      </div>
    );
  }

  if (error) return <div>Error fetching data: {error.message}</div>;

  if (!group) {
    return <div>Group not found</div>;
  }

  if (placeError) {
    return (
      <div className="items-center text-white justify-items-center min-h-screen gap-16 bg-neutral-50">
        <Header showInvite />
        <div>Error loading location: {placeError}</div>
      </div>
    );
  }

  if (!geo) {
    return (
      <div className="items-center text-white justify-items-center min-h-screen gap-16 bg-neutral-50">
        <Header showInvite />
        <div>Location not found</div>
      </div>
    );
  }

  const cuisineIds = new Map<string, Restriction>();

  group.excludedCuisines.map((cuisine) => {
    cuisineIds.set(cuisine.cuisineId, {
      cuisineId: cuisine.cuisineId,
      restrictionId: cuisine.id,
      guestId: cuisine.guestId,
    });
  });

  const cuisineIdsArray = Array.from(cuisineIds.keys());

  // Location info comes from Google Places API
  const locationName = `${geo.city}, ${geo.region}`;

  return (
    <div className="items-center text-white justify-items-center min-h-screen gap-16 bg-neutral-50">
      <Header showInvite />
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="w-full">
          <RestaurantList
            location={locationName}
            cuisines={cuisineIdsArray}
            latitude={geo.latitude}
            longitude={geo.longitude}
          />
        </div>

        <Link
          href={`/groups/${groupId}`}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to restrictions
        </Link>
      </main>
    </div>
  );
}
