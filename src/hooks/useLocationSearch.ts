import { useState, useEffect, useRef } from "react";

export type Location = {
  placeId: string;
  text: string;
};

type LocationSearchResponse = {
  success: boolean;
  data: Location[];
  error?: string;
};

export const useLocationSearch = (query: string, debounceMs: number = 300) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setLocations([]);
      setIsLoading(false);
      return;
    }

    const timerId = setTimeout(async () => {
      // Cancel any previous in-flight request
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("query", query);

        const response = await fetch(
          `/api/places/autocomplete?${params.toString()}`,
          { signal: abortController.signal },
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
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timerId);
      abortControllerRef.current?.abort();
    };
  }, [query, debounceMs]);

  return {
    locations,
    isLoading,
    error,
  };
};
