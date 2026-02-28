import { useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import QRCode from "react-qr-code";
import { Button } from "./Button";

type InviteModalProps = {
  currentUrl: string;
  setShowingInviteQR: (showing: boolean) => void;
  guestName?: string;
};

export default function InviteModal({
  currentUrl,
  setShowingInviteQR,
  guestName,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const copyLinkButtonRef = useRef(null);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <Dialog
      open
      onClose={() => setShowingInviteQR(false)}
      className="relative z-50"
      initialFocus={copyLinkButtonRef}
    >
      {/* Backdrop */}
      <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Dialog */}
        <DialogPanel className="relative w-full max-w-sm sm:max-w-md bg-neutral-800 border border-neutral-700 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Close X */}
          <button
            onClick={() => setShowingInviteQR(false)}
            aria-label="Close invite dialog"
            className="absolute top-1 right-1 z-10 p-5 rounded-full text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="px-6 pt-8 pb-6 flex flex-col items-center">
            <DialogTitle className="text-gradient-warm heading-lg font-bold text-center mb-4">
              Anything, but...
            </DialogTitle>

            {/* QR Code */}
            <div className="bg-white rounded-xl p-4 sm:p-5 w-full max-w-[280px] sm:max-w-[320px] mx-auto">
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={currentUrl}
                viewBox="0 0 256 256"
              />
            </div>

            {/* Tagline */}
            <p className="text-center mt-5 font-semibold text-lg text-neutral-400">
              Choose a restaurant with{" "}
              <span className="text-neutral-100">
                {guestName ? guestName : "friends"}
              </span>
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="primary"
                semantic="positive"
                size="md"
                onClick={handleCopyUrl}
                ref={copyLinkButtonRef}
              >
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
