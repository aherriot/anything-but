import { useState } from "react";
import { redirect } from "next/navigation";
import { id } from "@instantdb/react";

import { Button } from "@/components/ui/button";
import LocationCombobox from "@/components/LocationCombobox";
import type { Location } from "@/hooks/useLocationSearch";
import db from "@/utils/db";

type LocationProps = {
  name: string;
  setScreen: (screen: "start" | "location") => void;
};

async function createGroup(name: string, location: Location) {
  const localId = await db.getLocalId("guest");
  if (!localId) {
    throw new Error("No local ID found");
  }
  const newGroupId = id();
  await db.transact(
    db.tx.groups[newGroupId].update({
      name,
      createdAt: JSON.stringify(new Date()),
      ownerId: localId,
      placeId: location.id,
    })
  );

  redirect(`/groups/${newGroupId}`);
}

export default function Location({ setScreen, name }: LocationProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  return (
    <div className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
      <h1 className="text-gray-200 text-xl">
        {name}, where do you want to find a restaurant?
      </h1>
      <LocationCombobox
        value={selectedLocation}
        onChange={setSelectedLocation}
        placeholder="Search for a city..."
        autoFocus
      />
      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={() => setScreen("start")}>
          Back
        </Button>
        <Button
          onClick={() =>
            selectedLocation && createGroup(name, selectedLocation)
          }
          disabled={!selectedLocation}
        >
          Jump in
        </Button>
      </div>
    </div>
  );
}
