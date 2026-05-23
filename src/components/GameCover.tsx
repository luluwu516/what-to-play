import { useState } from "react";

export function GameCover({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div
        className={`flex items-center justify-center bg-cream text-cocoa/40 text-3xl ${className}`}
      >
        🎲
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={`block object-cover object-center select-none ${className}`}
    />
  );
}
