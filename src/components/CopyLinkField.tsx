"use client";

import { useState } from "react";

type CopyLinkFieldProps = Readonly<{
  url: string;
}>;

export function CopyLinkField({ url }: CopyLinkFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // SHARE-03: show "COPIED!" feedback for 2 seconds then revert
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable on some contexts (T-04-03: accepted risk for MVP)
    }
  };

  return (
    <div className="flex gap-0">
      <input
        type="text"
        readOnly
        value={url}
        className="flex-1 font-mono text-[--color-pen] text-sm border border-[--color-ink] bg-[--color-paper-chit] px-3 py-2 rounded-l outline-none"
        aria-label="Shareable bill link"
      />
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="bg-[--color-pen] text-white uppercase text-sm font-bold h-10 px-4 rounded-r whitespace-nowrap"
        aria-label={copied ? "Link copied to clipboard" : "Copy link to clipboard"}
      >
        {copied ? "COPIED!" : "COPY LINK"}
      </button>
    </div>
  );
}
