import { renderHook, waitFor } from "@testing-library/react";
import { useLocationSearch } from "./useLocationSearch";

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

function resolveWith(body: unknown, { ok = true, status = 200 } = {}) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  });
}

describe("useLocationSearch", () => {
  it("does not fetch and returns no results for an empty query", () => {
    const { result } = renderHook(() => useLocationSearch("", 0));

    expect(result.current.locations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and returns locations for a non-empty query", async () => {
    const locations = [{ placeId: "p1", text: "Paris, France" }];
    resolveWith({ success: true, data: locations });

    const { result } = renderHook(() => useLocationSearch("paris", 0));

    await waitFor(() => expect(result.current.locations).toEqual(locations));
    expect(result.current.error).toBeNull();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/places/autocomplete");
    expect(calledUrl).toContain("query=paris");
  });

  it("surfaces an error when the API responds with success: false", async () => {
    resolveWith({ success: false, error: "quota exceeded" });

    const { result } = renderHook(() => useLocationSearch("paris", 0));

    await waitFor(() => expect(result.current.error).toBe("quota exceeded"));
    expect(result.current.locations).toEqual([]);
  });

  it("surfaces an error on a non-ok HTTP response", async () => {
    resolveWith({}, { ok: false, status: 500 });

    const { result } = renderHook(() => useLocationSearch("paris", 0));

    await waitFor(() => expect(result.current.error).toContain("500"));
  });

  it("clears results when the query becomes empty", async () => {
    const locations = [{ placeId: "p1", text: "Paris, France" }];
    resolveWith({ success: true, data: locations });

    const { result, rerender } = renderHook(
      ({ q }) => useLocationSearch(q, 0),
      { initialProps: { q: "paris" } },
    );

    await waitFor(() => expect(result.current.locations).toEqual(locations));

    rerender({ q: "" });
    await waitFor(() => expect(result.current.locations).toEqual([]));
  });
});
