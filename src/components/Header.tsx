"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "./Button";
import InviteModal from "./InviteModal";

type HeaderProps = React.ComponentProps<"header"> & {
  showInvite: boolean;
  guestName?: string;
  className?: string;
};

function Header({ className, showInvite, guestName, ...props }: HeaderProps) {
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
        <InviteModal
          currentUrl={currentUrl}
          setShowingInviteQR={setShowingInviteQR}
          guestName={guestName}
        />
      )}
    </header>
  );
}

export default Header;
