"use client";

import { use, useState } from "react";
import type { GroupScreen } from "@/types";
import useLocalStorageState from "@/hooks/useLocalStorageState";
import { usePlaceDetails } from "@/hooks/usePlaceDetails";

import Name from "./Name";
import Cuisine from "./Cuisine";
import db from "@/utils/db";
import Header from "@/components/ui/header";

export default function Groups({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const guestId = db.useLocalId("guest");

  const [name, setName] = useLocalStorageState<string>("name", "");
  const [screen, setScreen] = useState<GroupScreen>("name");

  const { isLoading, error, data } = db.useQuery({
    groups: {
      $: {
        where: {
          id: groupId,
        },
        limit: 1,
      },
      excludedCuisines: {},
    },
  });

  const group = data?.groups?.[0];

  const {
    placeDetails: geo,
    isLoading: isPlaceLoading,
    error: placeError,
  } = usePlaceDetails(group?.placeId);

  if (!guestId) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        Loading
      </div>
    );
  }

  if (isLoading || isPlaceLoading) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div>Loading...</div>
      </div>
    );
  }

  if (error) return <div>Error fetching data: {error.message}</div>;

  if (!group) {
    return <div>Group not found</div>;
  }

  if (placeError) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div>Error loading location: {placeError}</div>
      </div>
    );
  }

  if (!geo) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div>Location not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <Header showInvite />
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {screen === "name" && (
          <Name
            setScreen={setScreen}
            name={name}
            setName={setName}
            groupName={group.name}
            geoName={`${geo.city}, ${geo.region}`}
          />
        )}
        {screen === "cuisine" && (
          <Cuisine
            guestId={guestId}
            groupId={groupId}
            excludedCuisines={group.excludedCuisines}
          />
        )}
      </div>
    </div>
  );
}
