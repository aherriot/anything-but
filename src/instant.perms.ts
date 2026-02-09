import { InstantRules } from "@instantdb/react";

const rules = {
  groups: {
    allow: {
      // Anyone can view groups (needed for joining via shared link)
      view: "true",
      // Anyone can create a group
      create: "true",
      // Only the owner can update or delete a group
      update: "data.ownerId == auth.guest",
      delete: "data.ownerId == auth.guest",
    },
  },
  excludedCuisines: {
    allow: {
      // Anyone in the group can view restrictions
      view: "true",
      // Anyone can create their own restriction
      create: "true",
      // Only the guest who created the restriction can update/delete it
      update: "data.guestId == auth.guest",
      delete: "data.guestId == auth.guest",
    },
  },
} satisfies InstantRules;

export default rules;
