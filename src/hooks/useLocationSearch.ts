import { useState, useEffect, useCallback } from "react";

export interface Location {
  id: string;
  name: string;
  city: string;
  region: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchResponse {
  success: boolean;
  data: Location[];
  error?: string;
}

export const useLocationSearch = (query: string, debounceMs: number = 300) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setLocations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("query", searchQuery);

      const response = await fetch(
        `/api/places/autocomplete?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: LocationSearchResponse = await response.json();

      if (result.success) {
        setLocations(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch locations");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error searching locations:", err);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      searchLocations(query);
    }, debounceMs);

    return () => {
      clearTimeout(timerId);
    };
  }, [query, debounceMs, searchLocations]);

  return {
    locations,
    isLoading,
    error,
  };
};
