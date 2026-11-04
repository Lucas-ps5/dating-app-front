import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, ImagePlus, Trash2 } from "lucide-react";
import imageCompression from "browser-image-compression";

import Loader from "@/components/ui/Loader";
import { Images } from "@/api/media/sdk.gen";
import { cn } from "@/lib/utils";

/**
 * Payload returned by the upload endpoint.
 *
 * The api-gateway exposes the image URL as `imageUrl` while the media service
 * exposes it as `url`; both field names are accepted so the component keeps
 * working whichever service answers.
 */
export interface UploadedImagePayload {
  /** URL of the uploaded image (gateway: `imageUrl`, media service: `url`). */
  imageUrl?: string;
  /** URL of the uploaded image (media service spelling). */
  url?: string;
  /** S3 object key — required to delete the image later. */
  objectName?: string;
}

/**
 * Compression options for the ImageUpload component.
 */
export interface ImageCompressionOptions {
  /**
   * Whether compression is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Maximum target file size in MB after compression.
   * @default 1
   */
  maxSizeMB?: number;
  /**
   * Maximum width or height in pixels.
   * @default 1920
   */
  maxWidthOrHeight?: number;
  /**
   * Use Web Worker if available.
   * Defaults to false to avoid external script loading or CSP restrictions.
   * @default false
   */
  useWebWorker?: boolean;
  /**
   * Initial image quality between 0 and 1.
   * @default 0.8
   */
  initialQuality?: number;
  /**
   * Maximum allowed file size before compression (in bytes).
   * Files exceeding this will be rejected upfront.
   * Defaults to 20 MB (20 * 1024 * 1024).
   */
  maxOriginalSize?: number;
}

/**
 * Image Upload Component (dropzone) with optional delete, client-side compression and i18n
 *
 * - Click, keyboard (Tab + Enter/Space) or drag & drop to pick an image.
 * - Uploads automatically on selection.
 * - Compresses JPEG, PNG, and WebP images client-side before uploading (configurable).
 * - Sends multipart/form-data with a `photo` field to
 *   `POST {API_BASE_URL}/media/images?context={context}`.
 *   The context is passed as a query parameter only: the gateway declares it
 *   as a query parameter and its multipart body only accepts `photo`.
 * - The Bearer token is added by the axios/hey-api interceptors
 *   configured in `src/plugins/clients.ts`.
 * - Validates JPEG, PNG, WebP and GIF files up to 10 MB (or up to 20 MB before compression).
 * - On success, calls `onImageUploaded` with the uploaded image URL.
 * - Delete button (`DELETE /images/{objectName}`) is rendered as soon as an
 *   upload succeeded and `onImageDeleted` is provided.
 */
export interface ImageUploadProps {
  /** Context tag for the upload (e.g. "avatar", "chat") */
  context: string;
  /** Called when the image has been uploaded successfully. */
  onImageUploaded: (url: string, payload: UploadedImagePayload) => void;
  /** Called when the image has been deleted. Receives the deleted objectName
   *  and the URL of the removed image. When provided, a delete button is shown
   *  after a successful upload. */
  onImageDeleted?: (objectName: string, url: string) => void;
  /** Show a local thumbnail of the uploaded image. Defaults to true.
   *  Set to false when the parent already displays the image (e.g. a gallery). */
  showPreview?: boolean;
  /**
   * Image compression options. Pass `false` to disable compression,
   * or customize settings like `maxSizeMB`, `maxWidthOrHeight`, etc.
   * Enabled by default with 1 MB max size and 1920px max dimension.
   */
  compression?: boolean | ImageCompressionOptions;
  className?: string;
}

type Status =
  "idle" | "compressing" | "uploading" | "success" | "error" | "deleting";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Fallback used when the browser does not provide a MIME type, which happens
 *  with some drag & drop sources. */
const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Backend media service hard limit is 10 MB */
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

/** Default maximum file size accepted before compression */
const DEFAULT_MAX_ORIGINAL_SIZE = 20 * 1024 * 1024; // 20 MB

const DEFAULT_COMPRESSION: Required<ImageCompressionOptions> = {
  enabled: true,
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: false,
  initialQuality: 0.8,
  maxOriginalSize: DEFAULT_MAX_ORIGINAL_SIZE,
};

const SUCCESS_VISIBLE_MS = 3000;

/** Structural subset of an HTTP error, so the component does not depend on the
 *  axios types being installed at the top level. */
interface HttpErrorLike {
  response?: { status?: number; data?: unknown };
  request?: unknown;
  message?: string;
}

