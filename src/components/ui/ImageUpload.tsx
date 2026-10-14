import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import Loader from "@/components/ui/Loader";
import { Images } from "@/api/media/sdk.gen";

/**
 * Image Upload Component with Delete and i18n
 *
 * - Lets the user pick an image file.
 * - Uploads automatically on selection.
 * - Sends multipart/form-data with a `photo` field to
 *   `POST {API_BASE_URL}/api/media/images?context={context}`.
 * - The Bearer token is added by the axios/hey-api interceptors
 *   configured in `src/plugins/clients.ts`.
 * - Shows a local preview (instant, independent of the server URL),
 *   a loading overlay while uploading, and a useful error message.
 * - Validates JPEG, PNG, WebP and GIF files up to 10 MB before uploading.
 * - On success, calls `onImageUploaded` with the uploaded image URL.
 * - Provides a delete button: `DELETE /images/{objectName}`.
 */
export interface ImageUploadProps {
  /** Context tag for the upload (e.g. "avatar", "chat") */
  context: string;
  /** Called when the image has been uploaded successfully. */
  onImageUploaded: (url: string, response: unknown) => void;
  /** Called when the image has been deleted. Receives the deleted objectName. */
  onImageDeleted?: (objectName: string) => void;
}

type Status = "idle" | "uploading" | "success" | "error" | "deleting";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const ImageUpload: React.FC<ImageUploadProps> = ({
  context,
  onImageUploaded,
  onImageDeleted,
}) => {
  const { t } = useTranslation("profile");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [objectName, setObjectName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the latest previewUrl in a ref so the unmount cleanup
  // revokes the current URL (not a stale one captured at first render).
  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus("error");
      setError(t("imageUpload.unsupportedType", { type: file.type }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      setStatus("error");
      setError(
        t("imageUpload.tooLarge", {
          size: (file.size / 1024 / 1024).toFixed(1),
        })
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Release the previous preview before creating a new one
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);
    setError(null);
    setUploadedUrl(null);
    setObjectName(null);
    setStatus("uploading");

    try {
      const result = await Images.uploadImage({
        body: { photo: file, context },
        query: { context },
      });

      // hey-api does not throw on HTTP errors by default:
      // it returns { data, error, response }.
      if (result.error || !result.data) {
        throw new Error(
          (result.error as any)?.message ??
            `Server error ${result.response?.status ?? ""}`.trim()
        );
      }

      // Adapt to the real field name returned by the backend (imageUrl or url)
      const data = result.data as any;
      const imageUrl: string | null = data.imageUrl ?? data.url ?? null;
      const returnedObjectName: string | null = data.objectName ?? null;

      setUploadedUrl(imageUrl);
      setObjectName(returnedObjectName);
      setStatus("success");

      onImageUploaded(imageUrl ?? "", result);
    } catch (err: any) {
      console.error("Image upload error:", err);

      let message: string = t("imageUpload.error");
      if (err?.response?.data) {
        const data = err.response.data;
        message =
          typeof data === "string"
            ? data
            : data.message || data.error || `Server error ${err.response.status}`;
      } else if (err?.request) {
        message = t("imageUpload.noResponse");
      } else if (err?.message) {
        message = err.message;
      }

      setStatus("error");
      setError(message);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    } finally {
      // Allows selecting the same file again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = useCallback(async () => {
    if (!objectName) return;

    setStatus("deleting");
    setError(null);

    try {
      const result = await Images.deleteImage({
        path: { objectName },
      });

      if (result?.error) {
        throw new Error(
          (result.error as any)?.message ??
            `Server error ${result.response?.status ?? ""}`.trim()
        );
      }

      const deletedName = objectName;

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setUploadedUrl(null);
      setObjectName(null);
      setStatus("idle");

      onImageDeleted?.(deletedName);
    } catch (err: any) {
      console.error("Image delete error:", err);
      setError(t("imageUpload.deleteError"));
      // The image is still on the server: go back to "success"
      // so the user can retry the deletion.
      setStatus("success");
    }
  }, [objectName, previewUrl, onImageDeleted, t]);

  const isBusy = status === "uploading" || status === "deleting";
  const showPreview = !!previewUrl && status !== "error";

  return (
    <div className="space-y-2" aria-describedby="image-upload-status">
      {/* File picker: the <label> opens the input natively, no onClick needed */}
      <label
        className={`flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors ${
          isBusy
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
        }`}
        aria-label={t("imageUpload.upload")}
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h6a3 3 0 003-3v1m-7-7h2m-5 4h12a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v9m2-3v-2h2v2m7.56 3.56a.75.75 0 010 1.06l-1.56 1.56a.75.75 0 01-1.06 0L17 9.58l-1.06-1.06a.75.75 0 010-1.06l1.56-1.56a.75.75 0 011.06 0l3.27 3.27a.75.75 0 01-.33 1.23Z"
          />
        </svg>
        <input
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={isBusy}
        />
        <span>{t("imageUpload.upload")}</span>
      </label>

      <div id="image-upload-status" aria-live="polite" className="space-y-2">
        {/* Preview: local blob first, server URL once the upload is done */}
        {showPreview && (
          <div className="relative h-20 w-20 overflow-hidden rounded-md border border-input bg-background">
            <img
              src={previewUrl as string}
              alt={t("imageUpload.previewAlt")}
              className="h-full w-full object-cover"
              onError={(e) => {
                // If the server URL fails to load, fall back to the local preview
                const img = e.currentTarget;
                if (previewUrl && img.src !== previewUrl) {
                  img.src = previewUrl;
                }
              }}
            />
            {isBusy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader size="sm" />
              </div>
            )}
          </div>
        )}

        {status === "uploading" && (
          <div className="flex items-center gap-2">
            <Loader size="sm" />
            <span className="text-sm text-foreground/60">
              {t("imageUpload.uploading")}
            </span>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {t("imageUpload.uploaded")}
            </span>

            {objectName && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md border border-destructive px-3 py-1 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                title={t("imageUpload.delete")}
                aria-label={t("imageUpload.delete")}
              >
                {t("imageUpload.delete")}
              </button>
            )}
          </div>
        )}

        {status === "deleting" && (
          <div className="flex items-center gap-2">
            <Loader size="sm" />
            <span className="text-sm text-foreground/60">
              {t("imageUpload.deleting")}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
};
