/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

// The route captures process.env.GOOGLE_PLACES_API_KEY at module load, so each
// test imports a fresh copy of the module with the env configured as needed.
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

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe("GET /api/places/autocomplete", () => {
  it("returns 500 when the API key is not configured", async () => {
    const { GET } = await loadRoute(undefined);
    const res = await GET(req("http://localhost/api/places/autocomplete?query=paris"));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ success: false, data: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns an empty list for a blank query without calling Google", async () => {
    const { GET } = await loadRoute("test-key");
    const res = await GET(req("http://localhost/api/places/autocomplete?query=%20"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, data: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("maps Google suggestions to {placeId, text}", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestions: [
          { placePrediction: { placeId: "p1", text: { text: "Paris, France" } } },
          { placePrediction: { placeId: "p2", text: { text: "Paris, TX" } } },
        ],
      }),
    });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req("http://localhost/api/places/autocomplete?query=paris"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: [
        { placeId: "p1", text: "Paris, France" },
        { placeId: "p2", text: "Paris, TX" },
      ],
    });
  });

  it("returns an empty list when Google has no suggestions", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req("http://localhost/api/places/autocomplete?query=zzz"));

    await expect(res.json()).resolves.toEqual({ success: true, data: [] });
  });

  it("returns 500 when Google responds with an error status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "rate limited",
    });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req("http://localhost/api/places/autocomplete?query=paris"));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });
});
