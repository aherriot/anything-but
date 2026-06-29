import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "./error";

describe("app error boundary", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders the friendly error screen and logs the error", () => {
    const error = new Error("boom");
    render(<ErrorBoundary error={error} reset={jest.fn()} />);

    expect(
      screen.getByRole("heading", { name: /dropped the plate/i }),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(error);
  });

  it("wires the retry button to reset", () => {
    const reset = jest.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
