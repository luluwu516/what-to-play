import { useState } from "react";

// On iOS, an installed (home-screen) PWA is exempt from Safari's eviction of
// script-writable storage — so nudging users to "Add to Home Screen" is the
// most reliable way to keep their collection from vanishing. iOS has no
// programmatic install prompt, so we show short manual instructions instead.
// Only shows in iOS Safari, when not already installed, and until dismissed.
const DISMISS_KEY = "wtp-install-hint-dismissed";

function shouldShow(): boolean {
  if (typeof navigator === "undefined") return false;
  if (localStorage.getItem(DISMISS_KEY)) return false;

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as desktop Safari but is still touch.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;

  // "Add to Home Screen" only exists in Safari, not Chrome/Firefox on iOS.
  if (/CriOS|FxiOS/.test(ua)) return false;

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's non-standard flag for home-screen apps.
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return !standalone;
}

export function InstallHint() {
  // Computed once on mount. Safe to read browser APIs here — this is a
  // client-only app (no SSR), so there's no server render to guard against.
  const [show, setShow] = useState(shouldShow);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 flex justify-center pointer-events-none">
      <div className="pointer-events-auto card-sticker bg-cream max-w-md w-full p-3 flex items-start gap-3 text-sm">
        <span className="text-xl" aria-hidden>
          📲
        </span>
        <p className="flex-1 leading-snug">
          Add <span className="font-bold">What To Play</span> to your Home Screen
          so your collection stays safe — tap{" "}
          <span className="font-bold">Share</span> then{" "}
          <span className="font-bold">Add to Home Screen</span>.
        </p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-cocoa/60 hover:bg-cocoa/10 active:bg-cocoa/20"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
