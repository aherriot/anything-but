import { render, screen } from "@testing-library/react";
import LoadingScreen from "./LoadingScreen";

describe("LoadingScreen", () => {
  it("exposes an accessible, live status with the default label", () => {
    render(<LoadingScreen />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading…");
  });

  it("renders a custom label", () => {
    render(<LoadingScreen label="Loading your group…" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your group…",
    );
  });
});
