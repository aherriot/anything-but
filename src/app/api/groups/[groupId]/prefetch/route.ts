import { NextRequest, NextResponse } from "next/server";
import { id as instantId } from "@instantdb/admin";
import adminDb from "@/utils/db-admin";
import { CUISINE_MAP } from "@/utils/constants";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_PLACES_DETAIL_URL = "https://places.googleapis.com/v1/places";
const GOOGLE_SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryType",
  "places.types",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.editorialSummary",
  "places.photos",
  "nextPageToken",
].join(",");

const BATCH_SIZE = 20;
// const MIN_RESTAURANTS_THRESHOLD = 5;

// In-memory lock to prevent concurrent prefetch calls for the same group
const activePrefetches = new Set<string>();

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
  primaryType?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  editorialSummary?: {
    text: string;
  };
  photos?: GooglePlacePhoto[];
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
  nextPageToken?: string;
};

type PlaceDetailsResponse = {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
};

const mapPriceLevel = (priceLevel?: string): string => {
  const priceLevelMap: Record<string, string> = {
    PRICE_LEVEL_FREE: "$",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return priceLevelMap[priceLevel || ""] || "$$";
};

async function resolveCoordinates(
  placeId: string,
): Promise<{ latitude: number; longitude: number }> {
  const response = await fetch(`${GOOGLE_PLACES_DETAIL_URL}/${placeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY!,
      "X-Goog-FieldMask": "id,location",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve coordinates for place ${placeId}`);
  }

  const data: PlaceDetailsResponse = await response.json();
  return data.location;
}

async function fetchRestaurantBatch(
  latitude: number,
  longitude: number,
  radius: number,
  pageToken?: string,
): Promise<{ places: GooglePlace[]; nextPageToken?: string }> {
  const requestBody: Record<string, unknown> = {
    textQuery: "restaurants",
    locationBias: {
      circle: {
        center: { latitude, longitude },
        radius,
      },
    },
    maxResultCount: BATCH_SIZE,
    rankPreference: "RELEVANCE",
  };

  if (pageToken) {
    requestBody.pageToken = pageToken;
  }

  const response = await fetch(GOOGLE_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY!,
      "X-Goog-FieldMask": GOOGLE_SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Text Search API error:", response.status, errorText);
    throw new Error(
      `Google Text Search API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: GoogleTextSearchResponse = await response.json();
  return {
    places: data.places ?? [],
    nextPageToken: data.nextPageToken,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;

  // Prevent concurrent prefetch calls for the same group
  if (activePrefetches.has(groupId)) {
    return NextResponse.json({
      success: true,
      data: { fetched: 0, message: "Prefetch already in progress" },
    });
  }

  activePrefetches.add(groupId);

  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Google Places API key is not configured" },
        { status: 500 },
      );
    }

    // Get the group from InstantDB to find placeId and fetch state
    const groupData = await adminDb.query({
      groups: {
        $: { where: { id: groupId }, limit: 1 },
        cachedRestaurants: {},
      },
    });

    const group = groupData.groups?.[0];
    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 },
      );
    }

    // Don't re-fetch if already fetching
    if (group.fetchStatus === "fetching") {
      return NextResponse.json({
        success: true,
        data: { fetched: 0, message: "Already fetching" },
      });
    }

    // Parse request body for optional pageToken override
    let bodyPageToken: string | undefined;
    try {
      const body = await request.json();
      bodyPageToken = body.pageToken;
    } catch {
      // No body is fine for initial fetch
    }

    const pageToken =
      bodyPageToken || (group.nextPageToken as string | undefined) || undefined;

    // If exhausted and no explicit pageToken, nothing more to fetch
    if (group.fetchStatus === "exhausted" && !bodyPageToken) {
      return NextResponse.json({
        success: true,
        data: { fetched: 0, message: "No more restaurants available" },
      });
    }

    // Mark as fetching
    await adminDb.transact(
      adminDb.tx.groups[groupId].update({ fetchStatus: "fetching" }),
    );

    // Resolve coordinates from placeId
    const { latitude, longitude } = await resolveCoordinates(
      group.placeId as string,
    );

    // Use group's search radius (default 5000m)
    const searchRadius = (group.searchRadius as number | undefined) ?? 5000;

    // Fetch a batch of restaurants
    const { places, nextPageToken } = await fetchRestaurantBatch(
      latitude,
      longitude,
      searchRadius,
      pageToken,
    );

    // Get existing restaurant googlePlaceIds to avoid duplicates
    const existingIds = new Set(
      (group.cachedRestaurants ?? []).map((r) => r.googlePlaceId as string),
    );

    // Transform and write to InstantDB
    const transactions = [];
    let newCount = 0;

    for (const place of places) {
      if (existingIds.has(place.id)) continue;

      let resolvedType = place.primaryType;
      // If primaryType is missing or not in our cuisine map, try to find a suitable type from the types array
      if (!place.primaryType || !CUISINE_MAP[place.primaryType]) {
        resolvedType =
          place.types?.find((t) => CUISINE_MAP[t]) || "generic_restaurant";
      }

      const restaurantId = instantId();
      transactions.push(
        adminDb.tx.cachedRestaurants[restaurantId]
          .update({
            googlePlaceId: place.id,
            name: place.displayName.text,
            rating: place.rating?.toFixed(1) ?? undefined,
            priceRange: mapPriceLevel(place.priceLevel),
            address: place.formattedAddress ?? undefined,
            phone: place.nationalPhoneNumber ?? undefined,
            description: place.editorialSummary?.text ?? undefined,
            website: place.websiteUri || "#",
            type: resolvedType,
            photoUrl:
              place.photos && place.photos.length > 0
                ? place.photos[0].name
                : undefined,
          })
          .link({ group: groupId }),
      );
      newCount++;
    }

    // Update group fetch state
    transactions.push(
      adminDb.tx.groups[groupId].update({
        fetchStatus: nextPageToken ? "ready" : "exhausted",
        nextPageToken: nextPageToken ?? "",
      }),
    );

    if (transactions.length > 0) {
      await adminDb.transact(transactions);
    }

    return NextResponse.json({
      success: true,
      data: {
        fetched: newCount,
        hasMore: !!nextPageToken,
        totalCached: existingIds.size + newCount,
      },
    });
  } catch (error) {
    console.error("Prefetch API Error:", error);

    // Reset fetch status on error
    try {
      await adminDb.transact(
        adminDb.tx.groups[groupId].update({ fetchStatus: "ready" }),
      );
    } catch {
      // ignore cleanup errors
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 },
    );
  } finally {
    activePrefetches.delete(groupId);
  }
}

// Also expose a GET to check if more restaurants should be fetched
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;

    const groupData = await adminDb.query({
      groups: {
        $: { where: { id: groupId }, limit: 1 },
        cachedRestaurants: {},
        restaurantVotes: {},
      },
    });

    const group = groupData.groups?.[0];
    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 },
      );
    }

    const totalCached = group.cachedRestaurants?.length ?? 0;
    const totalVotes = group.restaurantVotes?.length ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        totalCached,
        totalVotes,
        fetchStatus: group.fetchStatus ?? "ready",
        hasMore: group.fetchStatus !== "exhausted",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
