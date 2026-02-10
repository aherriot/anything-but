"use client";

import { use } from "react";

import Link from "next/link";

import db from "@/utils/db";
import type { Restriction } from "@/types";
import Header from "@/components/ui/header";
import RestaurantList from "./RestaurantList";
import GuestPanel from "./GuestPanel";
import { usePlaceDetails } from "@/hooks/usePlaceDetails";

export default function Group({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { user } = db.useAuth();

  const { isLoading, error, data } = db.useQuery({
    groups: {
      $: {
        where: {
          id: groupId,
        },
        limit: 1,
      },
      excludedCuisines: {},
      guests: {},
    },
  });

  const group = data?.groups?.[0];

  const {
    placeDetails: geo,
    isLoading: isPlaceLoading,
    error: placeError,
  } = usePlaceDetails(group?.placeId);

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div className="text-center text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (isLoading || isPlaceLoading) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div className="text-center text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div className="text-center text-error">
          Error fetching data: {error.message}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div className="text-center text-neutral-400">Group not found</div>
      </div>
    );
  }

  if (placeError) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div className="text-center text-error">
          Error loading location: {placeError}
        </div>
      </div>
    );
  }

  if (!geo) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div className="text-center text-neutral-400">Location not found</div>
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
    <div className="min-h-screen bg-neutral-900">
      <Header showInvite />
      <main className="max-w-4xl mx-auto flex flex-col gap-8 px-4">
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
          className="text-primary-500 hover:text-primary-600 font-medium"
        >
          ← Back to restrictions
        </Link>
      </main>
      <GuestPanel group={group} />
    </div>
  );
}
