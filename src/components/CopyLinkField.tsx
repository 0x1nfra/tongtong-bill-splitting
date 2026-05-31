"use client";

import { useState } from "react";

type CopyLinkFieldProps = Readonly<{
  url: string;
}>;

export function CopyLinkField({ url }: CopyLinkFieldProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  return (
    <div>
      <div className="flex gap-0">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 min-w-0 font-mono text-pen text-sm border border-ink bg-paper-chit px-3 py-2 outline-none"
          aria-label="Shareable bill link"
        />
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="bg-pen text-white uppercase text-sm font-bold h-10 px-4 whitespace-nowrap cursor-pointer shrink-0"
          aria-label={copied ? "Link copied to clipboard" : "Copy link to clipboard"}
        >
          {copied ? "COPIED!" : "COPY LINK"}
        </button>
      </div>
      {copyError && (
        <p className="text-xs text-warning mt-1 uppercase tracking-widest">
          COPY FAILED — select the link manually
        </p>
      )}
    </div>
  );
}
