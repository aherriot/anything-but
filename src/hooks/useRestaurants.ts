import { useState, useEffect, useCallback, useMemo } from "react";
import type { Restaurant, RestaurantApiResponse } from "@/types";

type UseRestaurantsParams = {
  cuisines?: string[];
  latitude?: number;
  longitude?: number;
  enabled?: boolean;
};

export const useRestaurants = ({
  cuisines = [],
  latitude,
  longitude,
  enabled = true,
}: UseRestaurantsParams) => {
  const [data, setData] = useState<RestaurantApiResponse["data"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  // Stabilize cuisines by serializing — avoids infinite re-renders from new array references
  const cuisinesKey = useMemo(() => JSON.stringify(cuisines), [cuisines]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const abortController = new AbortController();

    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/restaurants`, {
          method: "POST",
          body: JSON.stringify({
            latitude,
            longitude,
            cuisines: JSON.parse(cuisinesKey),
          }),
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: RestaurantApiResponse = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch restaurants");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return; // Ignore aborted requests
        }
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Error fetching restaurants:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();

    return () => {
      abortController.abort();
    };
  }, [latitude, longitude, cuisinesKey, enabled, fetchCount]);

  const refetch = useCallback(() => {
    if (enabled) {
      setData(null);
      setError(null);
      setFetchCount((c) => c + 1);
    }
  }, [enabled]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};
