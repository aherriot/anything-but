import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & { label?: string };

function Input({ label, className, type, ...props }: InputProps) {
  return (
    <div className="mt-4">
      {label && (
        <label className="block text-sm font-medium text-neutral-200">
          {label}
        </label>
      )}
      <input type={type} className={cn("input", className)} {...props} />
    </div>
  );
}

export { Input };
