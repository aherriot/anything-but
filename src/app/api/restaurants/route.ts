import { getFilteredCuisines } from "@/utils/cuisine";
import { NextRequest, NextResponse } from "next/server";

// Types for Google Places API Nearby Search response
type GooglePlacePhoto = {
  name: string;
  widthPx: number;
  heightPx: number;
};
type GooglePlace = {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  primaryType: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  editorialSummary?: {
    text: string;
  };
  photos: GooglePlacePhoto[];
};

type GooglePlacesResponse = {
  places: GooglePlace[];
};

type ApiRestaurant = {
  id: string;
  name: string;
  rating: string | null;
  priceRange: string;
  address: string | null;
  phone: string | null;
  description?: string | null;
  website: string;
  latitude?: number;
  longitude?: number;
  type: string;
};

// Google Places API endpoint
const GOOGLE_PLACES_API_URL =
  "https://places.googleapis.com/v1/places:searchNearby";
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_SEARCH_API_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryType",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.editorialSummary",
  "places.photos",
].join(",");

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Places API key is not configured",
          data: null,
        },
        { status: 500 },
      );
    }

    // Get query parameters from the request
    const body = await request.json();
    const { cuisines, latitude, longitude } = body;

    // Validate input
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        {
          success: false,
          error: "latitude and longitude must be numbers",
          data: null,
        },
        { status: 400 },
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "latitude must be between -90 and 90, longitude between -180 and 180",
          data: null,
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(cuisines)) {
      return NextResponse.json(
        {
          success: false,
          error: "cuisines must be an array of strings",
          data: null,
        },
        { status: 400 },
      );
    }

    if (!cuisines.every((c: unknown) => typeof c === "string")) {
      return NextResponse.json(
        {
          success: false,
          error: "Each cuisine must be a string",
          data: null,
        },
        { status: 400 },
      );
    }

    // Build the request body for Google Places API
    const requestBody = {
      includedTypes: ["restaurant"],
      includedPrimaryTypes: getFilteredCuisines(cuisines)?.map(
        (cuisine) => cuisine.id,
      ),
      excludedPrimaryTypes: cuisines,
      maxResultCount: 5,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: 10000.0, // 10km radius
        },
      },
      rankPreference: "POPULARITY",
    };

    let response: Response;
    try {
      // Call Google Places API
      response = await fetch(GOOGLE_PLACES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": GOOGLE_SEARCH_API_FIELD_MASK,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      throw new Error(error instanceof Error ? error.message : String(error));
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", response.status, errorText);
      throw new Error(
        `Google Places API error: ${response.status} ${response.statusText}`,
      );
    }

    const googleData: GooglePlacesResponse = await response.json();

    if (!googleData.places || googleData.places.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          restaurants: [],
          filters: {
            cuisines: cuisines ?? [],
          },
          total: 0,
        },
      });
    }

    // Helper function to map price level
    const mapPriceLevel = (priceLevel?: string): string => {
      const priceLevelMap: { [key: string]: string } = {
        PRICE_LEVEL_FREE: "$",
        PRICE_LEVEL_INEXPENSIVE: "$",
        PRICE_LEVEL_MODERATE: "$$",
        PRICE_LEVEL_EXPENSIVE: "$$$",
        PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
      };
      return priceLevelMap[priceLevel || ""] || "$$";
    };

    // Transform Google Places data into restaurant format
    const restaurants: ApiRestaurant[] = googleData.places.map((place) => ({
      id: place.id,
      name: place.displayName.text,
      rating: place.rating?.toFixed(1) || "N/A",
      priceRange: mapPriceLevel(place.priceLevel),
      address: place.formattedAddress || null,
      phone: place.nationalPhoneNumber ?? null,
      description: place.editorialSummary?.text ?? null,
      website: place.websiteUri || "#",
      type: place.primaryType,
      photoUrl:
        place.photos && place.photos.length > 0
          ? place.photos[0].name
          : undefined,
    }));

    // Return the transformed data
    return NextResponse.json({
      success: true,
      data: {
        restaurants,
        filters: {
          cuisines: cuisines || [],
        },
        total: restaurants.length,
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        data: null,
      },
      { status: 500 },
    );
  }
}
