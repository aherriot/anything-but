"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { Button } from "./Button";

type HeaderProps = React.ComponentProps<"header"> & {
  showInvite: boolean;
  className?: string;
};

function Header({ className, showInvite, ...props }: HeaderProps) {
  const [showingInviteQR, setShowingInviteQR] = React.useState(false);
  const [currentUrl, setCurrentUrl] = React.useState("");

  React.useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);
  return (
    <header
      className={cn(
        "flex items-center justify-between w-full h-16 px-4 sm:mb-8 mb-2 bg-neutral-800",
        className,
      )}
      {...props}
    >
      <h1 className="text-gradient-warm heading-md font-bold">
        <Link href="/">I&apos;m easy, but...</Link>
      </h1>
      {showInvite && (
        <Button
          variant="primary"
          onClick={() => setShowingInviteQR((prevVal) => !prevVal)}
        >
          Invite
        </Button>
      )}
      {showInvite && showingInviteQR && (
        <div className="fixed inset-4 p-4 bg-black border border-neutral-300 shadow-lg flex flex-col items-center justify-center z-10 max-w-2xl m-auto">
          <h1 className="text-gradient-warm heading-lg font-bold text-center mb-4">
            I&apos;m easy, but...
          </h1>
          <div className="bg-white w-full p-4">
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={currentUrl}
              viewBox={`0 0 256 256`}
            />
          </div>
          <p className="text-center mt-4 font-semibold text-lg text-neutral-400">
            Collaboratively choose a restaurant
          </p>
          <button
            className="btn-primary mt-6"
            onClick={() => setShowingInviteQR(false)}
          >
            Close
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
