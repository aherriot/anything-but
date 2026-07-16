import { InstantRules } from "@instantdb/react";

// Notes on InstantDB permissions:
// - view / create / update / delete gate reads and attribute writes.
//   `data` is the existing row (and the new row inside `create`);
//   `newData` is the proposed row inside `update`.
// - link / unlink are governed by their OWN rules (keyed by relationship
//   label) and default to `true` when unset. This is why locking `update`
//   below to owners-only does NOT stop a guest from joining a group or from
//   attaching a vote to a group/restaurant — those are link operations.
// - Restaurant data is only ever written server-side via the admin token
//   (see src/app/api/groups/[groupId]/prefetch/route.ts), which bypasses
//   these rules entirely.
const rules = {
  groups: {
    allow: {
      // Anyone can view a group (needed to join via a shared link).
      view: "true",
      // A group may only be created with the creator as its owner.
      create: "auth.id != null && auth.id == data.ownerId",
      // Only the owner can change a group's fields (name, location, radius…).
      // Guests joining and votes attaching are link operations, so this does
      // not block collaboration.
      update: "auth.id == data.ownerId",
      // Only the owner can delete a group.
      delete: "auth.id == data.ownerId",
    },
  },
  cachedRestaurants: {
    allow: {
      // Restaurants are readable by everyone in the group.
      view: "true",
      // Restaurants are only ever written server-side (admin token), so
      // clients cannot create, tamper with, or delete them.
      create: "false",
      update: "false",
      delete: "false",
    },
  },
  restaurantVotes: {
    allow: {
      view: "true",
      // A guest may only cast a vote under their own id — no forging votes
      // (including "yes" votes) on another guest's behalf.
      create: "auth.id != null && auth.id == data.guestId",
      // A guest may only change their own vote, and cannot reassign it.
      update: "auth.id == data.guestId && auth.id == newData.guestId",
      // A guest may only delete their own vote.
      delete: "auth.id == data.guestId",
    },
  },
  $users: {
    allow: {
      // Display names are visible to everyone (shown in the guest list);
      // email is restricted to the account owner via the field rule below.
      view: "true",
      update: "auth.id == data.id",
    },
    fields: {
      // Only a user can see their own email address.
      email: "auth.id == data.id",
    },
  },
} satisfies InstantRules;

export default rules;
