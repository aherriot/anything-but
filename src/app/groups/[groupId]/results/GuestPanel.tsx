"use client";

import { useState } from "react";

type GuestSummary = {
  id: string;
  name: string;
  excludedCount: number;
};

type GuestPanelProps = {
  group: {
    id: string;
    name: string;
    createdAt: string | number;
    ownerId: string;
    placeId: string;
    excludedCuisines: {
      id: string;
      guestId: string;
      cuisineId: string;
    }[];
    guests: {
      id: string;
      name?: string | undefined;
      email?: string | undefined;
      imageURL?: string | undefined;
      type?: string | undefined;
    }[];
  };
};

export default function GuestPanel({ group }: GuestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const excludedCuisines = group?.excludedCuisines ?? [];
  const linkedGuests = group?.guests ?? [];

  // Build a map of guestId -> count of excluded cuisines
  const exclusionsByGuest = new Map<string, number>();
  for (const ec of excludedCuisines) {
    exclusionsByGuest.set(
      ec.guestId,
      (exclusionsByGuest.get(ec.guestId) ?? 0) + 1,
    );
  }

  // Build guest summaries from linked guests
  const guests: GuestSummary[] = linkedGuests
    .map((guest) => ({
      id: guest.id,
      name: guest.name || "Anonymous",
      excludedCount: exclusionsByGuest.get(guest.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const guestCount = guests.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-800 border-t border-neutral-700 rounded-t-xl shadow-lg">
          {/* Collapsed header / toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-neutral-750 transition-colors"
          >
            <span className="text-sm font-medium text-neutral-300">
              Choosing a restaurant with{" "}
              <span className="text-primary-400 font-semibold">
                {guestCount}
              </span>{" "}
              {guestCount === 1 ? "person" : "people"}
            </span>
            <svg
              className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>

          {/* Expanded list */}
          {isOpen && (
            <div className="border-t border-neutral-700 max-h-64 overflow-y-auto">
              <ul className="divide-y divide-neutral-700/50">
                {guests.map((guest) => (
                  <li
                    key={guest.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm text-neutral-200">
                      {guest.name}
                    </span>
                    <span className="text-xs text-neutral-400 bg-neutral-700 rounded-full px-2.5 py-0.5">
                      {guest.excludedCount}{" "}
                      {guest.excludedCount === 1 ? "cuisine" : "cuisines"}{" "}
                      excluded
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
