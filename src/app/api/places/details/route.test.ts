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

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

const base = "http://localhost/api/places/details";

describe("GET /api/places/details", () => {
  it("returns 500 when the API key is not configured", async () => {
    const { GET } = await loadRoute(undefined);
    const res = await GET(req(`${base}?placeId=p1`));
    expect(res.status).toBe(500);
  });

  it("returns 400 when placeId is missing", async () => {
    const { GET } = await loadRoute("test-key");
    const res = await GET(req(base));
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("extracts city and region from address components", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "p1",
        displayName: { text: "Eiffel Tower" },
        formattedAddress: "Champ de Mars, Paris",
        location: { latitude: 48.85, longitude: 2.29 },
        addressComponents: [
          { longText: "Paris", shortText: "Paris", types: ["locality"] },
          { longText: "Île-de-France", shortText: "IDF", types: ["administrative_area_level_1"] },
        ],
      }),
    });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?placeId=p1`));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: {
        id: "p1",
        name: "Eiffel Tower",
        city: "Paris",
        region: "IDF",
        formattedAddress: "Champ de Mars, Paris",
        latitude: 48.85,
        longitude: 2.29,
      },
    });
  });

  it("falls back to the display name when there are no address components", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "p2",
        displayName: { text: "Somewhere" },
        formattedAddress: "123 Road",
        location: { latitude: 1, longitude: 2 },
      }),
    });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?placeId=p2`));

    const body = await res.json();
    expect(body.data.city).toBe("Somewhere");
    expect(body.data.region).toBe("");
  });

  it("returns 500 when Google responds with an error status", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, text: async () => "nope" });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?placeId=p1`));

    expect(res.status).toBe(500);
  });
});
