import {
  computeVoteState,
  findConsensusRestaurant,
  findNextCandidate,
  countRemaining,
  countExclusionsByGuest,
} from "./voting";
import type { CachedRestaurant, RestaurantVote } from "@/types";

function makeRestaurant(
  id: string,
  type: string,
  overrides: Partial<CachedRestaurant> = {},
): CachedRestaurant {
  return {
    id,
    googlePlaceId: `place_${id}`,
    name: `Restaurant ${id}`,
    priceRange: "$$",
    website: "#",
    type,
    votes: [],
    ...overrides,
  };
}

type Vote = RestaurantVote & { restaurantId: string };

function makeVote(
  restaurantId: string,
  guestId: string,
  vote: RestaurantVote["vote"],
): Vote {
  return {
    id: `${restaurantId}_${guestId}`,
    guestId,
    vote,
    votedAt: "2026-06-28T00:00:00.000Z",
    restaurantId,
  };
}

describe("computeVoteState", () => {
  const restaurants = [
    makeRestaurant("r1", "italian_restaurant"),
    makeRestaurant("r2", "sushi_restaurant"),
    makeRestaurant("r3", "italian_restaurant"),
  ];

  it("marks a restaurant rejected when any guest votes no_restaurant", () => {
    const votes = [makeVote("r1", "g1", "no_restaurant")];
    const state = computeVoteState(votes, restaurants, "g2");

    expect(state.rejectedRestaurantIds.has("r1")).toBe(true);
    expect(state.rejectedRestaurantIds.has("r2")).toBe(false);
  });

  it("rejects a cuisine type when any guest votes no_cuisine", () => {
    const votes = [makeVote("r1", "g1", "no_cuisine")];
    const state = computeVoteState(votes, restaurants, "g2");

    // r1 is italian, so the whole italian cuisine is rejected
    expect(state.rejectedCuisineTypes.has("italian_restaurant")).toBe(true);
    expect(state.rejectedCuisineTypes.has("sushi_restaurant")).toBe(false);
  });

  it("tracks only the current guest's votes in myVotedIds", () => {
    const votes = [
      makeVote("r1", "g1", "yes"),
      makeVote("r2", "g2", "no_restaurant"),
    ];
    const state = computeVoteState(votes, restaurants, "g1");

    expect(state.myVotedIds.has("r1")).toBe(true);
    expect(state.myVotedIds.has("r2")).toBe(false);
  });

  it("indexes votes by restaurant then guest", () => {
    const votes = [
      makeVote("r1", "g1", "yes"),
      makeVote("r1", "g2", "no_restaurant"),
    ];
    const state = computeVoteState(votes, restaurants, "g1");

    expect(state.votesByRestaurant.get("r1")?.get("g1")).toBe("yes");
    expect(state.votesByRestaurant.get("r1")?.get("g2")).toBe("no_restaurant");
  });

  it("ignores no_cuisine votes for unknown restaurants", () => {
    const votes = [makeVote("missing", "g1", "no_cuisine")];
    const state = computeVoteState(votes, restaurants, "g1");

    expect(state.rejectedCuisineTypes.size).toBe(0);
  });
});

describe("findConsensusRestaurant", () => {
  const restaurants = [
    makeRestaurant("r1", "italian_restaurant"),
    makeRestaurant("r2", "sushi_restaurant"),
  ];
  const guests = [{ id: "g1" }, { id: "g2" }];

  it("returns the restaurant when every guest voted yes", () => {
    const votes = [
      makeVote("r1", "g1", "yes"),
      makeVote("r1", "g2", "yes"),
    ];
    const { votesByRestaurant } = computeVoteState(votes, restaurants, "g1");

    expect(findConsensusRestaurant(restaurants, guests, votesByRestaurant)?.id).toBe(
      "r1",
    );
  });

  it("returns null when not all guests have voted yes", () => {
    const votes = [makeVote("r1", "g1", "yes")];
    const { votesByRestaurant } = computeVoteState(votes, restaurants, "g1");

    expect(findConsensusRestaurant(restaurants, guests, votesByRestaurant)).toBeNull();
  });

  it("returns null when there are no guests", () => {
    const votes = [makeVote("r1", "g1", "yes")];
    const { votesByRestaurant } = computeVoteState(votes, restaurants, "g1");

    expect(findConsensusRestaurant(restaurants, [], votesByRestaurant)).toBeNull();
  });
});

