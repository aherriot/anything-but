import { useState, useEffect } from "react";

export interface PlaceDetails {
  id: string;
  name: string;
  city: string;
  region: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface PlaceDetailsResponse {
  success: boolean;
  data: PlaceDetails | null;
  error?: string;
}

export const usePlaceDetails = (placeId: string | null | undefined) => {
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) {
      setPlaceDetails(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchPlaceDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("placeId", placeId);

        const response = await fetch(
          `/api/places/details?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: PlaceDetailsResponse = await response.json();

        if (result.success && result.data) {
          setPlaceDetails(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch place details");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Error fetching place details:", err);
        setPlaceDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [placeId]);

  return {
    placeDetails,
    isLoading,
    error,
  };
};
