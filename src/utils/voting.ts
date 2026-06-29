import type { CachedRestaurant, RestaurantVote } from "@/types";

export type Guest = { id: string; name?: string };

/**
 * Derived view of all votes in a group, used to decide what to show next.
 *
 * - `rejectedRestaurantIds` — restaurants any guest vetoed by name.
 * - `rejectedCuisineTypes` — cuisine types any guest vetoed.
 * - `votesByRestaurant` — restaurantId -> (guestId -> vote value).
 * - `myVotedIds` — restaurants the current guest has already voted on.
 */
export type VoteState = {
  rejectedRestaurantIds: Set<string>;
  rejectedCuisineTypes: Set<string>;
  votesByRestaurant: Map<string, Map<string, string>>;
  myVotedIds: Set<string>;
};

/**
 * Build the derived vote state from the raw vote list. Pure: no React, no IO.
 */
export function computeVoteState(
  allVotes: (RestaurantVote & { restaurantId: string })[],
  cachedRestaurants: CachedRestaurant[],
  guestId: string,
): VoteState {
  const rejectedRestaurantIds = new Set<string>();
  const rejectedCuisineTypes = new Set<string>();
  const votesByRestaurant = new Map<string, Map<string, string>>();
  const myVotedIds = new Set<string>();

  for (const vote of allVotes) {
    if (!votesByRestaurant.has(vote.restaurantId)) {
      votesByRestaurant.set(vote.restaurantId, new Map());
    }
    votesByRestaurant.get(vote.restaurantId)!.set(vote.guestId, vote.vote);

    if (vote.guestId === guestId) {
      myVotedIds.add(vote.restaurantId);
    }

    if (vote.vote === "no_restaurant") {
      rejectedRestaurantIds.add(vote.restaurantId);
    }

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
}

/**
 * The first restaurant every guest has voted "yes" on, or null if there is none.
 */
export function findConsensusRestaurant(
  cachedRestaurants: CachedRestaurant[],
  guests: Guest[],
  votesByRestaurant: Map<string, Map<string, string>>,
): CachedRestaurant | null {
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
}

/**
 * The next restaurant to present to the current guest: not yet voted on by them,
 * not globally rejected by restaurant or by cuisine. Null once a consensus exists.
 */
export function findNextCandidate(
  cachedRestaurants: CachedRestaurant[],
  state: Pick<
    VoteState,
    "myVotedIds" | "rejectedRestaurantIds" | "rejectedCuisineTypes"
  >,
  consensusRestaurant: CachedRestaurant | null,
): CachedRestaurant | null {
  if (consensusRestaurant) return null;

  return (
    cachedRestaurants.find((r) => {
      if (state.myVotedIds.has(r.id)) return false;
      if (state.rejectedRestaurantIds.has(r.id)) return false;
      if (state.rejectedCuisineTypes.has(r.type)) return false;
      return true;
    }) ?? null
  );
}

/**
 * How many restaurants are still in play — not rejected, and not already voted
 * on by every guest. Drives the "fetch more" threshold.
 */
export function countRemaining(
  cachedRestaurants: CachedRestaurant[],
  state: Pick<
    VoteState,
    "rejectedRestaurantIds" | "rejectedCuisineTypes" | "votesByRestaurant"
  >,
  guests: Guest[],
): number {
  return cachedRestaurants.filter((r) => {
    if (state.rejectedRestaurantIds.has(r.id)) return false;
    if (state.rejectedCuisineTypes.has(r.type)) return false;

    const restaurantVoteMap = state.votesByRestaurant.get(r.id);
    if (restaurantVoteMap) {
      const allVoted = guests.every((g) => restaurantVoteMap.has(g.id));
      if (allVoted) return false;
    }
    return true;
  }).length;
}

export type GuestExclusionCounts = {
  excludedRestaurantsByGuest: Map<string, number>;
  excludedCuisinesByGuest: Map<string, number>;
};

/**
 * Per-guest counts of how many restaurants and cuisines each guest has vetoed.
 */
export function countExclusionsByGuest(
  allVotes: RestaurantVote[],
): GuestExclusionCounts {
  const excludedRestaurantsByGuest = new Map<string, number>();
  const excludedCuisinesByGuest = new Map<string, number>();

  for (const vote of allVotes) {
    if (vote.vote === "no_restaurant") {
      excludedRestaurantsByGuest.set(
        vote.guestId,
        (excludedRestaurantsByGuest.get(vote.guestId) ?? 0) + 1,
      );
    } else if (vote.vote === "no_cuisine") {
      excludedCuisinesByGuest.set(
        vote.guestId,
        (excludedCuisinesByGuest.get(vote.guestId) ?? 0) + 1,
      );
    }
  }

  return { excludedRestaurantsByGuest, excludedCuisinesByGuest };
}
