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
    }),
    excludedCuisines: i.entity({
      cuisineId: i.string(),
      guestId: i.string(),
    }),
    groups: i.entity({
      createdAt: i.date(),
      name: i.string(),
      ownerId: i.string(),
      placeId: i.string(),
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
    excludedCuisinesGroup: {
      forward: {
        on: "excludedCuisines",
        has: "one",
        label: "group",
      },
      reverse: {
        on: "groups",
        has: "many",
        label: "excludedCuisines",
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
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
