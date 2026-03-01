import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base styles - common to all buttons
  "rounded-md cursor-pointer",
  {
    variants: {
      variant: {
        // Primary - Main brand orange for primary actions
        primary: "border-none transition-shadow duration-200 hover:shadow-lg",

        // Outline - Tertiary button for special features
        outline: "bg-transparent border",

        // Ghost - Subtle button for less important actions
        ghost: "bg-transparent",
      },
      size: {
        // Small - Secondary actions, mobile
        sm: "py-1 px-4 text-sm",

        // Default - Most common size
        md: "py-2 px-6",

        // Large - Hero CTAs, important actions
        lg: "py-3 px-8 text-lg",
      },
      semantic: {
        positive: "",
        negative: "",
      },
    },
    compoundVariants: [
      {
        semantic: "positive",
        variant: "primary",
        className:
          "bg-primary-500 text-white hover:enabled:bg-primary-600 focus:bg-primary-600 active:enabled:bg-primary-700",
      },
      {
        semantic: "positive",
        variant: "outline",
        className:
          "border-primary-500 text-primary-500 hover:bg-primary-500/20 hover:text-white",
      },
      {
        semantic: "positive",
        variant: "ghost",
        className:
          "text-primary-500 hover:bg-primary-500/10 focus:bg-primary-500/10 active:bg-primary-500/20",
      },
      {
        semantic: "negative",
        variant: "primary",
        className:
          "bg-accent-500 text-white hover:enabled:bg-accent-600 focus:bg-accent-600 active:enabled:bg-accent-700",
      },
      {
        semantic: "negative",
        variant: "outline",
        className:
          "border-accent-500 text-accent-500 hover:enabled:bg-accent-500/20 hover:enabled:text-white",
      },
      {
        semantic: "negative",
        variant: "ghost",
        className:
          "text-accent-400 hover:enabled:bg-accent-400/10 focus:enabled:bg-accent-500/10 active:enabled:bg-accent-500/20",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      semantic: "positive",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Whether the button should take the full width of its container
   */
  fullWidth?: boolean;
  /**
   * Loading state - shows spinner and disables interaction
   */
  loading?: boolean;
  /**
   * Icon to display before the button text
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after the button text
   */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      semantic,
      disabled,
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, semantic }),
          isDisabled && "opacity-30 cursor-not-allowed bg-none",
          fullWidth && "w-full",
          className,
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}

        {!loading && leftIcon && leftIcon}

        {children}

        {!loading && rightIcon && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
