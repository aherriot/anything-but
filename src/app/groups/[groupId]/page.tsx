"use client";

import { use, useEffect, useState } from "react";

import RestaurantSwipe from "./RestaurantSwipe";
import db from "@/utils/db";
import Header from "@/components/Header";
import Name from "@/components/Name";
import GuestPanel from "./GuestPanel";

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
      guests: {},
      cachedRestaurants: {
        votes: {},
      },
      restaurantVotes: {},
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

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <div className="text-center text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (isLoading || isAuthLoading || isUserLoading || !user) {
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

  if (!group.placeId) {
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
          in <span className="text-neutral-100">{group.placeName}</span>
        </h1>
        <Name name={name} setChangeName={setChangeName} />
      </div>
    );
  }

  // Map cachedRestaurants to include their votes
  const restaurantsWithVotes = (group.cachedRestaurants ?? []).map((r) => ({
    ...r,
    rating: r.rating ?? undefined,
    address: r.address ?? undefined,
    phone: r.phone ?? undefined,
    description: r.description ?? undefined,
    photoUrl: r.photoUrl ?? undefined,
    votes: (r.votes ?? []).map((v) => ({
      ...v,
      vote: v.vote as "yes" | "no_restaurant" | "no_cuisine",
    })),
  }));

  // Flatten all votes from all restaurants
  const allVotes = restaurantsWithVotes.flatMap((r) =>
    r.votes.map((v) => ({ ...v, restaurantId: r.id })),
  );

  return (
    <div className="min-h-screen bg-neutral-900">
      <Header showInvite />
      <div className="w-2xl max-w-full mx-auto flex flex-col gap-8 px-4 pb-24">
        <RestaurantSwipe
          groupId={groupId}
          guestId={user.id}
          guests={group.guests.map((g) => ({ id: g.id, name: g.name }))}
          cachedRestaurants={restaurantsWithVotes}
          allVotes={allVotes}
          fetchStatus={group.fetchStatus ?? undefined}
        />
      </div>
      <GuestPanel group={group} allVotes={allVotes} />
    </div>
  );
}
