import { getFilteredCuisines } from "@/utils/utils";
import { NextRequest, NextResponse } from "next/server";

// Types for Google Places API Nearby Search response
interface GooglePlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

interface GooglePlace {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  editorialSummary?: {
    text: string;
  };
  photos?: GooglePlacePhoto[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface GooglePlacesResponse {
  places: GooglePlace[];
}

interface Restaurant {
  id: string;
  name: string;
  rating: string;
  priceRange: string;
  address: string;
  phone: string;
  description: string;
  website: string;
  latitude?: number;
  longitude?: number;
}

// Google Places API endpoint
const GOOGLE_PLACES_API_URL =
  "https://places.googleapis.com/v1/places:searchNearby";
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!GOOGLE_API_KEY) {
      throw new Error(
        "Google Places API key is not configured. Please set GOOGLE_PLACES_API_KEY in your environment variables."
      );
    }

    // Get query parameters from the request
    const body = await request.json();
    const { cuisines, latitude, longitude } = body;

    // Build the request body for Google Places API
    const requestBody = {
      includedTypes: ["restaurant"],
      includedPrimaryTypes: getFilteredCuisines(cuisines)?.map(
        (cuisine) => cuisine.id
      ),
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
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.editorialSummary,places.photos,places.location",
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
        `Google Places API error: ${response.status} ${response.statusText}`
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
    const restaurants: Restaurant[] = googleData.places.map((place) => ({
      id: place.id,
      name: place.displayName.text,
      rating: place.rating?.toFixed(1) || "N/A",
      priceRange: mapPriceLevel(place.priceLevel),
      address: place.formattedAddress || "Address not available",
      phone:
        place.nationalPhoneNumber ||
        place.internationalPhoneNumber ||
        "Phone not available",
      description:
        place.editorialSummary?.text ||
        `A restaurant${place.userRatingCount ? ` with ${place.userRatingCount} reviews` : ""}.`,
      website: place.websiteUri || "#",
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    }));

    // Filter by cuisines if specified
    // if (cuisines) {
    //   restaurants = restaurants.filter((restaurant) =>
    //     cuisines.some((cuisine: string) =>
    //       restaurant.cuisine.toLowerCase().includes(cuisine.trim())
    //     )
    //   );
    // }

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
      { status: 500 }
    );
  }
}
