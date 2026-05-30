"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type QRUploadProps = Readonly<{
  onUpload: (storageId: string) => void;
}>;

export function QRUpload({ onUpload }: QRUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.bills.generateUploadUrl);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      // Step 1: Get short-lived upload URL from Convex
      const uploadUrl = await generateUploadUrl({});

      // Step 2: POST file directly to Convex storage
      // Pitfall 5: Content-Type header required so Convex stores correct file metadata
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // CR-03: check HTTP status before attempting to parse JSON
      if (!result.ok) {
        throw new Error(`Upload failed: ${result.status} ${result.statusText}`);
      }

      const { storageId } = await result.json() as { storageId: string };

      // CR-03: guard against missing storageId in response body
      if (!storageId) {
        throw new Error("Upload response missing storageId");
      }

      // Step 3: Show local preview and pass storageId to parent
      setPreviewUrl(URL.createObjectURL(file));
      onUpload(storageId);
    } catch {
      setUploadError("UPLOAD FAILED — Could not save QR image. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  if (isUploading) {
    return (
      <div
        className="w-40 h-40 border-2 border-dashed border-ink flex items-center justify-center"
        aria-label="Uploading QR image"
      >
        <span className="uppercase text-xs text-ink-muted">
          UPLOADING...
        </span>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="flex flex-col items-start gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="DuitNow QR preview"
          width={160}
          height={160}
          className="object-contain w-40 h-40 border border-ink"
        />
        <label className="cursor-pointer">
          <span className="uppercase text-xs text-pen underline">
            CHANGE
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="sr-only"
          />
        </label>
        {uploadError && (
          <p className="text-xs text-warning">{uploadError}</p>
        )}
      </div>
    );
  }

  // Default: no preview yet
  return (
    <div className="flex flex-col items-start gap-2">
      <label className="cursor-pointer flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-ink gap-3">
        <span className="uppercase text-xs text-ink-muted">
          DUITNOW QR
        </span>
        <span className="uppercase text-xs bg-ink text-white px-3 py-1.5">
          UPLOAD QR IMAGE
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="sr-only"
        />
      </label>
      {uploadError && (
        <p className="text-xs text-warning">{uploadError}</p>
      )}
    </div>
  );
}
