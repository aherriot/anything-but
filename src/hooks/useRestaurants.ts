import { useState, useEffect } from "react";

type Restaurant = {
  id: string;
  type: string;
  name: string;
  cuisine: string;
  rating: string;
  priceRange: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  website: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
};

type RestaurantApiResponse = {
  success: boolean;
  data: {
    restaurants: Restaurant[];
    filters: {
      cuisines: string[];
    };
    total: number;
  } | null;
  error?: string;
};

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

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/restaurants`, {
          method: "POST",
          body: JSON.stringify({ latitude, longitude, cuisines }),
          headers: {
            "Content-Type": "application/json",
          },
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
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Error fetching restaurants:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [latitude, longitude, cuisines, enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      if (enabled) {
        setData(null);
        setError(null);
        // Trigger the useEffect by updating a dependency
      }
    },
  };
};

export type { Restaurant, RestaurantApiResponse };
