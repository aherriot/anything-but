import { useState } from "react";
import { redirect } from "next/navigation";
import { id } from "@instantdb/react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";

import { Button } from "@/components/ui/button";
import db from "@/utils/db";
import GEOS from "@/data/canada";

type LocationProps = {
  name: string;
  setScreen: (screen: "start" | "location") => void;
};

async function createGroup(name: string, geoId: string) {
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
      geoId,
    })
  );

  redirect(`/groups/${newGroupId}`);
}

export default function Location({ setScreen, name }: LocationProps) {
  const [geoId, setGeoId] = useState<string>("");
  const [query, setQuery] = useState("");

  const filteredLocations =
    query === ""
      ? GEOS
      : GEOS.filter((location) => {
          return (
            location.city.toLowerCase().includes(query.toLowerCase()) ||
            location.region.toLowerCase().includes(query.toLowerCase())
          );
        });

  const sortedLocations = filteredLocations.sort((a, b) =>
    a.city.localeCompare(b.city)
  );

  return (
    <div className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
      <h1 className="text-gray-200 text-xl">
        {name}, where do you want to find a restaurant?
      </h1>
      <Combobox value={geoId} onChange={(value) => setGeoId(value || "")}>
        <div className="relative w-full">
          <div className="relative">
            <ComboboxInput
              className="input pr-10"
              displayValue={(id: string) => {
                const location = GEOS.find((geo) => geo.id === id);
                return location ? `${location.city}, ${location.region}` : "";
              }}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Select your location"
              autoFocus
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="h-5 w-5 text-neutral-400"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </ComboboxButton>
          </div>

          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg border-2 border-neutral-200 focus:outline-none">
            {sortedLocations.length === 0 ? (
              <div className="relative cursor-default select-none py-2 px-4 text-neutral-500">
                No locations found.
              </div>
            ) : (
              sortedLocations.map((location) => (
                <ComboboxOption
                  key={location.id}
                  value={location.id}
                  className="group relative cursor-pointer select-none py-3 px-4 data-[focus]:bg-primary-200 data-[focus]:text-primary-900 text-neutral-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="block truncate font-medium group-data-[selected]:font-semibold group-data-[selected]:text-gray-800">
                      {location.city}, {location.region}
                    </span>
                    <span className="hidden group-data-[selected]:flex items-center text-primary-600">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={() => setScreen("start")}>
          Back
        </Button>
        <Button onClick={() => createGroup(name, geoId)} disabled={!geoId}>
          Jump in
        </Button>
      </div>
    </div>
  );
}
