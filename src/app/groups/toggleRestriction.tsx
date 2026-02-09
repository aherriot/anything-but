import { id } from "@instantdb/react";
import db from "@/utils/db";
import type { ToggleRestrictionParams } from "@/types";

export default async function toggleRestriction({
  groupId,
  guestId,
  restrictionId,
  cuisineId,
  isChecked,
}: ToggleRestrictionParams) {
  if (isChecked) {
    await db.transact(
      db.tx.excludedCuisines[id()]
        .update({
          guestId,
          cuisineId,
        })
        .link({ group: groupId }),
    );
  } else {
    await db.transact(db.tx.excludedCuisines[restrictionId].delete());
  }
}
