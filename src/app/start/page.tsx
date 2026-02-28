"use client";

import { useEffect, useState } from "react";
import Name from "../../components/Name";
import Location from "./location";
import db from "@/utils/db";

export default function Start() {
  const { isLoading: isAuthLoading, user } = db.useAuth();
  const [changeName, setChangeName] = useState(false);

  // Sign in as guest automatically if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      db.auth.signInAsGuest();
    }
  }, [isAuthLoading, user]);

  // Query the current user's name from $users
  const { data: userData, isLoading: isUserLoading } = db.useQuery(
    user ? { $users: { $: { where: { id: user.id }, limit: 1 } } } : null,
  );

  const name = userData?.$users?.[0]?.name ?? "";

  if (isAuthLoading || !user || isUserLoading) {
    return (
      <div className="min-h-screen max-w-2xl m-auto bg-neutral-900 flex items-center justify-center">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (!name || changeName) {
    return (
      <div className="min-h-screen max-w-2xl m-auto bg-neutral-900">
        <Name name={name} setChangeName={setChangeName} />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl m-auto bg-neutral-900">
      <Location name={name} setChangeName={setChangeName} />
    </div>
  );
}
