import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CachedRestaurant, RestaurantVote } from "@/types";
import RestaurantSwipe from "./RestaurantSwipe";

// db.transact / db.tx are exercised through a light proxy so we can assert what
// a vote writes without a real InstantDB connection. jest.mock is hoisted, so
// the captured mocks must be `mock`-prefixed. Per repo convention jest.mock
// uses a relative path (the "@/" alias isn't honored here).
const mockTransact = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn();

jest.mock("../../../utils/db", () => {
  const op: { update: jest.Mock; link: jest.Mock } = {
    update: jest.fn((...args: unknown[]) => {
      mockUpdate(...args);
      return op;
    }),
    link: jest.fn(() => op),
  };
  return {
    __esModule: true,
    default: {
      transact: (...args: unknown[]) => mockTransact(...args),
      tx: new Proxy({}, { get: () => new Proxy({}, { get: () => op }) }),
    },
  };
});

jest.mock("@instantdb/react", () => ({ id: jest.fn(() => "generated-vote-id") }));

type Vote = RestaurantVote & { restaurantId: string };
type Props = Parameters<typeof RestaurantSwipe>[0];

function restaurant(over: Partial<CachedRestaurant> = {}): CachedRestaurant {
  return {
    id: "r1",
    googlePlaceId: "gpid-r1",
    name: "Test Diner",
    priceRange: "$$",
    website: "#",
    type: "italian_restaurant",
    votes: [],
    ...over,
  };
}

function vote(over: Partial<Vote> = {}): Vote {
  return {
    id: "v1",
    guestId: "g1",
    vote: "yes",
    votedAt: "2026-01-01T00:00:00.000Z",
    restaurantId: "r1",
    ...over,
  };
}

function buildProps(over: Partial<Props> = {}): Props {
  return {
    groupId: "grp1",
    guestId: "g1",
    authToken: "tok-123",
    guests: [{ id: "g1" }],
    cachedRestaurants: [restaurant()],
    allVotes: [],
    fetchStatus: "ready",
    onDismissHint: jest.fn(),
    ...over,
  };
}

function renderSwipe(over: Partial<Props> = {}) {
  const props = buildProps(over);
  return { ...render(<RestaurantSwipe {...props} />), props };
}

beforeEach(() => {
  mockTransact.mockClear();
  mockUpdate.mockClear();
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});

describe("RestaurantSwipe", () => {
  it("presents the first unvoted restaurant to the guest", () => {
    renderSwipe({ fetchStatus: "exhausted" });

    expect(
      screen.getByRole("heading", { name: /would you eat here/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test Diner")).toBeInTheDocument();
  });

  it("writes a 'yes' vote and dismisses the invite hint when voting", async () => {
    const { props } = renderSwipe({ fetchStatus: "exhausted" });

    fireEvent.click(
      screen.getByRole("button", { name: /yes, i would eat here/i }),
    );

    await waitFor(() => expect(mockTransact).toHaveBeenCalledTimes(1));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ guestId: "g1", vote: "yes" }),
    );
    expect(props.onDismissHint).toHaveBeenCalled();
  });

  it("offers a cuisine veto for a typed restaurant", () => {
    renderSwipe({ fetchStatus: "exhausted" });

    expect(
      screen.getByRole("button", { name: /don't want.*italian/i }),
    ).toBeInTheDocument();
  });

  it("hides the cuisine veto for a generic restaurant", () => {
    renderSwipe({
      fetchStatus: "exhausted",
      cachedRestaurants: [restaurant({ type: "generic_restaurant" })],
    });

    expect(
      screen.queryByRole("button", { name: /don't want/i }),
    ).not.toBeInTheDocument();
  });

  it("celebrates a consensus once every guest has voted yes", () => {
    renderSwipe({
      fetchStatus: "exhausted",
      guests: [{ id: "g1" }, { id: "g2" }],
      allVotes: [vote({ guestId: "g1" }), vote({ id: "v2", guestId: "g2" })],
    });

    expect(
      screen.getByRole("heading", { name: /everyone agrees/i }),
    ).toBeInTheDocument();
  });

  it("shows the no-agreement summary when the options are exhausted", () => {
    renderSwipe({
      fetchStatus: "exhausted",
      allVotes: [vote({ vote: "no_restaurant" })],
    });

    expect(
      screen.getByRole("heading", { name: /no agreement found/i }),
    ).toBeInTheDocument();
  });

  it("auto-fetches more restaurants (with auth) when running low", async () => {
    renderSwipe({ fetchStatus: "ready" });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/groups/grp1/prefetch");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok-123");
  });
});
