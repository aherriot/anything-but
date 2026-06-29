import { render, screen, fireEvent } from "@testing-library/react";
import ErrorState from "./ErrorState";

describe("ErrorState", () => {
  it("renders the default on-brand error copy and a home link", () => {
    render(<ErrorState />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /dropped the plate/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("accepts a custom title and message", () => {
    render(<ErrorState title="Custom title" message="Custom message" />);

    expect(
      screen.getByRole("heading", { name: "Custom title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Custom message")).toBeInTheDocument();
  });

  it("only shows the retry button when onRetry is provided", () => {
    const { rerender } = render(<ErrorState />);
    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();

    const onRetry = jest.fn();
    rerender(<ErrorState onRetry={onRetry} />);

    const retry = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
