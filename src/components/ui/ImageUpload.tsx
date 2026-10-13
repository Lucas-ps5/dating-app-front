import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import axios from "axios";
import Loader from "@/components/ui/Loader";
import { Images } from "@/api/media";

/**
 * Image Upload Component with Delete and i18n
 *
 - Lets the user pick an image file.
 - Uploads automatically on selection.
 - Sends multipart/form-data with a `photo` field to
   `POST {API_BASE_URL}/api/media/images?context={context}`.
 - Includes the bearer access token via the project's existing
   auth mechanism (axios interceptors in `src/plugins/clients.ts`).
 - Shows a preview, upload progress or loading state, and a useful error message.
 - Allows the user to select a different image and upload again.
 - Validates JPEG, PNG, WebP, and GIF files up to 10 MB, and validates before uploading.
 - On success, calls an `onImageUploaded` prop with the uploaded image URL so the parent can use it.
 - Provides a delete button to remove the uploaded image via `DELETE /images/{objectName}`.
 - Fully internationalized using react-i18next.
 */
export interface ImageUploadProps {
  /** Context tag for the upload (e.g. "avatar", "chat") */
  context: string;
  /** Called when the image has been uploaded successfully. */
  onImageUploaded: (url: string, response: unknown) => void;
  /** Called when the image has been deleted. Receives the deleted objectName. */
  onImageDeleted?: (objectName: string) => void;
}

/**
 * Renders a file-picker label and handles the upload lifecycle.
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  context,
  onImageUploaded,
  onImageDeleted,
}) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();

  const [status, setStatus] = useState<
    | "idle"
    | "preview"
    | "uploading"
    | "success"
    | "error"
    | "deleting"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [objectName, setObjectName] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>("en");

  // Track locale changes (simple i18n refresh)
  React.useEffect(() => {
    setLocale(i18n.language);
  }, [i18n.language]);

  // Keep a ref to the file input so we can programmatically open it.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStatus("idle");
      setError(null);
      return;
    }

    // Validate MIME type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setStatus("error");
      setError(
        t("imageUpload.unsupportedType", { type: file.type })
      );
      return;
    }

    // Validate size (max 10 MB)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setStatus("error");
      setError(
        t("imageUpload.tooLarge", {
          size: (file.size / 1024 / 1024).toFixed(1),
        })
      );
      return;
    }

    // Show preview and start upload
    setStatus("preview");
    setError(null);
    setProgress(0);
    setUploadedUrl(null);
    setObjectName(null);

    const formData = new FormData();
    formData.append("photo", file);
    // The `context` query param is appended in the URL below.

    setStatus("uploading");

    try {
      // Use axios directly. The baseURL is already configured in the plugin
      // (src/plugins/clients.ts) and the interceptor adds the Bearer token.
      // We intentionally do NOT set a Content-Type header – let the browser
      // add the multipart boundary.
      const response = await axios.post<
        { objectName?: string; url?: string; size?: number; mimetype?: string },
        unknown,
        unknown
      >(
        `/api/media/images?context=${encodeURIComponent(context)}`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100,
              );
              setProgress(percent);
            }
          },
        },
      );

      // Backend currently responds with `{ imageUrl, objectName, size, mimetype }`.
      // Use `imageUrl` as the primary value, and also pass the full response.
      const responseData = response.data;
      const imageUrl =
        typeof responseData === "object" && responseData !== null
          ? (responseData as { imageUrl?: string }).imageUrl
          : null;
      const returnedObjectName =
        typeof responseData === "object" && responseData !== null
          ? (responseData as { objectName?: string }).objectName
          : null;

      setUploadedUrl(imageUrl ?? null);
      setObjectName(returnedObjectName ?? null);
      setStatus("success");
      setProgress(100);

      // Notify the parent
      onImageUploaded(imageUrl ?? "", response);
    } catch (err: any) {
      console.error("Image upload error:", err);

      let message = t("imageUpload.error");

      if (err.response) {
        // Server returned a non-2xx status
        const data = err.response.data;
        if (typeof data === "object" && data !== null) {
          const errData = data as {
            message?: string;
            error?: string;
            statusCode?: number;
          };
          message =
            errData.message ||
            errData.error ||
            `Server error ${err.response.status}`;
        } else if (typeof data === "string") {
          message = data;
        }
      } else if (err.request) {
        message = "No response received from the server. Check your connection.";
      } else {
        message = err.message || "Unexpected error.";
      }

      setStatus("error");
      setError(message);
    } finally {
      setProgress(0);
    }
  };

  // When upload succeeds, reset after a short delay so the user can
  // re‑select the same image without having to clear the input first.
  React.useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        setStatus("idle");
        setUploadedUrl(null);
        setObjectName(null);
        // Important: reset the file input value so the same file can be
        // selected again without the browser blocking it.
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Delete the uploaded image
  const handleDelete = useCallback(async () => {
    if (!objectName) return;

    setStatus("deleting");
    setError(null);

    try {
      // Use the hey-api media client delete method.
      // The path parameter is { objectName } and the interceptor adds the Bearer token.
      const result = await Images.deleteImage({
        path: { objectName },
      });

      // The delete endpoint returns 204 No Content on success.
      // result.data should be undefined/void.
      setObjectName(null);
      setStatus("idle");

      // Notify the parent (if callback provided)
      onImageDeleted?.(objectName);
    } catch (err: any) {
      console.error("Image delete error:", err);

      setError(t("imageUpload.deleteError"));
      setStatus("error");
    } finally {
      setProgress(0);
    }
  }, [objectName, onImageDeleted]);

  return (
    <div className="space-y-2" aria-describedby="image-upload-status">
      {/* File picker button */}
      <label
        className="flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        onClick={chooseFile}
        role="button"
        aria-label={t("imageUpload.upload")}
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h6a3 3 0 003-3v1m-7-7h2m-5 4h12a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v9m2-3y-2-2 2-2m7.56 3.56a.75.75 0 010 1.06l-1.56 1.56a.75.75 0 01-1.06 0L17 9.58l-1.06-1.06a.75.75 0 010-1.06l1.56-1.56a.75.75 0 011.06 0l3.27 3.27a.75.75 0 01-.33 1.23Z"
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </svg>
        <span>{t("imageUpload.upload")}</span>
      </label>

      {/* Status display */}
      {status === "preview" && (
        <p className="text-sm text-foreground/60">{t("imageUpload.selectForPreview")}</p>
      )}

      {status === "uploading" && (
        <div className="flex items-center gap-2">
          <Loader size="sm" />
          <span className="text-sm text-foreground/60">{t("imageUpload.uploading")}</span>
          <span className="text-xs font-medium" style={{ opacity: progress / 100 }}>
            {progress}%
          </span>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-3">
          <img
            src={uploadedUrl || ""}
            alt="Uploaded image preview"
            className="h-12 w-12 rounded-md object-cover"
          />
          <span className="text-sm font-medium text-foreground">{t("imageUpload.uploaded")}</span>

          {/* Delete button shown only when we have an objectName (image was uploaded) */}
          {objectName && (
            <button
              onClick={handleDelete}
              className="ml-2 rounded-md border border-destructive text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              title="Delete image"
              aria-label="Delete image"
            >
              {t("imageUpload.delete")}
            </button>
          )}
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {status === "deleting" && (
        <div className="flex items-center gap-2">
          <Loader size="sm" />
          <span className="text-sm text-foreground/60">{t("imageUpload.deleting")}</span>
        </div>
      )}
    </div>
  );
};