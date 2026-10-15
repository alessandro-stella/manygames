"use client";

import { useState } from "react";

export function ShareButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my game",
          text: `Join my room ${roomId}!`,
          url,
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <button
      onClick={share}
      className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded"
    >
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
