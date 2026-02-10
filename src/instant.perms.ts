import { InstantRules } from "@instantdb/react";

const rules = {
  groups: {
    allow: {
      // Anyone can view groups (needed for joining via shared link)
      view: "true",
      // Anyone can create a group
      create: "auth.id != null",
      // Only the owner can update or delete a group
      update: "true",
      delete: "data.ownerId == auth.id",
    },
  },
  excludedCuisines: {
    allow: {
      // Anyone in the group can view restrictions
      view: "true",
      // Anyone can create their own restriction
      create: "true",
      // Only the guest who created the restriction can update/delete it
      update: "data.guestId == auth.id",
      delete: "data.guestId == auth.id",
    },
  },
  $users: {
    allow: {
      view: "true",
      update: "data.id == auth.id",
    },
  },
} satisfies InstantRules;

export default rules;
