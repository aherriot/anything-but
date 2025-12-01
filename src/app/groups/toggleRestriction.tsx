import { id } from "@instantdb/react";
import db from "@/utils/db";

type toggleRestrictionType = {
  groupId: string;
  guestId: string;
  cuisineId: string;
  isChecked: boolean;
};

export default async function toggleRestriction({
  groupId,
  guestId,
  cuisineId,
  isChecked,
}: toggleRestrictionType) {
  if (isChecked) {
    await db.transact(
      db.tx.excludedCuisines[id()]
        .update({
          guestId,
          cuisineId,
        })
        .link({ group: groupId })
    );
  } else {
    await db.transact(db.tx.excludedCuisines[cuisineId].delete());
  }
}
