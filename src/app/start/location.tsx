import { useCallback, useState } from "react";
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

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export default function Location({ name, setChangeName }: LocationProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [geoState, setGeoState] = useState<GeoState>({ status: "idle" });
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

  const handleUseMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoState({
        status: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setGeoState({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `/api/places/geocode?lat=${latitude}&lng=${longitude}`,
          );
          const result = await response.json();

          if (result.success && result.data) {
            setSelectedLocation({
              placeId: result.data.placeId,
              text: result.data.text,
            });
            setGeoState({ status: "idle" });
          } else {
            setGeoState({
              status: "error",
              message: result.error || "Could not determine your location.",
            });
          }
        } catch {
          setGeoState({
            status: "error",
            message: "Failed to look up your location. Please try again.",
          });
        }
      },
      (error) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location permission denied. Please allow access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
          default:
            message = "An unknown error occurred.";
        }
        setGeoState({ status: "error", message });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }, []);

  const isGeoLoading = geoState.status === "loading";

  return (
    <div className="flex flex-col gap-4 row-start-2 items-center sm:items-start w-full">
      <h1 className="text-neutral-200 text-xl">
        <span className="text-neutral-100 font-bold">{name}</span>, where do you
        want to find a restaurant?
      </h1>

      {/* Search + GPS row */}
      <div className="flex w-full gap-2 items-start">
        <div className="flex-1 min-w-0">
          <LocationCombobox
            value={selectedLocation}
            onChange={setSelectedLocation}
            placeholder="Search for a city..."
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isGeoLoading}
          aria-label="Use my current location"
          title="Use my current location"
          className="flex-shrink-0 h-13 w-13 flex items-center justify-center rounded-md border-2 border-neutral-300 bg-white text-neutral-500 hover:border-primary-500 hover:text-primary-500 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/10 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeoLoading ? (
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="8" strokeDasharray="2 3" />
            </svg>
          )}
        </button>
      </div>

      {/* GPS error message */}
      {geoState.status === "error" && (
        <p className="text-error text-sm -mt-2" role="alert">
          {geoState.message}
        </p>
      )}

      <div className="flex gap-4 mt-4">
        <Button
          variant="outline"
          semantic="negative"
          onClick={() => setChangeName(true)}
        >
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
