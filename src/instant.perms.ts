import { InstantRules } from "@instantdb/react";

// Notes on InstantDB permissions:
// - view / create / update / delete gate reads and attribute writes.
//   `data` is the existing row (and the new row inside `create`);
//   `newData` is the proposed row inside `update`.
// - link / unlink are gated by dedicated rules keyed by relationship label.
//   When a link rule is NOT set, it falls back to the namespace's `update`
//   rule. That matters here: joining a group and attaching a vote are link
//   operations that terminate on `groups` / `cachedRestaurants`, so once we
//   lock those namespaces' `update` down to owners / server-only we MUST add
//   explicit link rules or non-owners can no longer join or vote.
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
      update: "auth.id == data.ownerId",
      // Only the owner can delete a group.
      delete: "auth.id == data.ownerId",
      // Any signed-in user may join the group (link themselves as a guest)
      // and have their votes attached. These are distinct from editing the
      // group's attributes above. Linking someone else as a guest is still
      // blocked by the $users side ($users.update is self-only).
      link: {
        guests: "auth.id != null",
        restaurantVotes: "auth.id != null",
      },
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
      // …but a signed-in guest must be able to attach their vote to a
      // restaurant, which is a link (not an attribute write).
      link: {
        votes: "auth.id != null",
      },
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
      // Attaching a new vote to its group and restaurant.
      link: {
        group: "auth.id != null",
        restaurant: "auth.id != null",
      },
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
