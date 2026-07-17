/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

jest.mock("@instantdb/admin", () => ({ id: jest.fn(() => "generated-id") }));

jest.mock("../../../../../utils/db-admin", () => {
  type Op = { update: jest.Mock; link: jest.Mock; delete: jest.Mock };
  const op: Op = {
    update: jest.fn(() => op),
    link: jest.fn(() => op),
    delete: jest.fn(() => op),
  };
  const namespace = new Proxy({}, { get: () => op });
  return {
    __esModule: true,
    default: {
      query: jest.fn(),
      transact: jest.fn().mockResolvedValue(undefined),
      tx: new Proxy({}, { get: () => namespace }),
      auth: { verifyToken: jest.fn() },
    },
  };
});

import adminDb from "@/utils/db-admin";

const query = adminDb.query as unknown as jest.Mock;
const transact = adminDb.transact as unknown as jest.Mock;
const verifyToken = adminDb.auth.verifyToken as unknown as jest.Mock;
const mockFetch = jest.fn();

// The route captures GOOGLE_PLACES_API_KEY at import; set it before importing.
let POST: typeof import("./route").POST;
let GET: typeof import("./route").GET;

beforeAll(async () => {
  process.env.GOOGLE_PLACES_API_KEY = "test-key";
  const mod = await import("./route");
  POST = mod.POST;
  GET = mod.GET;
});

beforeEach(() => {
  query.mockReset();
  transact.mockReset().mockResolvedValue(undefined);
  verifyToken.mockReset().mockResolvedValue({ id: "u1" });
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

function postReq(body: unknown = {}, token: string | null = "valid-token") {
  return {
    json: async () => body,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "authorization" && token
          ? `Bearer ${token}`
          : null,
    },
  } as unknown as NextRequest;
}

function ctx(groupId = "g1") {
  return { params: Promise.resolve({ groupId }) };
}

describe("POST /api/groups/[groupId]/prefetch", () => {
  it("returns 404 when the group does not exist", async () => {
    query.mockResolvedValueOnce({ groups: [] });

    const res = await POST(postReq(), ctx());

    expect(res.status).toBe(404);
    expect(transact).not.toHaveBeenCalled();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    const res = await POST(postReq({}, null), ctx());

    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is not a member of the group", async () => {
    verifyToken.mockResolvedValueOnce({ id: "outsider" });
    query.mockResolvedValueOnce({
      groups: [{ id: "g1", ownerId: "u1", guests: [{ id: "u1" }] }],
    });

    const res = await POST(postReq(), ctx());

    expect(res.status).toBe(403);
    expect(transact).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("allows a guest who has joined (not just the owner) to prefetch", async () => {
    verifyToken.mockResolvedValueOnce({ id: "guest2" });
    query.mockResolvedValueOnce({
      groups: [
        { id: "g1", ownerId: "u1", guests: [{ id: "guest2" }], fetchStatus: "fetching" },
      ],
    });

    const res = await POST(postReq(), ctx());

    const body = await res.json();
    expect(body.data.message).toBe("Already fetching");
  });

  it("is a no-op when the group is already fetching", async () => {
    query.mockResolvedValueOnce({
      groups: [{ id: "g1", ownerId: "u1", fetchStatus: "fetching" }],
    });

    const res = await POST(postReq(), ctx());

    const body = await res.json();
    expect(body.data.message).toBe("Already fetching");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("is a no-op when exhausted and no explicit page token is given", async () => {
    query.mockResolvedValueOnce({
      groups: [{ id: "g1", ownerId: "u1", fetchStatus: "exhausted" }],
    });

    const res = await POST(postReq(), ctx());

    const body = await res.json();
    expect(body.data.message).toBe("No more restaurants available");
  });

  it("fetches a batch, skips duplicates, and reports counts", async () => {
    query.mockResolvedValueOnce({
      groups: [
        {
          id: "g1",
          ownerId: "u1",
          placeId: "place1",
          fetchStatus: "ready",
          searchRadius: 5000,
          cachedRestaurants: [{ googlePlaceId: "dup" }],
        },
      ],
    });

    // 1st fetch: resolveCoordinates. 2nd fetch: restaurant batch.
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ location: { latitude: 1, longitude: 2 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            { id: "dup", displayName: { text: "Already cached" } },
            {
              id: "new1",
              displayName: { text: "New Sushi" },
              primaryType: "sushi_restaurant",
              rating: 4.5,
              photos: [{ name: "photos/abc" }],
            },
          ],
          nextPageToken: "next-token",
        }),
      });

    const res = await POST(postReq(), ctx());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.fetched).toBe(1); // dup skipped
    expect(body.data.hasMore).toBe(true);
    expect(body.data.totalCached).toBe(2);
    // marked fetching, then wrote the batch
    expect(transact).toHaveBeenCalledTimes(2);
  });

  it("returns 500 and resets fetch status when Google fails", async () => {
    query.mockResolvedValueOnce({
      groups: [{ id: "g1", ownerId: "u1", placeId: "place1", fetchStatus: "ready" }],
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 }); // resolveCoordinates fails

    const res = await POST(postReq(), ctx());

    expect(res.status).toBe(500);
  });
});

describe("GET /api/groups/[groupId]/prefetch", () => {
  it("returns 404 when the group does not exist", async () => {
    query.mockResolvedValueOnce({ groups: [] });

    const res = await GET({} as unknown as NextRequest, ctx());

    expect(res.status).toBe(404);
  });

  it("summarises cached restaurants and votes", async () => {
    query.mockResolvedValueOnce({
      groups: [
        {
          id: "g1",
          fetchStatus: "ready",
          cachedRestaurants: [{}, {}, {}],
          restaurantVotes: [{}],
        },
      ],
    });

    const res = await GET({} as unknown as NextRequest, ctx());

    const body = await res.json();
    expect(body.data).toMatchObject({
      totalCached: 3,
      totalVotes: 1,
      fetchStatus: "ready",
      hasMore: true,
    });
  });
});
