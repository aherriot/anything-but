import { NextRequest, NextResponse } from "next/server";

// Types for Google Places Autocomplete API response
type AutocompletePrediction = {
  placeId: string;
  text: {
    text: string;
  };
};

interface AutocompleteResponse {
  suggestions: {
    placePrediction: AutocompletePrediction;
  }[];
}

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!GOOGLE_API_KEY) {
      throw new Error(
        "Google Places API key is not configured. Please set GOOGLE_PLACES_API_KEY in your environment variables.",
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
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: ["locality", "neighborhood"],
        // includedRegionCodes: ["ca"], // Restrict to Canada
        languageCode: "en",
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!autocompleteResponse.ok) {
      const errorText = await autocompleteResponse.text();
      console.error(
        "Google Autocomplete API error:",
        autocompleteResponse.status,
        errorText,
      );
      throw new Error(
        `Google Autocomplete API error: ${autocompleteResponse.status}`,
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

    return NextResponse.json({
      success: true,
      data: autocompleteData.suggestions.map((suggestion) => ({
        placeId: suggestion.placePrediction.placeId,
        text: suggestion.placePrediction.text.text,
      })),
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
      { status: 500 },
    );
  }
}
