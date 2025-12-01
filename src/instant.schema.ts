import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    groups: i.entity({
      name: i.string(),
      ownerId: i.string(),
      placeId: i.string(),
      createdAt: i.date(),
    }),
    excludedCuisines: i.entity({
      // The ID of the guest this restriction belongs to
      guestId: i.string(),
      /**
       * The ID of the cuisine that is excluded
       */
      cuisineId: i.string(),
    }),
  },
  links: {
    groupRestrictions: {
      forward: { on: "excludedCuisines", has: "one", label: "group" },
      reverse: { on: "groups", has: "many", label: "excludedCuisines" },
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

// This helps Typescript display better intellisense
type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
