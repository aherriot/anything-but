"use client";

import { useState, ComponentProps } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "./Button";
import InviteModal from "./InviteModal";

type HeaderProps = ComponentProps<"header"> & {
  showInvite: boolean;
  guestName?: string;
  className?: string;
  showHint?: boolean;
  onDismissHint?: () => void;
};

function Header({
  className,
  showInvite,
  guestName,
  showHint,
  onDismissHint,
  ...props
}: HeaderProps) {
  const [showingInviteQR, setShowingInviteQR] = useState(false);

  return (
    <header
      className={cn("w-full h-16 px-4 sm:mb-8 mb-2 bg-neutral-800", className)}
      {...props}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between h-full">
        <h1 className="text-gradient-warm heading-md font-bold">
          <Link href="/">Anything, but...</Link>
        </h1>
        {showInvite && (
          <div className="relative">
            <Button
              variant="primary"
              onClick={() => {
                setShowingInviteQR((prevVal) => !prevVal);
                onDismissHint?.();
              }}
            >
              Invite
            </Button>

            {/* First-visit hint */}
            {showHint && (
              <div
                className="absolute right-0 top-full mt-2 z-40 animate-bounce"
                role="status"
              >
                <button
                  className="relative bg-neutral-900 border border-accent-500 text-accent-500 text-sm font-medium rounded-lg px-4 py-2 shadow-lg whitespace-nowrap cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissHint?.();
                  }}
                  aria-label="Dismiss hint"
                >
                  {/* Arrow pointing up */}
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-neutral-900 rotate-45 border-t border-l" />
                  Tap to invite friends! ✕
                </button>
              </div>
            )}
          </div>
        )}
        {showInvite && showingInviteQR && (
          <InviteModal
            currentUrl={window.location.href}
            setShowingInviteQR={setShowingInviteQR}
            guestName={guestName}
          />
        )}
      </div>
    </header>
  );
}

export default Header;
