import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API key is not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const photoReference = searchParams.get("photoReference");
    const maxWidth = searchParams.get("maxWidth") || "400";
    const maxHeight = searchParams.get("maxHeight") || "400";

    if (!photoReference) {
      return NextResponse.json(
        { error: "photoReference parameter is required" },
        { status: 400 },
      );
    }

    // Construct the Google Places Photo API URL
    const photoUrl = `https://places.googleapis.com/v1/${photoReference}/media?key=${GOOGLE_API_KEY}&maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}`;

    // Fetch the image from Google
    const response = await fetch(photoUrl, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch photo from Google Places API" },
        { status: response.status },
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Photo API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
