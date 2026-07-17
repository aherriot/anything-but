/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

async function loadRoute(apiKey: string | undefined) {
  jest.resetModules();
  if (apiKey === undefined) {
    delete process.env.GOOGLE_PLACES_API_KEY;
  } else {
    process.env.GOOGLE_PLACES_API_KEY = apiKey;
  }
  return import("./route");
}

function req(url: string) {
  return { url } as unknown as NextRequest;
}

function imageResponse(contentType = "image/png") {
  return {
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
    headers: { get: () => contentType },
  };
}

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

const base = "http://localhost/api/places/photo";

describe("GET /api/places/photo", () => {
  it("returns 500 when the API key is not configured", async () => {
    const { GET } = await loadRoute(undefined);
    const res = await GET(req(`${base}?photoReference=places/x/photos/y`));
    expect(res.status).toBe(500);
  });

  it("returns 400 when photoReference is missing", async () => {
    const { GET } = await loadRoute("test-key");
    const res = await GET(req(base));
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and returns the image with the right content type", async () => {
    mockFetch.mockResolvedValueOnce(imageResponse("image/jpeg"));

    const { GET } = await loadRoute("test-key");
    const res = await GET(
      req(`${base}?photoReference=places/abc/photos/def&maxWidth=800`),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("sets long-lived, CDN-cacheable headers so the edge dedupes repeats", async () => {
    mockFetch.mockResolvedValueOnce(imageResponse());

    const { GET } = await loadRoute("test-key");
    const res = await GET(
      req(`${base}?photoReference=places/abc/photos/def&maxWidth=400&maxHeight=400`),
    );

    const cacheControl = res.headers.get("Cache-Control") ?? "";
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("s-maxage=31536000");
    expect(cacheControl).toContain("immutable");
  });

  it("keeps the API key out of the upstream query string", async () => {
    mockFetch.mockResolvedValueOnce(imageResponse());

    const { GET } = await loadRoute("test-key");
    await GET(req(`${base}?photoReference=places/abc/photos/def`));

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("key=");
    expect(calledUrl).toContain("places.googleapis.com");
  });

  it("propagates Google's status when the photo fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?photoReference=places/abc/photos/def`));

    expect(res.status).toBe(403);
  });

  it.each([
    ["a path-traversal attempt", "../../../secret"],
    ["an injected query string", "places/x/photos/y?extra=1"],
    ["an extra path segment", "places/x/photos/y/media"],
    ["an unexpected shape", "not-a-photo-name"],
  ])("rejects %s without calling Google (400)", async (_label, reference) => {
    const { GET } = await loadRoute("test-key");
    const res = await GET(
      req(`${base}?photoReference=${encodeURIComponent(reference)}`),
    );

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric dimension (400)", async () => {
    const { GET } = await loadRoute("test-key");
    const res = await GET(
      req(`${base}?photoReference=places/abc/photos/def&maxWidth=huge`),
    );

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("clamps oversized dimensions to Google's maximum", async () => {
    mockFetch.mockResolvedValueOnce(imageResponse());

    const { GET } = await loadRoute("test-key");
    await GET(
      req(`${base}?photoReference=places/abc/photos/def&maxWidth=99999`),
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("maxWidthPx=4800");
    expect(calledUrl).not.toContain("99999");
  });
});
