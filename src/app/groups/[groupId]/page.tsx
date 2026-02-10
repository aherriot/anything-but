"use client";

import { use, useEffect, useState } from "react";
import { usePlaceDetails } from "@/hooks/usePlaceDetails";

import Cuisine from "./Cuisine";
import db from "@/utils/db";
import Header from "@/components/ui/header";
import Name from "@/components/Name";

export default function Groups({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { isLoading: isAuthLoading, user } = db.useAuth();
  const [changeName, setChangeName] = useState(false);

  // Sign in as guest automatically if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      db.auth.signInAsGuest();
    }
  }, [isAuthLoading, user]);

  const { isLoading, error, data } = db.useQuery({
    groups: {
      $: { where: { id: groupId }, limit: 1 },
      excludedCuisines: {},
      guests: {},
    },
  });

  // Query the current user's name from $users
  const { isLoading: isUserLoading, data: userData } = db.useQuery(
    user ? { $users: { $: { where: { id: user.id }, limit: 1 } } } : null,
  );

  const isAlreadyLinked =
    user &&
    data?.groups?.[0]?.guests.find((guest) => guest.id === user.id) != null;

  useEffect(() => {
    if (user && groupId && !isAlreadyLinked) {
      db.transact(db.tx.groups[groupId].link({ guests: user.id }));
    }
  }, [user, groupId, isAlreadyLinked]);

  const name = userData?.$users?.[0]?.name ?? "";

  const group = data?.groups?.[0];

  const {
    placeDetails: geo,
    isLoading: isPlaceLoading,
    error: placeError,
  } = usePlaceDetails(group?.placeId);

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div className="text-center text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (isLoading || isPlaceLoading || isAuthLoading || isUserLoading || !user) {
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

  if (!name || changeName) {
    return (
      <div className="min-h-screen max-w-2xl m-auto p-8 bg-neutral-900">
        <h1 className="text-4xl font-bold text-neutral-500 px-4 text-center max-w-2xl">
          Choose a restaurant
          <br />
          with <span className="text-neutral-100">{group.name}</span>
          <br />
          in <span className="text-neutral-100">{geo.name}</span>
        </h1>
        <Name name={name} setChangeName={setChangeName} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <Header showInvite />
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <Cuisine
          guestId={user.id}
          groupId={groupId}
          excludedCuisines={group.excludedCuisines}
        />
      </div>
    </div>
  );
}
