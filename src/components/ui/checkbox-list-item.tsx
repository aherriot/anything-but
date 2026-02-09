import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxListItemProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  /**
   * When true, shows a positive affirmative style (highlighted when checked).
   * When false (default), shows a negative crossing-off style (strikethrough when checked).
   */
  positive?: boolean;
}

const CheckboxListItem = React.forwardRef<
  HTMLLabelElement,
  CheckboxListItemProps
>(({ id, label, checked, onChange, className, positive = false }, ref) => {
  return (
    <label
      ref={ref}
      htmlFor={id}
      className={cn(
        "relative flex items-center w-full px-6 py-4 cursor-pointer transition-all duration-200",
        "border-b border-neutral-800 hover:bg-primary-500/10",
        "active:bg-primary-500/20",
        "group",
        className,
      )}
    >
      {/* Hidden native checkbox for accessibility */}
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />

      {/* Custom checkbox visual */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded border-2 transition-all duration-200 mr-4",
          "flex items-center justify-center",
          checked
            ? positive
              ? "bg-secondary-500 border-secondary-500"
              : "bg-primary-500 border-primary-500"
            : "bg-white border-neutral-600 group-hover:border-primary-400",
        )}
      >
        {/* Icon - Checkmark for positive, X for negative */}
        {checked &&
          (positive ? (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          ))}
      </div>

      {/* Label with conditional styling */}
      <span
        className={cn(
          "relative text-base font-medium transition-all duration-200 select-none",
          positive
            ? checked
              ? "text-secondary-700 font-semibold"
              : "text-neutral-100 group-hover:text-primary-600"
            : checked
              ? "text-neutral-400"
              : "text-neutral-100 group-hover:text-primary-600",
        )}
      >
        {label}

        {/* Strikethrough line - only shown in negative mode */}
        {!positive && checked && (
          <span
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <span className="w-full border-t-2 border-neutral-600" />
          </span>
        )}
      </span>
    </label>
  );
});

CheckboxListItem.displayName = "CheckboxListItem";

export { CheckboxListItem };
