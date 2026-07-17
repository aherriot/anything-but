import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// A Google photo reference always resolves to the same image, so for a given
// (reference, size) the response is immutable. Rather than cache in process
// memory — which is unreliable on serverless, where each invocation may be a
// cold, isolated instance — we let the CDN and the browser cache the bytes:
//   - max-age: browsers keep it for a day.
//   - s-maxage: the shared CDN keeps it for a year, so one cold fetch from
//     Google warms the edge for every subsequent viewer.
//   - immutable: browsers won't revalidate while it's fresh.
// Only successful responses carry this header; errors stay uncached.
const IMAGE_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=31536000, immutable";

// A Google Places (New) photo resource name looks like
// `places/<placeId>/photos/<photoId>`, where each id is a URL-safe token.
// Validating against this shape before interpolating it into the upstream URL
// prevents path traversal / query injection into the Google request.
const PHOTO_REFERENCE_PATTERN =
  /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

// Google supports photo dimensions up to 4800px; keep requests within that
// range so a caller can't ask for absurdly large (costly) images.
const MAX_PHOTO_DIMENSION = 4800;
const DEFAULT_PHOTO_DIMENSION = 400;

/**
 * Parse a dimension query param. Returns a clamped integer, or null if the
 * value is present but not a non-negative integer.
 */
function parseDimension(value: string | null): number | null {
  if (value === null) return DEFAULT_PHOTO_DIMENSION;
  if (!/^\d+$/.test(value)) return null;
  const n = parseInt(value, 10);
  return Math.min(Math.max(n, 1), MAX_PHOTO_DIMENSION);
}

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

    if (!photoReference) {
      return NextResponse.json(
        { error: "photoReference parameter is required" },
        { status: 400 },
      );
    }

    if (!PHOTO_REFERENCE_PATTERN.test(photoReference)) {
      return NextResponse.json(
        { error: "photoReference is malformed" },
        { status: 400 },
      );
    }

    const maxWidth = parseDimension(searchParams.get("maxWidth"));
    const maxHeight = parseDimension(searchParams.get("maxHeight"));

    if (maxWidth === null || maxHeight === null) {
      return NextResponse.json(
        { error: "maxWidth and maxHeight must be positive integers" },
        { status: 400 },
      );
    }

    // Construct the Google Places Photo API URL. The API key travels in the
    // header only, never the query string.
    const photoUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}`;

    const response = await fetch(photoUrl, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch photo from Google Places API" },
        { status: response.status },
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": IMAGE_CACHE_CONTROL,
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
