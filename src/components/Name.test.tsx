import { render, screen, fireEvent } from "@testing-library/react";
import Name from "./Name";

const transact = jest.fn().mockResolvedValue(undefined);
const update = jest.fn(() => ({ __op: "update" }));

// db is a module-level singleton that talks to InstantDB; mock it so the
// component can render and "save" without a backend.
jest.mock("../utils/db", () => ({
  __esModule: true,
  default: {
    useAuth: () => ({ user: { id: "u1" } }),
    transact: (...args: unknown[]) => transact(...args),
    tx: new Proxy({}, { get: () => new Proxy({}, { get: () => ({ update }) }) }),
  },
}));

beforeEach(() => {
  transact.mockClear();
  update.mockClear();
});

describe("Name", () => {
  it("disables submit until a name is entered", () => {
    render(<Name name="" setChangeName={jest.fn()} />);
    expect(screen.getByRole("button", { name: /get started/i })).toBeDisabled();
  });

  it("enables submit once a name is typed", () => {
    render(<Name name="" setChangeName={jest.fn()} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Ada" },
    });
    expect(
      screen.getByRole("button", { name: /get started/i }),
    ).toBeEnabled();
  });

  it("saves a trimmed name on submit", async () => {
    const setChangeName = jest.fn();
    render(<Name name="Ada" setChangeName={setChangeName} />);

    fireEvent.click(screen.getByRole("button", { name: /get started/i }));

    expect(update).toHaveBeenCalledWith({ name: "Ada" });
    expect(transact).toHaveBeenCalledTimes(1);
  });

  it("returns to the previous view via Back", () => {
    const setChangeName = jest.fn();
    render(<Name name="Ada" setChangeName={setChangeName} />);

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(setChangeName).toHaveBeenCalledWith(false);
  });
});
