"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { id } from "@instantdb/react";
import { CUISINE_MAP } from "@/utils/constants";
import { Button } from "@/components/Button";
import db from "@/utils/db";
import type { CachedRestaurant, RestaurantVote } from "@/types";

type RestaurantSwipeProps = {
  groupId: string;
  guestId: string;
  guests: { id: string; name?: string }[];
  cachedRestaurants: CachedRestaurant[];
  allVotes: (RestaurantVote & { restaurantId: string })[];
  fetchStatus?: string;
};

function getCuisineName(type: string): string {
  if (
    [
      "pub",
      "diner",
      "bar",
      "coffee_shop",
      "steak_house",
      "bar_and_grill",
      "hamburger_restaurant",
    ].includes(type)
  ) {
    return "a " + CUISINE_MAP[type];
  } else {
    return CUISINE_MAP[type];
  }
}

export default function RestaurantSwipe({
  groupId,
  guestId,
  guests,
  cachedRestaurants,
  allVotes,
  fetchStatus,
}: RestaurantSwipeProps) {
  // Build sets for efficient filtering
  const {
    rejectedRestaurantIds,
    rejectedCuisineTypes,
    votesByRestaurant,
    myVotedIds,
  } = useMemo(() => {
    const rejectedRestaurantIds = new Set<string>();
    const rejectedCuisineTypes = new Set<string>();
    const votesByRestaurant = new Map<string, Map<string, string>>();
    const myVotedIds = new Set<string>();

    for (const vote of allVotes) {
      // Track votes by restaurant -> guest -> vote
      if (!votesByRestaurant.has(vote.restaurantId)) {
        votesByRestaurant.set(vote.restaurantId, new Map());
      }
      votesByRestaurant.get(vote.restaurantId)!.set(vote.guestId, vote.vote);

      if (vote.guestId === guestId) {
        myVotedIds.add(vote.restaurantId);
      }

      // If any guest voted no on the restaurant, it's globally rejected
      if (vote.vote === "no_restaurant") {
        rejectedRestaurantIds.add(vote.restaurantId);
      }

      // If any guest voted no on a cuisine, collect the cuisine type
      if (vote.vote === "no_cuisine") {
        const restaurant = cachedRestaurants.find(
          (r) => r.id === vote.restaurantId,
        );
        if (restaurant) {
          rejectedCuisineTypes.add(restaurant.type);
        }
      }
    }

    return {
      rejectedRestaurantIds,
      rejectedCuisineTypes,
      votesByRestaurant,
      myVotedIds,
    };
  }, [allVotes, cachedRestaurants, guestId]);

  // Find the consensus restaurant (all guests voted "yes")
  const consensusRestaurant = useMemo(() => {
    if (guests.length === 0) return null;

    for (const restaurant of cachedRestaurants) {
      const restaurantVoteMap = votesByRestaurant.get(restaurant.id);
      if (!restaurantVoteMap) continue;

      const allVotedYes = guests.every(
        (guest) => restaurantVoteMap.get(guest.id) === "yes",
      );
      if (allVotedYes) return restaurant;
    }
    return null;
  }, [cachedRestaurants, guests, votesByRestaurant]);

  // Get the next restaurant to show the current guest
  const nextRestaurant = useMemo(() => {
    if (consensusRestaurant) return null;

    return cachedRestaurants.find((r) => {
      // Skip if I already voted on it
      if (myVotedIds.has(r.id)) return false;
      // Skip if globally rejected (any guest said no to this restaurant)
      if (rejectedRestaurantIds.has(r.id)) return false;
      // Skip if cuisine is globally rejected
      if (rejectedCuisineTypes.has(r.type)) return false;
      return true;
    });
  }, [
    cachedRestaurants,
    myVotedIds,
    rejectedRestaurantIds,
    rejectedCuisineTypes,
    consensusRestaurant,
  ]);

  // Count remaining available restaurants (not rejected, not all voted on)
  const remainingCount = useMemo(() => {
    return cachedRestaurants.filter((r) => {
      if (rejectedRestaurantIds.has(r.id)) return false;
      if (rejectedCuisineTypes.has(r.type)) return false;
      // Check if all guests have voted on this restaurant
      const restaurantVoteMap = votesByRestaurant.get(r.id);
      if (restaurantVoteMap) {
        const allVoted = guests.every((g) => restaurantVoteMap.has(g.id));
        if (allVoted) return false;
      }
      return true;
    }).length;
  }, [
    cachedRestaurants,
    rejectedRestaurantIds,
    rejectedCuisineTypes,
    votesByRestaurant,
    guests,
  ]);

  // Auto-fetch more restaurants when running low
  const triggerFetchMore = useCallback(() => {
    if (fetchStatus === "fetching" || fetchStatus === "exhausted") return;

    fetch(`/api/groups/${groupId}/prefetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch((err) => console.error("Failed to fetch more restaurants:", err));
  }, [groupId, fetchStatus]);

  useEffect(() => {
    const MIN_THRESHOLD = 5;
    if (
      remainingCount < MIN_THRESHOLD &&
      fetchStatus !== "exhausted" &&
      fetchStatus !== "fetching"
    ) {
      triggerFetchMore();
    }
  }, [remainingCount, fetchStatus, triggerFetchMore]);

  // Handle voting
  const handleVote = async (
    restaurantId: string,
    vote: "yes" | "no_restaurant" | "no_cuisine",
  ) => {
    const voteId = id();
    await db.transact(
      db.tx.restaurantVotes[voteId]
        .update({
          guestId,
          vote,
          votedAt: new Date().toISOString(),
        })
        .link({ group: groupId, restaurant: restaurantId }),
    );
  };

  // CONSENSUS VIEW
  if (consensusRestaurant) {
    return (
      <div className="max-w-full mx-auto text-center">
        <div className="mb-6">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="heading-lg text-primary-300 mb-2">Everyone agrees!</h2>
          <p className="text-neutral-400">
            All {guests.length} guests want to eat here
          </p>
        </div>

        <RestaurantCard restaurant={consensusRestaurant} featured />

        <div className="mt-6 flex flex-col gap-2">
          {consensusRestaurant.website &&
            consensusRestaurant.website !== "#" && (
              <a
                href={consensusRestaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-transparent text-primary-500 hover:bg-primary-500/10 focus:bg-primary-500/10 py-2 px-6 w-full"
              >
                Visit Website
              </a>
            )}
          {consensusRestaurant.phone && (
            <a
              href={`tel:${consensusRestaurant.phone.replace(/[^\d]/g, "")}`}
              className="rounded-md  bg-transparent text-primary-500 hover:bg-primary-500/10 focus:bg-primary-500/10 py-2 px-6 w-full"
            >
              Call {consensusRestaurant.phone}
            </a>
          )}
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={async () => {
              const voteId = allVotes.find(
                (v) =>
                  v.guestId === guestId &&
                  v.restaurantId === consensusRestaurant.id,
              )?.id;

              if (!voteId) {
                console.error(
                  "No existing vote found for consensus restaurant",
                );
                return;
              }
              await db.transact(
                db.tx.restaurantVotes[voteId].update({
                  guestId,
                  vote: "no_restaurant",
                  votedAt: new Date().toISOString(),
                }),
              );
            }}
          >
            Actually, I don't want to eat here
          </Button>
        </div>
      </div>
    );
  }

  // NO OPTIONS LEFT VIEW
  if (!nextRestaurant && remainingCount === 0 && fetchStatus === "exhausted") {
    // Build restriction summary per guest
    const guestRestrictions = guests.map((guest) => {
      const rejectedRestaurants: string[] = [];
      const rejectedCuisines: string[] = [];

      for (const vote of allVotes) {
        if (vote.guestId !== guest.id) continue;

        const restaurant = cachedRestaurants.find(
          (r) => r.id === vote.restaurantId,
        );

        if (vote.vote === "no_restaurant" && restaurant) {
          rejectedRestaurants.push(`${restaurant.name} (${restaurant.id})`);
        }
        if (vote.vote === "no_cuisine" && restaurant) {
          const cuisineName = CUISINE_MAP[restaurant.type];
          if (!rejectedCuisines.includes(cuisineName)) {
            rejectedCuisines.push(cuisineName);
          }
        }
      }

      return {
        name: guest.name || "Anonymous",
        rejectedRestaurants,
        rejectedCuisines,
      };
    });

    return (
      <div className="max-w-full mx-auto text-center">
        <div className="mb-6">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="heading-lg text-primary-300 mb-2">
            No agreement found
          </h2>
          <p className="text-neutral-400">
            The group couldn&apos;t agree on any restaurant. Here&apos;s what
            each person had to say:
          </p>
        </div>

        <div className="space-y-4 text-left">
          {guestRestrictions.map((guest, idx) => (
            <div key={idx} className="bg-neutral-800 rounded-lg p-4">
              <h3 className="text-neutral-100 font-semibold mb-2">
                {guest.name}
              </h3>
              {guest.rejectedCuisines.length > 0 && (
                <div className="mb-2">
                  <span className="text-neutral-400 text-sm">
                    Rejected cuisines:{" "}
                  </span>
                  <span className="text-red-400 text-sm">
                    {guest.rejectedCuisines.join(", ")}
                  </span>
                </div>
              )}
              {guest.rejectedRestaurants.length > 0 && (
                <div>
                  <span className="text-neutral-400 text-sm">
                    Rejected restaurants:{" "}
                  </span>
                  <span className="text-red-400 text-sm">
                    {guest.rejectedRestaurants.join(", ")}
                  </span>
                </div>
              )}
              {guest.rejectedCuisines.length === 0 &&
                guest.rejectedRestaurants.length === 0 && (
                  <p className="text-neutral-500 text-sm italic">
                    No restrictions
                  </p>
                )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // WAITING FOR RESTAURANTS TO LOAD
  if (!nextRestaurant && cachedRestaurants.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-neutral-400">Finding restaurants near you...</p>
      </div>
    );
  }

  // WAITING FOR MORE TO BE FETCHED / OTHER GUESTS
  if (!nextRestaurant) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-4">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="heading-lg text-primary-300 mb-2">
            Waiting for others
          </h2>
          <p className="text-neutral-400">
            You&apos;ve reviewed all available restaurants. Waiting for other
            guests to finish voting
            {fetchStatus !== "exhausted" && " or fetching more options"}...
          </p>
        </div>
        <div className="text-neutral-500 text-sm">
          {remainingCount} restaurant{remainingCount !== 1 ? "s" : ""} still
          need votes from other guests
        </div>
      </div>
    );
  }

  // SWIPE VIEW

  return (
    <div className="max-w-full w-full mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="heading-sm text-neutral-300">Would you eat here?</h2>
        <span className="text-neutral-500 text-sm">{remainingCount} left</span>
      </div>

      <RestaurantCard restaurant={nextRestaurant} />

      <div className="mt-6 flex flex-col gap-2">
        <Button
          key={nextRestaurant.id + "_yes"}
          variant="ghost"
          fullWidth
          onClick={() => handleVote(nextRestaurant.id, "yes")}
        >
          ✓ Yes, I would eat here
        </Button>
        <Button
          key={nextRestaurant.id + "_no_restaurant"}
          variant="ghost"
          fullWidth
          onClick={() => handleVote(nextRestaurant.id, "no_restaurant")}
        >
          ✗ No, I don&apos;t like this restaurant
        </Button>
        {nextRestaurant.type !== "generic_restaurant" && (
          <Button
            key={nextRestaurant.id + "_no_cuisine"}
            variant="ghost"
            fullWidth
            onClick={() => handleVote(nextRestaurant.id, "no_cuisine")}
          >
            ✗ No, I don&apos;t want{" "}
            <span className="font-semibold text-primary-400">
              {getCuisineName(nextRestaurant.type)}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

function RestaurantCard({
  restaurant,
  featured = false,
}: {
  restaurant: CachedRestaurant;
  featured?: boolean;
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`bg-neutral-800 rounded-xl overflow-hidden ${featured ? "ring-2 ring-primary-500" : ""}`}
    >
      {restaurant.photoUrl && (
        <div className="relative w-full h-48 bg-neutral-900">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-neutral-700"></div>
                <div className="h-2 w-24 bg-neutral-700 rounded"></div>
              </div>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={restaurant.photoUrl}
            src={`/api/places/photo?photoReference=${encodeURIComponent(restaurant.photoUrl)}&maxWidth=800&maxHeight=400`}
            alt={restaurant.name}
            className={`w-full h-48 object-cover ${imageLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-semibold text-neutral-100">
              {restaurant.name}
            </h3>
            <p className="text-sm text-neutral-400">
              {getCuisineName(restaurant.type)}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <span className="text-warning">★</span>
                <span className="font-medium text-neutral-100">
                  {restaurant.rating}
                </span>
              </div>
            )}
            <p className="text-sm text-neutral-400">{restaurant.priceRange}</p>
          </div>
        </div>

        {restaurant.description && (
          <p className="text-neutral-400 text-sm mt-2 line-clamp-2">
            {restaurant.description}
          </p>
        )}

        <div className="text-nowrap overflow-hidden">
          {restaurant.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 text-sm mt-2 hover:text-primary-500 transition-colors"
            >
              {restaurant.address} ⎘
            </a>
          )}
        </div>
        <div className="text-nowrap overflow-hidden">
          {restaurant.website && restaurant.website !== "#" && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 text-sm mt-2 hover:text-primary-500 transition-colors"
            >
              {restaurant.website} ⎘
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
