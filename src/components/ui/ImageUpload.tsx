import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, ImagePlus, Trash2 } from "lucide-react";

import Loader from "@/components/ui/Loader";
import { Images } from "@/api/media/sdk.gen";
import { cn } from "@/lib/utils";

/**
 * Image Upload Component (dropzone) with optional delete and i18n
 *
 * - Click, keyboard (Tab + Enter/Space) or drag & drop to pick an image.
 * - Uploads automatically on selection.
 * - Sends multipart/form-data with a `photo` field to
 *   `POST {API_BASE_URL}/api/media/images?context={context}`.
 * - The Bearer token is added by the axios/hey-api interceptors
 *   configured in `src/plugins/clients.ts`.
 * - Validates JPEG, PNG, WebP and GIF files up to 10 MB before uploading.
 * - On success, calls `onImageUploaded` with the uploaded image URL.
 * - Delete button (`DELETE /images/{objectName}`) is only rendered when
 *   `onImageDeleted` is provided, so existing usages that rely on it keep working.
 */
export interface ImageUploadProps {
  /** Context tag for the upload (e.g. "avatar", "chat") */
  context: string;
  /** Called when the image has been uploaded successfully. */
  onImageUploaded: (url: string, response: unknown) => void;
  /** Called when the image has been deleted. Receives the deleted objectName.
   *  When provided, a delete button is shown after a successful upload. */
  onImageDeleted?: (objectName: string) => void;
  /** Show a local thumbnail of the uploaded image. Defaults to true.
   *  Set to false when the parent already displays the image (e.g. a gallery). */
  showPreview?: boolean;
  className?: string;
}

type Status = "idle" | "uploading" | "success" | "error" | "deleting";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const SUCCESS_VISIBLE_MS = 3000;

export const ImageUpload: React.FC<ImageUploadProps> = ({
  context,
  onImageUploaded,
  onImageDeleted,
  showPreview: showPreviewProp = true,
  className,
}) => {
  const { t } = useTranslation("profile");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [objectName, setObjectName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  // Without a delete button, the success message is only a brief confirmation.
  useEffect(() => {
    if (status !== "success" || onImageDeleted) return;
    const id = window.setTimeout(() => {
      setStatus("idle");
      setObjectName(null);
    }, SUCCESS_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [status, onImageDeleted]);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFile = async (file: File) => {
    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus("error");
      setError(t("imageUpload.unsupportedType", { type: file.type }));
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      setStatus("error");
      setError(
        t("imageUpload.tooLarge", {
          size: (file.size / 1024 / 1024).toFixed(1),
        }),
      );
      return;
    }

    // Release the previous preview before creating a new one
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);
    setError(null);
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
            `Server error ${result.response?.status ?? ""}`.trim(),
        );
      }

      // Adapt to the real field name returned by the backend (imageUrl or url)
      const data = result.data as any;
      const imageUrl: string | null = data.imageUrl ?? data.url ?? null;
      const returnedObjectName: string | null = data.objectName ?? null;

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
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    // Allows selecting the same file again
    resetInput();
  };

  const isBusy = status === "uploading" || status === "deleting";

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!isBusy) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isBusy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
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
            `Server error ${result.response?.status ?? ""}`.trim(),
        );
      }

      const deletedName = objectName;

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
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

  // La miniature reste affichée jusqu'au prochain envoi (ou à la suppression),
  // même après la disparition du message de succès.
  const thumbnailVisible =
    showPreviewProp && !!previewUrl && status !== "error";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Dropzone: le <label> ouvre l'input nativement; l'input reste focusable (sr-only) */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group flex items-center gap-4 rounded-2xl border border-dashed px-4 py-3.5 transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          isBusy
            ? "cursor-not-allowed opacity-60 border-border/70"
            : "cursor-pointer hover:border-primary/60 hover:bg-primary/5",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border/70 bg-transparent",
        )}
      >
        <input
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          ref={fileInputRef}
          className="sr-only"
          onChange={handleFileChange}
          disabled={isBusy}
        />

        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
            isDragging
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border/60 bg-secondary/70 text-zinc-300 group-hover:text-primary",
          )}
        >
          {status === "uploading" ? (
            <Loader size="sm" />
          ) : (
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          )}
        </span>

        <span className="min-w-0 flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {t("imageUpload.upload")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("imageUpload.hint", {
              defaultValue: "Glissez une image ici ou cliquez. JPEG, PNG, WebP ou GIF, 10 Mo max.",
            })}
          </span>
        </span>
      </label>

      {/* Barre indéterminée pendant l'envoi (pas de progression réelle côté hey-api) */}
      {status === "uploading" && (
        <div
          role="progressbar"
          aria-label={t("imageUpload.uploading")}
          className="relative h-1 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div className="absolute inset-y-0 w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
        </div>
      )}

      {/* Statuts annoncés aux lecteurs d'écran */}
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        {thumbnailVisible && (
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border/60 bg-secondary">
            <img
              src={previewUrl as string}
              alt={t("imageUpload.previewAlt")}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {status === "uploading" && (
          <p className="text-xs text-muted-foreground">
            {t("imageUpload.uploading")}
          </p>
        )}

        {status === "success" && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t("imageUpload.uploaded")}
            </p>

            {onImageDeleted && objectName && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t("imageUpload.delete")}
              </button>
            )}
          </div>
        )}

        {status === "deleting" && (
          <p className="text-xs text-muted-foreground">
            {t("imageUpload.deleting")}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;