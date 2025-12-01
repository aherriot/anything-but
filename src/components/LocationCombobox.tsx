"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { useLocationSearch, Location } from "@/hooks/useLocationSearch";

interface LocationComboboxProps {
  value: Location | null;
  onChange: (location: Location | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function LocationCombobox({
  value,
  onChange,
  placeholder = "Search for a city...",
  autoFocus = false,
  className = "",
}: LocationComboboxProps) {
  const [query, setQuery] = useState("");
  const { locations, isLoading, error } = useLocationSearch(query);

  return (
    <Combobox value={value} onChange={onChange}>
      <div className={`relative w-full ${className}`}>
        <div className="relative">
          <ComboboxInput
            className="input pr-10"
            displayValue={(location: Location | null) => {
              return location ? `${location.city}, ${location.region}` : "";
            }}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isLoading ? (
              <svg
                className="h-5 w-5 text-neutral-400 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
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
            )}
          </ComboboxButton>
        </div>

        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg border-2 border-neutral-200 focus:outline-none">
          {error ? (
            <div className="relative cursor-default select-none py-2 px-4 text-error">
              Error: {error}
            </div>
          ) : query.length === 0 ? (
            <div className="relative cursor-default select-none py-2 px-4 text-neutral-500">
              Start typing to search for a city...
            </div>
          ) : isLoading ? (
            <div className="relative cursor-default select-none py-2 px-4 text-neutral-500">
              Searching...
            </div>
          ) : locations.length === 0 ? (
            <div className="relative cursor-default select-none py-2 px-4 text-neutral-500">
              No locations found.
            </div>
          ) : (
            locations.map((location) => (
              <ComboboxOption
                key={location.id}
                value={location}
                className="group relative cursor-pointer select-none py-3 px-4 data-[focus]:bg-primary-200 data-[focus]:text-primary-900 text-neutral-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="block truncate font-medium group-data-[selected]:font-semibold group-data-[selected]:text-gray-800">
                      {location.city}, {location.region}
                    </span>
                    <span className="block truncate text-xs text-neutral-400 group-data-[focus]:text-neutral-600">
                      {location.formattedAddress}
                    </span>
                  </div>
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
  );
}
