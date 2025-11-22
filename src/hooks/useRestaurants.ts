import { useState, useEffect } from 'react';

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: string;
  priceRange: string;
  address: string;
  phone: string;
  description: string;
  website: string;
  image: string;
}

interface RestaurantApiResponse {
  success: boolean;
  data: {
    restaurants: Restaurant[];
    location: string;
    filters: {
      cuisines: string[];
      diets: string[];
      prices: string[];
    };
    total: number;
  } | null;
  error?: string;
}

interface UseRestaurantsParams {
  location?: string;
  cuisines?: string[];
  diets?: string[];
  prices?: string[];
  enabled?: boolean;
}

export const useRestaurants = ({
  location,
  cuisines = [],
  diets = [],
  prices = [],
  enabled = true,
}: UseRestaurantsParams) => {
  const [data, setData] = useState<RestaurantApiResponse['data']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        
        if (location) params.append('location', location);
        if (cuisines.length > 0) params.append('cuisines', cuisines.join(','));
        if (diets.length > 0) params.append('diets', diets.join(','));
        if (prices.length > 0) params.append('prices', prices.join(','));

        const response = await fetch(`/api/restaurants?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: RestaurantApiResponse = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch restaurants');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        console.error('Error fetching restaurants:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, JSON.stringify(cuisines), JSON.stringify(diets), JSON.stringify(prices), enabled]);

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