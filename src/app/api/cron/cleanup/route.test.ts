/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

jest.mock("../../../../utils/db-admin", () => {
  const deleteOp = jest.fn(() => ({ op: "delete" }));
  return {
    __esModule: true,
    default: {
      query: jest.fn(),
      transact: jest.fn().mockResolvedValue(undefined),
      tx: { groups: new Proxy({}, { get: () => ({ delete: deleteOp }) }) },
    },
  };
});

import adminDb from "@/utils/db-admin";
import { GET } from "./route";

const query = adminDb.query as unknown as jest.Mock;
const transact = adminDb.transact as unknown as jest.Mock;

function req(authHeader: string | null) {
  return {
    headers: { get: (k: string) => (k === "authorization" ? authHeader : null) },
  } as unknown as NextRequest;
}

beforeEach(() => {
  query.mockReset();
  transact.mockReset().mockResolvedValue(undefined);
  process.env.CRON_SECRET = "secret";
});

describe("GET /api/cron/cleanup", () => {
  it("returns 401 without a matching bearer token", async () => {
    const res = await GET(req("Bearer wrong"));
    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it("returns 401 when the authorization header is missing", async () => {
    const res = await GET(req(null));
    expect(res.status).toBe(401);
  });

  it("reports zero deletions when there are no old groups", async () => {
    query.mockResolvedValueOnce({ groups: [] });

    const res = await GET(req("Bearer secret"));

    await expect(res.json()).resolves.toEqual({ deleted: 0 });
    expect(transact).not.toHaveBeenCalled();
  });

  it("deletes old groups and reports the count", async () => {
    query.mockResolvedValueOnce({ groups: [{ id: "g1" }, { id: "g2" }] });

    const res = await GET(req("Bearer secret"));

    await expect(res.json()).resolves.toEqual({ deleted: 2 });
    expect(transact).toHaveBeenCalledTimes(1);
    // It queries for groups older than ~24h.
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        groups: expect.objectContaining({
          $: expect.objectContaining({
            where: expect.objectContaining({
              createdAt: expect.objectContaining({ $lt: expect.any(Number) }),
            }),
          }),
        }),
      }),
    );
  });
});
