import { NextRequest, NextResponse } from "next/server";

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
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");

    if (!placeId) {
      return NextResponse.json(
        {
          success: false,
          error: "placeId parameter is required",
          data: null,
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${PLACE_DETAILS_URL}/${placeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,location,addressComponents",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Google Place Details API error:",
        response.status,
        errorText,
      );
      throw new Error(`Google Place Details API error: ${response.status}`);
    }

    const placeDetails: PlaceDetailsResponse = await response.json();

    // Extract city and region from address components
    let city = "";
    let region = "";

    if (placeDetails.addressComponents) {
      for (const component of placeDetails.addressComponents) {
        if (component.types.includes("locality")) {
          city = component.longText;
        }
        if (component.types.includes("administrative_area_level_1")) {
          region = component.shortText;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: placeDetails.id,
        name: placeDetails.displayName.text,
        city: city || placeDetails.displayName.text,
        region: region,
        formattedAddress: placeDetails.formattedAddress,
        latitude: placeDetails.location.latitude,
        longitude: placeDetails.location.longitude,
      },
    });
  } catch (error) {
    console.error("Place Details API Error:", error);

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
