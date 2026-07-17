"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";

import RestaurantSwipe from "./RestaurantSwipe";
import db from "@/utils/db";
import Header from "@/components/Header";
import Name from "@/components/Name";
import ErrorState from "@/components/ErrorState";
import LoadingScreen from "@/components/LoadingScreen";
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

  // Manage the invite hint state — shown once per visit after a delay,
  // dismissed when the user interacts with the invite button or votes.
  const [showHint, setShowHint] = useState(false);
  const hintDismissedRef = useRef(false);

  useEffect(() => {
    if (!group || hintDismissedRef.current) return;
    const timer = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(timer);
  }, [group]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    hintDismissedRef.current = true;
  }, []);

  if (!user || isLoading || isAuthLoading || isUserLoading) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <Header showInvite />
        <LoadingScreen label="Loading your group…" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState message="We couldn't load this group just now. Give it another moment and try again." />
    );
  }

  if (!group) {
    return (
      <ErrorState
        title="Group not found"
        message="This group may have expired — groups are cleared after 24 hours — or the link is incorrect."
      />
    );
  }

  if (!group.placeId) {
    return (
      <ErrorState
        title="No location set"
        message="This group doesn't have a location yet, so we can't find restaurants for it."
      />
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
      <Header
        showInvite
        guestName={name}
        showHint={showHint}
        onDismissHint={dismissHint}
      />
      <div className="w-2xl max-w-full mx-auto flex flex-col md:px-0 px-4 pb-24">
        <RestaurantSwipe
          groupId={groupId}
          guestId={user.id}
          authToken={user.refresh_token}
          guests={group.guests.map((g) => ({ id: g.id, name: g.name }))}
          cachedRestaurants={restaurantsWithVotes}
          allVotes={allVotes}
          fetchStatus={group.fetchStatus ?? undefined}
          onDismissHint={dismissHint}
        />
      </div>
      <GuestPanel group={group} allVotes={allVotes} />
    </div>
  );
}
