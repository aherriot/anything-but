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

const base = "http://localhost/api/places/geocode";

describe("GET /api/places/geocode", () => {
  it("returns 500 when the API key is not configured", async () => {
    const { GET } = await loadRoute(undefined);
    const res = await GET(req(`${base}?lat=1&lng=2`));
    expect(res.status).toBe(500);
  });

  it("returns 400 when lat or lng is missing", async () => {
    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?lat=1`));
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns the first result on a successful geocode", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "OK",
        results: [{ place_id: "abc", formatted_address: "Paris, France" }],
      }),
    });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?lat=48.85&lng=2.35`));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: { placeId: "abc", text: "Paris, France" },
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to an unfiltered lookup when the first returns no results", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "ZERO_RESULTS" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [{ place_id: "fallback", formatted_address: "Somewhere" }],
        }),
      });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?lat=1&lng=2`));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: { placeId: "fallback", text: "Somewhere" },
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns 404 when even the fallback finds nothing", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "ZERO_RESULTS" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "ZERO_RESULTS" }) });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?lat=1&lng=2`));

    expect(res.status).toBe(404);
  });

  it("returns 500 when Google responds with an error status", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => "boom" });

    const { GET } = await loadRoute("test-key");
    const res = await GET(req(`${base}?lat=1&lng=2`));

    expect(res.status).toBe(500);
  });
});
