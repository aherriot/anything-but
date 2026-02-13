"use client";

import { useCallback, useEffect, useMemo } from "react";
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
  allVotes: RestaurantVote[];
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
      const restaurantId =
        (vote as RestaurantVote & { restaurant?: { id: string }[] })
          .restaurant?.[0]?.id ??
        findRestaurantIdForVote(vote.id, cachedRestaurants);

      if (restaurantId) {
        if (!votesByRestaurant.has(restaurantId)) {
          votesByRestaurant.set(restaurantId, new Map());
        }
        votesByRestaurant.get(restaurantId)!.set(vote.guestId, vote.vote);

        if (vote.guestId === guestId) {
          myVotedIds.add(restaurantId);
        }

        // If any guest voted no on the restaurant, it's globally rejected
        if (vote.vote === "no_restaurant") {
          rejectedRestaurantIds.add(restaurantId);
        }

        // If any guest voted no on a cuisine, collect the cuisine type
        if (vote.vote === "no_cuisine") {
          const restaurant = cachedRestaurants.find(
            (r) => r.id === restaurantId,
          );
          if (restaurant) {
            rejectedCuisineTypes.add(restaurant.type);
          }
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
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="heading-lg text-primary-300 mb-2">Everyone agrees!</h2>
          <p className="text-neutral-400">
            All {guests.length} guests want to eat here
          </p>
        </div>

        <RestaurantCard restaurant={consensusRestaurant} featured />

        <div className="mt-6 flex flex-col gap-3">
          {consensusRestaurant.website &&
            consensusRestaurant.website !== "#" && (
              <a
                href={consensusRestaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center"
              >
                Visit Website
              </a>
            )}
          {consensusRestaurant.phone && (
            <a
              href={`tel:${consensusRestaurant.phone.replace(/[^\d]/g, "")}`}
              className="btn-outline text-center"
            >
              Call {consensusRestaurant.phone}
            </a>
          )}
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
        const restaurantId = findRestaurantIdForVote(
          vote.id,
          cachedRestaurants,
        );
        const restaurant = cachedRestaurants.find((r) => r.id === restaurantId);

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
      <div className="max-w-2xl mx-auto text-center">
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="heading-sm text-neutral-300">Would you eat here?</h2>
        <span className="text-neutral-500 text-sm">{remainingCount} left</span>
      </div>

      <RestaurantCard restaurant={nextRestaurant} />

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => handleVote(nextRestaurant.id, "yes")}
        >
          ✓ Yes, I would eat here
        </Button>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => handleVote(nextRestaurant.id, "no_restaurant")}
        >
          ✗ No, I don&apos;t like this restaurant
        </Button>
        {nextRestaurant.type !== "generic_restaurant" && (
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => handleVote(nextRestaurant.id, "no_cuisine")}
          >
            ✗ No, I don&apos;t want {getCuisineName(nextRestaurant.type)}
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper: find the restaurant ID for a vote by looking through votes arrays
function findRestaurantIdForVote(
  voteId: string,
  cachedRestaurants: CachedRestaurant[],
): string | undefined {
  for (const restaurant of cachedRestaurants) {
    if (restaurant.votes?.some((v) => v.id === voteId)) {
      return restaurant.id;
    }
  }
  return undefined;
}

function RestaurantCard({
  restaurant,
  featured = false,
}: {
  restaurant: CachedRestaurant;
  featured?: boolean;
}) {
  return (
    <div
      className={`bg-neutral-800 rounded-xl overflow-hidden ${featured ? "ring-2 ring-primary-500" : ""}`}
    >
      {restaurant.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/places/photo?photoReference=${encodeURIComponent(restaurant.photoUrl)}&maxWidth=800&maxHeight=400`}
          alt={restaurant.name}
          className="w-full h-48 object-cover"
        />
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

        {restaurant.address && (
          <p className="text-neutral-500 text-sm mt-2">{restaurant.address}</p>
        )}
      </div>
    </div>
  );
}
