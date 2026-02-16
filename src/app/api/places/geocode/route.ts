import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Google API key is not configured",
          data: null,
        },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        {
          success: false,
          error: "lat and lng parameters are required",
          data: null,
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${GEOCODE_URL}?latlng=${lat},${lng}&result_type=locality|sublocality|neighborhood&key=${GOOGLE_API_KEY}`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Geocoding API error:", response.status, errorText);
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      // Fallback: try without result_type filter
      const fallbackResponse = await fetch(
        `${GEOCODE_URL}?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`,
        { signal: AbortSignal.timeout(10000) },
      );

      if (!fallbackResponse.ok) {
        throw new Error("Failed to reverse geocode location");
      }

      const fallbackData = await fallbackResponse.json();

      if (
        fallbackData.status !== "OK" ||
        !fallbackData.results ||
        fallbackData.results.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Could not determine location from coordinates",
            data: null,
          },
          { status: 404 },
        );
      }

      const result = fallbackData.results[0];
      return NextResponse.json({
        success: true,
        data: {
          placeId: result.place_id,
          text: result.formatted_address,
        },
      });
    }

    const result = data.results[0];
    return NextResponse.json({
      success: true,
      data: {
        placeId: result.place_id,
        text: result.formatted_address,
      },
    });
  } catch (error) {
    console.error("Geocode API Error:", error);
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
