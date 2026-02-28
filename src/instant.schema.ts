// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      name: i.string().optional(),
      type: i.string().optional(),
      unitPreference: i.string().optional(), // "metric" | "imperial"
    }),
    groups: i.entity({
      createdAt: i.date().indexed(),
      name: i.string(),
      ownerId: i.string(),
      placeId: i.string(),
      placeName: i.string(),
      searchRadius: i.number().optional(),
      nextPageToken: i.string().optional(),
      fetchStatus: i.string().optional(), // "fetching" | "ready" | "exhausted"
    }),
    cachedRestaurants: i.entity({
      googlePlaceId: i.string(),
      name: i.string(),
      rating: i.string().optional(),
      priceRange: i.string(),
      address: i.string().optional(),
      phone: i.string().optional(),
      description: i.string().optional(),
      website: i.string(),
      type: i.string(), // Google Places primaryType e.g. "italian_restaurant"
      photoUrl: i.string().optional(),
    }),
    restaurantVotes: i.entity({
      guestId: i.string(),
      vote: i.string(), // "yes" | "no_restaurant" | "no_cuisine"
      votedAt: i.string(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    groupsGuests: {
      forward: {
        on: "groups",
        has: "many",
        label: "guests",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "groups",
      },
    },
    cachedRestaurantsGroup: {
      forward: {
        on: "cachedRestaurants",
        has: "one",
        label: "group",
        onDelete: "cascade",
      },
      reverse: {
        on: "groups",
        has: "many",
        label: "cachedRestaurants",
      },
    },
    restaurantVotesGroup: {
      forward: {
        on: "restaurantVotes",
        has: "one",
        label: "group",
        onDelete: "cascade",
      },
      reverse: {
        on: "groups",
        has: "many",
        label: "restaurantVotes",
      },
    },
    restaurantVotesCachedRestaurant: {
      forward: {
        on: "restaurantVotes",
        has: "one",
        label: "restaurant",
        onDelete: "cascade",
      },
      reverse: {
        on: "cachedRestaurants",
        has: "many",
        label: "votes",
      },
    },
  },
  rooms: {
    group: {
      presence: i.entity({
        name: i.string(),
      }),
    },
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