describe("findNextCandidate", () => {
  const restaurants = [
    makeRestaurant("r1", "italian_restaurant"),
    makeRestaurant("r2", "sushi_restaurant"),
    makeRestaurant("r3", "italian_restaurant"),
  ];

  it("skips restaurants the current guest already voted on", () => {
    const state = {
      myVotedIds: new Set(["r1"]),
      rejectedRestaurantIds: new Set<string>(),
      rejectedCuisineTypes: new Set<string>(),
    };
    expect(findNextCandidate(restaurants, state, null)?.id).toBe("r2");
  });

  it("skips globally rejected restaurants and cuisines", () => {
    const state = {
      myVotedIds: new Set<string>(),
      rejectedRestaurantIds: new Set(["r1"]),
      rejectedCuisineTypes: new Set(["sushi_restaurant"]),
    };
    // r1 rejected, r2 is sushi (rejected cuisine), so r3 is next
    expect(findNextCandidate(restaurants, state, null)?.id).toBe("r3");
  });

  it("returns null when a consensus already exists", () => {
    const state = {
      myVotedIds: new Set<string>(),
      rejectedRestaurantIds: new Set<string>(),
      rejectedCuisineTypes: new Set<string>(),
    };
    expect(findNextCandidate(restaurants, state, restaurants[0])).toBeNull();
  });

  it("returns null when nothing is left", () => {
    const state = {
      myVotedIds: new Set(["r1", "r2", "r3"]),
      rejectedRestaurantIds: new Set<string>(),
      rejectedCuisineTypes: new Set<string>(),
    };
    expect(findNextCandidate(restaurants, state, null)).toBeNull();
  });
});

describe("countRemaining", () => {
  const restaurants = [
    makeRestaurant("r1", "italian_restaurant"),
    makeRestaurant("r2", "sushi_restaurant"),
    makeRestaurant("r3", "thai_restaurant"),
  ];
  const guests = [{ id: "g1" }, { id: "g2" }];

  it("counts all restaurants when nothing is rejected or fully voted", () => {
    const state = {
      rejectedRestaurantIds: new Set<string>(),
      rejectedCuisineTypes: new Set<string>(),
      votesByRestaurant: new Map<string, Map<string, string>>(),
    };
    expect(countRemaining(restaurants, state, guests)).toBe(3);
  });

  it("excludes rejected restaurants and cuisines", () => {
    const state = {
      rejectedRestaurantIds: new Set(["r1"]),
      rejectedCuisineTypes: new Set(["sushi_restaurant"]),
      votesByRestaurant: new Map<string, Map<string, string>>(),
    };
    expect(countRemaining(restaurants, state, guests)).toBe(1);
  });

  it("excludes restaurants every guest has already voted on", () => {
    const votes = [
      makeVote("r1", "g1", "yes"),
      makeVote("r1", "g2", "yes"),
    ];
    const { votesByRestaurant } = computeVoteState(votes, restaurants, "g1");
    const state = {
      rejectedRestaurantIds: new Set<string>(),
      rejectedCuisineTypes: new Set<string>(),
      votesByRestaurant,
    };
    // r1 has votes from both guests -> excluded; r2 and r3 remain
    expect(countRemaining(restaurants, state, guests)).toBe(2);
  });
});

describe("countExclusionsByGuest", () => {
  it("counts no_restaurant and no_cuisine votes per guest", () => {
    const votes: RestaurantVote[] = [
      makeVote("r1", "g1", "no_restaurant"),
      makeVote("r2", "g1", "no_restaurant"),
      makeVote("r3", "g1", "no_cuisine"),
      makeVote("r1", "g2", "no_cuisine"),
      makeVote("r2", "g2", "yes"),
    ];

    const { excludedRestaurantsByGuest, excludedCuisinesByGuest } =
      countExclusionsByGuest(votes);

    expect(excludedRestaurantsByGuest.get("g1")).toBe(2);
    expect(excludedCuisinesByGuest.get("g1")).toBe(1);
    expect(excludedRestaurantsByGuest.get("g2")).toBeUndefined();
    expect(excludedCuisinesByGuest.get("g2")).toBe(1);
  });

  it("returns empty maps for no votes", () => {
    const { excludedRestaurantsByGuest, excludedCuisinesByGuest } =
      countExclusionsByGuest([]);

    expect(excludedRestaurantsByGuest.size).toBe(0);
    expect(excludedCuisinesByGuest.size).toBe(0);
  });
});