/** Resolves the MIME type of a file, falling back to its extension. */
const resolveMimeType = (file: File): string => {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? "";
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  context,
  onImageUploaded,
  onImageDeleted,
  showPreview: showPreviewProp = true,
  compression = true,
  className,
}) => {
  const { t } = useTranslation("profile");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [objectName, setObjectName] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // The "uploaded" confirmation is transient; the delete button outlives it.
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the latest previewUrl in a ref so the unmount cleanup
  // revokes the current URL (not a stale one captured at first render).
  const previewUrlRef = useRef<string | null>(null);

  // Number of nested drag events, so moving the pointer over a child element
  // does not cancel the drop highlight.
  const dragDepthRef = useRef(0);

  // Keep the delete callback in a ref: an inline arrow in the parent must not
  // restart the success timer on every render.
  const onImageDeletedRef = useRef(onImageDeleted);
  useEffect(() => {
    onImageDeletedRef.current = onImageDeleted;
  }, [onImageDeleted]);
  const canDelete = onImageDeleted !== undefined;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  // The success confirmation fades away after a few seconds. Without a delete
  // button there is nothing left to show, so the component returns to idle.
  useEffect(() => {
    if (!showSuccessBanner) return;
    const id = window.setTimeout(() => {
      setShowSuccessBanner(false);
      if (!canDelete) {
        setStatus("idle");
        setObjectName(null);
        setUploadedUrl(null);
      }
    }, SUCCESS_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [showSuccessBanner, canDelete]);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Releases the current local preview (blob URL). */
  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  /** Replaces the local preview with the one of the given file. */
  const preparePreview = useCallback(
    (file: File) => {
      clearPreview();
      if (!showPreviewProp) return;
      const objectUrl = URL.createObjectURL(file);
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    },
    [clearPreview, showPreviewProp],
  );

  /** Builds a user-facing message out of a failed request. */
  const describeError = useCallback(
    (err: unknown, fallbackKey: string): string => {
      const httpError = err as HttpErrorLike | undefined;
      const data = httpError?.response?.data;

      if (typeof data === "string" && data.trim()) return data;

      if (data && typeof data === "object") {
        const body = data as { message?: unknown; error?: unknown };

        if (Array.isArray(body.message)) {
          const messages = body.message.filter(
            (entry): entry is string => typeof entry === "string",
          );
          if (messages.length) return messages.join(" ");
        }
        if (typeof body.message === "string" && body.message.trim()) {
          return body.message;
        }
        if (typeof body.error === "string" && body.error.trim()) {
          return body.error;
        }
      }

      // The server answered but without a usable message.
      if (httpError?.response) {
        const statusResponse = httpError.response.status;
        return t("imageUpload.serverError", {
          status: statusResponse ? ` ${statusResponse}` : "",
        });
      }

      // No response at all: the request never reached the server.
      if (httpError?.request) return t("imageUpload.noResponse");

      return t(fallbackKey);
    },
    [t],
  );

  const processFile = async (file: File) => {
    // Validate MIME type
    const mimeType = resolveMimeType(file);
    if (!ALLOWED_TYPES.includes(mimeType)) {
      setStatus("error");
      setError(
        t("imageUpload.unsupportedType", { type: mimeType || file.name }),
      );
      return;
    }

    const isCompressionDisabled =
      compression === false ||
      (typeof compression === "object" && compression.enabled === false);

    const compressionConfig: ImageCompressionOptions =
      typeof compression === "object" ? compression : {};

    const maxOriginalSize =
      compressionConfig.maxOriginalSize ?? DEFAULT_MAX_ORIGINAL_SIZE;

    // Animated GIFs should not be compressed with canvas to preserve animations
    const isCompressible = !isCompressionDisabled && mimeType !== "image/gif";

    // Validate size before compression
    const maxAllowedBeforeCompression = isCompressible
      ? maxOriginalSize
      : MAX_UPLOAD_SIZE;

    if (file.size > maxAllowedBeforeCompression) {
      setStatus("error");
      setError(
        t("imageUpload.tooLarge", {
          size: (file.size / 1024 / 1024).toFixed(1),
        }),
      );
      return;
    }

    preparePreview(file);
    setError(null);
    setShowSuccessBanner(false);

    let fileToUpload: File = file;

    if (isCompressible) {
      setStatus("compressing");

      try {
        const options = {
          maxSizeMB:
            compressionConfig.maxSizeMB ?? DEFAULT_COMPRESSION.maxSizeMB,
          maxWidthOrHeight:
            compressionConfig.maxWidthOrHeight ??
            DEFAULT_COMPRESSION.maxWidthOrHeight,
          useWebWorker:
            compressionConfig.useWebWorker ?? DEFAULT_COMPRESSION.useWebWorker,
          initialQuality:
            compressionConfig.initialQuality ??
            DEFAULT_COMPRESSION.initialQuality,
          fileType: mimeType,
        };

        const compressedBlob = await imageCompression(file, options);
        const compressedFile =
          compressedBlob instanceof File
            ? compressedBlob
            : new File([compressedBlob], file.name, {
                type: compressedBlob.type || mimeType,
                lastModified: Date.now(),
              });

        // Use the compressed file if it reduced size, or if original exceeded upload limit
        if (compressedFile.size < file.size || file.size > MAX_UPLOAD_SIZE) {
          fileToUpload = compressedFile;
        }
      } catch (err) {
        console.warn(
          "Image compression failed, falling back to original file:",
          err,
        );
        if (file.size > MAX_UPLOAD_SIZE) {
          clearPreview();
          setStatus("error");
          setError(
            t("imageUpload.compressionError", "Failed to compress image."),
          );
          return;
        }
        fileToUpload = file;
      }
    }

    // Ensure the final file does not exceed the backend payload limit
    if (fileToUpload.size > MAX_UPLOAD_SIZE) {
      clearPreview();
      setStatus("error");
      setError(
        t("imageUpload.tooLarge", {
          size: (fileToUpload.size / 1024 / 1024).toFixed(1),
        }),
      );
      return;
    }

    setStatus("uploading");

    try {
      // `throwOnError` makes the client throw the underlying HTTP error
      // instead of resolving with `{ data, error, response }`.
      const result = await Images.uploadImage({
        body: { photo: fileToUpload },
        query: { context },
        throwOnError: true,
      });

      const payload: UploadedImagePayload = result.data ?? {};
      const imageUrl = payload.imageUrl ?? payload.url ?? null;

      if (!imageUrl) {
        // The upload succeeded but the response carries no usable URL:
        // reporting it as a success would push a broken image to the parent.
        console.error("Image upload error: no image URL in response", result);
        clearPreview();
        setStatus("error");
        setError(t("imageUpload.invalidResponse"));
        return;
      }

      setObjectName(payload.objectName ?? null);
      setUploadedUrl(imageUrl);
      setStatus("success");
      setShowSuccessBanner(true);

      onImageUploaded(imageUrl, payload);
    } catch (err) {
      console.error("Image upload error:", err);

      clearPreview();
      setStatus("error");
      setShowSuccessBanner(false);
      setError(describeError(err, "imageUpload.error"));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    // Allows selecting the same file again
    resetInput();
  };

  const isBusy =
    status === "uploading" || status === "compressing" || status === "deleting";

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (isBusy) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!isBusy) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (isBusy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleDelete = useCallback(async () => {
    if (!objectName) return;

    const deletedName = objectName;
    const deletedUrl = uploadedUrl ?? "";

    setStatus("deleting");
    setError(null);
    setShowSuccessBanner(false);

    try {
      await Images.deleteImage({
        path: { objectName: deletedName },
        throwOnError: true,
      });

      clearPreview();
      setObjectName(null);
      setUploadedUrl(null);
      setStatus("idle");

      onImageDeletedRef.current?.(deletedName, deletedUrl);
    } catch (err) {
      console.error("Image delete error:", err);
      setError(describeError(err, "imageUpload.deleteError"));
      // The image is still on the server: restore the delete button
      // so the user can retry the deletion.
      setStatus("success");
    }
  }, [objectName, uploadedUrl, clearPreview, describeError]);

  // La miniature reste affichée jusqu'au prochain envoi (ou à la suppression),
  // même après la disparition du message de succès.
  const thumbnailVisible = showPreviewProp && !!previewUrl;

  let statusText = t("imageUpload.upload");
  if (status === "compressing") {
    statusText = t("imageUpload.compressing");
  } else if (status === "uploading") {
    statusText = t("imageUpload.uploading");
  }

  let progressAriaLabel = t("imageUpload.uploading");
  if (status === "compressing") {
    progressAriaLabel = t("imageUpload.compressing");
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Dropzone: le <label> ouvre l'input nativement; l'input reste focusable (sr-only) */}
      <label
        onDragEnter={handleDragEnter}
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
          {status === "uploading" || status === "compressing" ? (
            <Loader size="sm" />
          ) : (
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          )}
        </span>

        <span className="min-w-0 flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {statusText}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("imageUpload.hint")}
          </span>
        </span>
      </label>

      {/* Barre indéterminée pendant la compression ou l'envoi */}
      {(status === "uploading" || status === "compressing") && (
        <div
          role="progressbar"
          aria-label={progressAriaLabel}
          className="relative h-1 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div className="absolute inset-y-0 w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
        </div>
      )}

      {thumbnailVisible && (
        <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border/60 bg-secondary">
          <img
            src={previewUrl as string}
            alt={t("imageUpload.previewAlt")}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Statuts annoncés aux lecteurs d'écran */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          {status === "compressing" && (
            <p className="text-xs text-muted-foreground">
              {t("imageUpload.compressing")}
            </p>
          )}

          {status === "uploading" && (
            <p className="text-xs text-muted-foreground">
              {t("imageUpload.uploading")}
            </p>
          )}

          {showSuccessBanner && (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t("imageUpload.uploaded")}
            </p>
          )}

          {status === "deleting" && (
            <p className="text-xs text-muted-foreground">
              {t("imageUpload.deleting")}
            </p>
          )}
        </div>

        {canDelete && objectName && !isBusy && (
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

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
