import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Max cache size in bytes (default 50MB)
const MAX_CACHE_BYTES = parseInt(
  process.env.PHOTO_CACHE_MAX_BYTES || String(50 * 1024 * 1024),
  10,
);

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  buffer: ArrayBuffer;
  contentType: string;
  timestamp: number;
  size: number;
}

/** LRU cache keyed by canonical search-param string */
const cache = new Map<string, CacheEntry>();
let currentCacheBytes = 0;

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
      currentCacheBytes -= entry.size;
    }
  }
}

function evictLRU() {
  // Map iteration order is insertion order; least-recently-used is first
  while (currentCacheBytes > MAX_CACHE_BYTES && cache.size > 0) {
    const oldest = cache.keys().next().value!;
    const entry = cache.get(oldest)!;
    cache.delete(oldest);
    currentCacheBytes -= entry.size;
  }
}

function cacheGet(key: string): CacheEntry | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  // Expired – remove and miss
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    currentCacheBytes -= entry.size;
    return undefined;
  }

  // Move to end (most-recently-used)
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function cachePut(key: string, buffer: ArrayBuffer, contentType: string) {
  // Remove existing entry if present
  const existing = cache.get(key);
  if (existing) {
    cache.delete(key);
    currentCacheBytes -= existing.size;
  }

  const size = buffer.byteLength;
  currentCacheBytes += size;

  cache.set(key, { buffer, contentType, timestamp: Date.now(), size });

  // Evict stale entries first, then LRU if still over budget
  evictExpired();
  evictLRU();
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
    const maxWidth = searchParams.get("maxWidth") || "400";
    const maxHeight = searchParams.get("maxHeight") || "400";

    if (!photoReference) {
      return NextResponse.json(
        { error: "photoReference parameter is required" },
        { status: 400 },
      );
    }

    // Build a stable cache key from the relevant params
    const cacheKey = `${photoReference}|${maxWidth}|${maxHeight}`;

    // Return from cache if available
    const cached = cacheGet(cacheKey);
    if (cached) {
      return new NextResponse(cached.buffer, {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
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

    // Store in cache
    cachePut(cacheKey, imageBuffer, contentType);

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
