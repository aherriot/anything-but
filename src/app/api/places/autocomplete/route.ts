import { NextRequest, NextResponse } from "next/server";

// Types for Google Places Autocomplete API response
interface AutocompletePrediction {
  placeId: string;
  text: {
    text: string;
  };
  structuredFormat: {
    mainText: {
      text: string;
    };
    secondaryText: {
      text: string;
    };
  };
}

interface AutocompleteResponse {
  suggestions: {
    placePrediction: AutocompletePrediction;
  }[];
}

interface PlaceDetailsResponse {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface LocationResult {
  id: string;
  name: string;
  city: string;
  region: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!GOOGLE_API_KEY) {
      throw new Error(
        "Google Places API key is not configured. Please set GOOGLE_PLACES_API_KEY in your environment variables."
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Call Google Places Autocomplete API
    const autocompleteResponse = await fetch(AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: ["locality", "administrative_area_level_1"],
        includedRegionCodes: ["ca"], // Restrict to Canada
        languageCode: "en",
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!autocompleteResponse.ok) {
      const errorText = await autocompleteResponse.text();
      console.error(
        "Google Autocomplete API error:",
        autocompleteResponse.status,
        errorText
      );
      throw new Error(
        `Google Autocomplete API error: ${autocompleteResponse.status}`
      );
    }

    const autocompleteData: AutocompleteResponse =
      await autocompleteResponse.json();

    if (
      !autocompleteData.suggestions ||
      autocompleteData.suggestions.length === 0
    ) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Fetch details for each place to get coordinates
    const locationPromises = autocompleteData.suggestions
      .slice(0, 10) // Limit to 10 results
      .map(async (suggestion) => {
        const placeId = suggestion.placePrediction.placeId;

        try {
          const detailsResponse = await fetch(
            `${PLACE_DETAILS_URL}/${placeId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
              },
              signal: AbortSignal.timeout(10000),
            }
          );

          if (!detailsResponse.ok) {
            console.error(
              `Failed to fetch details for place ${placeId}:`,
              detailsResponse.status
            );
            return null;
          }

          const placeDetails: PlaceDetailsResponse =
            await detailsResponse.json();

          // Parse city and region from the prediction
          const mainText =
            suggestion.placePrediction.structuredFormat.mainText.text;
          const secondaryText =
            suggestion.placePrediction.structuredFormat.secondaryText.text;

          const locationResult: LocationResult = {
            id: placeDetails.id,
            name: placeDetails.displayName.text,
            city: mainText,
            region: secondaryText,
            formattedAddress: placeDetails.formattedAddress,
            latitude: placeDetails.location.latitude,
            longitude: placeDetails.location.longitude,
          };

          return locationResult;
        } catch (error) {
          console.error(`Error fetching details for place ${placeId}:`, error);
          return null;
        }
      });

    const locations = (await Promise.all(locationPromises)).filter(
      (loc): loc is LocationResult => loc !== null
    );

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("Autocomplete API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        data: [],
      },
      { status: 500 }
    );
  }
}
