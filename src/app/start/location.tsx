import { useState } from "react";
import { useRouter } from "next/navigation";
import { id } from "@instantdb/react";

import { Button } from "@/components/Button";
import LocationCombobox from "@/components/LocationCombobox";
import type { Location } from "@/hooks/useLocationSearch";
import db from "@/utils/db";

type LocationProps = {
  name: string;
  setChangeName: (change: boolean) => void;
};

export default function Location({ name, setChangeName }: LocationProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const router = useRouter();

  const { user } = db.useAuth();

  const handleCreateGroup = async (location: Location) => {
    if (!user) return;

    const newGroupId = id();
    await db.transact(
      db.tx.groups[newGroupId].update({
        name,
        createdAt: JSON.stringify(new Date()),
        ownerId: user.id,
        placeId: location.placeId,
        placeName: location.text,
        fetchStatus: "ready",
      }),
    );

    // Trigger restaurant prefetch in the background (fire and forget)
    fetch(`/api/groups/${newGroupId}/prefetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch((err) => console.error("Failed to trigger prefetch:", err));

    router.push(`/groups/${newGroupId}`);
  };

  return (
    <div className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
      <h1 className="text-neutral-200 text-xl">
        <span className="text-neutral-100 font-bold">{name}</span>, where do you
        want to find a restaurant?
      </h1>
      <LocationCombobox
        value={selectedLocation}
        onChange={setSelectedLocation}
        placeholder="Search for a city..."
        autoFocus
      />
      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={() => setChangeName(true)}>
          Change name
        </Button>
        <Button
          onClick={() =>
            selectedLocation && handleCreateGroup(selectedLocation)
          }
          disabled={!selectedLocation}
        >
          Jump in
        </Button>
      </div>
    </div>
  );
}
