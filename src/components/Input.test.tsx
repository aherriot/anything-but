import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("renders a label when provided", () => {
    render(<Input label="Your name" />);
    expect(screen.getByText("Your name")).toBeInTheDocument();
  });

  it("renders without a label", () => {
    render(<Input placeholder="Search" />);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("forwards value and change events", () => {
    const onChange = jest.fn();
    render(<Input placeholder="Search" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "pizza" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
