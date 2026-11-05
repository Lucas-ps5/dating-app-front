import React, {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, ImagePlus, X } from "lucide-react";
import imageCompression from "browser-image-compression";

import Loader from "@/components/ui/Loader";
import { Images } from "@/api/media/sdk.gen";
import { cn } from "@/lib/utils";

/**
 * Payload returned by the upload endpoint.
 */
export interface UploadedImagePayload {
  imageUrl?: string;
  url?: string;
  objectName?: string;
}

export interface ChatImageUploadHandle {
  uploadFile: (file: File) => Promise<void>;
  cancel: () => void;
  isBusy: boolean;
}

export interface ChatImageUploadProps {
  /** Upload context passed to media service query parameter. Defaults to "chat". */
  context?: string;
  /** Called after successful upload with the uploaded image URL and payload. */
  onImageUploaded: (
    url: string,
    payload: UploadedImagePayload,
  ) => Promise<void> | void;
  /** Called if an uploaded image is cancelled/deleted before or after sending. */
  onImageDeleted?: (objectName: string, url: string) => void;
  /** Whether the component or parent is busy/disabled. */
  disabled?: boolean;
  /** Automatically trigger sending the message once the image is uploaded. Defaults to true. */
  autoSend?: boolean;
  /** Max target size in MB after compression. Defaults to 1. */
  maxSizeMB?: number;
  /** Max width or height in pixels. Defaults to 1920. */
  maxWidthOrHeight?: number;
  /** Initial compression quality (0-1). Defaults to 0.8. */
  initialQuality?: number;
  /** Custom class name for the trigger button. */
  className?: string;
}

type Status =
  "idle" | "compressing" | "uploading" | "sending" | "success" | "error";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Backend media service hard limit is 10 MB */
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

/** Max accepted original size before client-side compression */
const MAX_ORIGINAL_SIZE = 20 * 1024 * 1024; // 20 MB

interface HttpErrorLike {
  response?: { status?: number; data?: unknown };
  request?: unknown;
  message?: string;
}

const resolveMimeType = (file: File): string => {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? "";
};

export const ChatImageUpload = forwardRef<
  ChatImageUploadHandle,
  ChatImageUploadProps
>(
  (
    {
      context = "chat",
      onImageUploaded,
      onImageDeleted,
      disabled = false,
      autoSend = true,
      maxSizeMB = 1,
      maxWidthOrHeight = 1920,
      initialQuality = 0.8,
      className,
    },
    ref,
  ) => {
    const { t } = useTranslation(["chat", "profile"]);

    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [objectName, setObjectName] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewUrlRef = useRef<string | null>(null);
    const isBusyRef = useRef(false);

    const onImageDeletedRef = useRef(onImageDeleted);
    useEffect(() => {
      onImageDeletedRef.current = onImageDeleted;
    }, [onImageDeleted]);

    const isBusy =
      status === "compressing" ||
      status === "uploading" ||
      status === "sending";
    isBusyRef.current = isBusy;

    useEffect(() => {
      return () => {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
      };
    }, []);

    const resetInput = useCallback(() => {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const clearPreview = useCallback(() => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
    }, []);

    const preparePreview = useCallback(
      (file: File) => {
        clearPreview();
        const objectUrl = URL.createObjectURL(file);
        previewUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
      },
      [clearPreview],
    );

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

        if (httpError?.response) {
          const statusResponse = httpError.response.status;
          return t("profile:imageUpload.serverError", {
            status: statusResponse ? ` ${statusResponse}` : "",
            defaultValue: `Server error ${statusResponse || ""}`.trim(),
          });
        }

        if (httpError?.request) {
          return t("profile:imageUpload.noResponse", {
            defaultValue:
              "No response from the server. Please check your connection.",
          });
        }

        return t(fallbackKey, {
          defaultValue: "An error occurred during upload. Please try again.",
        });
      },
      [t],
    );

    const processFile = useCallback(
      async (file: File) => {
        if (isBusyRef.current) return;

        const mimeType = resolveMimeType(file);
        if (!ALLOWED_TYPES.includes(mimeType)) {
          setStatus("error");
          setError(
            t("imageUpload.unsupportedType", {
              type: mimeType || file.name,
              defaultValue: `Unsupported file type: ${mimeType || file.name}. Please select a JPEG, PNG, WebP or GIF.`,
            }),
          );
          return;
        }

        if (file.size > MAX_ORIGINAL_SIZE) {
          setStatus("error");
          setError(
            t("imageUpload.tooLarge", {
              size: (file.size / 1024 / 1024).toFixed(1),
              defaultValue: `File is too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max is 20 MB.`,
            }),
          );
          return;
        }

        preparePreview(file);
        setFileName(file.name);
        setError(null);

        // Requirement 3: The image in the message must always be compressed before being saved,
        // regardless of its size.
        setStatus("compressing");

        let compressedFile: File;
        try {
          const compressionOptions = {
            maxSizeMB,
            maxWidthOrHeight,
            useWebWorker: false,
            initialQuality,
            fileType: mimeType === "image/gif" ? "image/jpeg" : mimeType,
          };

          const compressedResult = await imageCompression(
            file,
            compressionOptions,
          );
          compressedFile =
            compressedResult instanceof File
              ? compressedResult
              : new File([compressedResult as Blob], file.name, {
                  type:
                    (compressedResult as Blob).type ||
                    (mimeType === "image/gif" ? "image/jpeg" : mimeType),
                  lastModified: Date.now(),
                });
        } catch {
          clearPreview();
          setStatus("error");
          setError(
            t("imageUpload.compressionError", {
              defaultValue:
                "Failed to compress image. Please try another image.",
            }),
          );
          return;
        }

        // The compressed file is ALWAYS used regardless of whether it's smaller or larger
        const fileToUpload = compressedFile;

        if (fileToUpload.size > MAX_UPLOAD_SIZE) {
          clearPreview();
          setStatus("error");
          setError(
            t("imageUpload.tooLarge", {
              size: (fileToUpload.size / 1024 / 1024).toFixed(1),
              defaultValue: `File is too large: ${(fileToUpload.size / 1024 / 1024).toFixed(1)} MB. Max is 10 MB.`,
            }),
          );
          return;
        }

        setStatus("uploading");

        try {
          const result = await Images.uploadImage({
            body: { photo: fileToUpload },
            query: { context },
            throwOnError: true,
          });

          const payload: UploadedImagePayload = result.data ?? {};
          const imageUrl = payload.imageUrl ?? payload.url ?? null;

          if (!imageUrl) {
            clearPreview();
            setStatus("error");
            setError(
              t("imageUpload.invalidResponse", {
                defaultValue:
                  "The server did not return an image URL. Please try again.",
              }),
            );
            return;
          }

          setObjectName(payload.objectName ?? null);
          setUploadedUrl(imageUrl);

          if (autoSend) {
            setStatus("sending");
            await onImageUploaded(imageUrl, payload);
            setStatus("success");
            window.setTimeout(() => {
              clearPreview();
              setStatus("idle");
              setObjectName(null);
              setUploadedUrl(null);
              setFileName(null);
            }, 700);
          } else {
            setStatus("success");
          }
        } catch (err) {
          setStatus("error");
          setError(describeError(err, "imageUpload.error"));
        }
      },
      [
        autoSend,
        clearPreview,
        context,
        describeError,
        initialQuality,
        maxSizeMB,
        maxWidthOrHeight,
        onImageUploaded,
        preparePreview,
        t,
      ],
    );

    const handleCancel = useCallback(async () => {
      const currentObjectName = objectName;
      const currentUrl = uploadedUrl;

      clearPreview();
      setStatus("idle");
      setError(null);
      setObjectName(null);
      setUploadedUrl(null);
      setFileName(null);
      resetInput();

      if (currentObjectName) {
        try {
          await Images.deleteImage({
            path: { objectName: currentObjectName },
            throwOnError: true,
          });
          onImageDeletedRef.current?.(currentObjectName, currentUrl ?? "");
        } catch {
          // Ignore deletion error on aborted upload
        }
      }
    }, [objectName, uploadedUrl, clearPreview, resetInput]);

    useImperativeHandle(
      ref,
      () => ({
        uploadFile: processFile,
        cancel: handleCancel,
        isBusy,
      }),
      [processFile, handleCancel, isBusy],
    );

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await processFile(file);
      resetInput();
    };

    const isDisabled = disabled || isBusy;

    return (
      <div className="relative shrink-0">
        {/* Trigger Button: matches design with Send button and input container */}
        <label
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors cursor-pointer",
            "hover:bg-card hover:text-foreground focus-within:ring-2 focus-within:ring-primary/40",
            isDisabled && "cursor-not-allowed opacity-40 pointer-events-none",
            className,
          )}
          title={t("imageUpload.attachImage", { defaultValue: "Attach image" })}
          aria-label={t("imageUpload.attachImage", {
            defaultValue: "Attach image",
          })}
        >
          <input
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            ref={fileInputRef}
            className="sr-only"
            onChange={handleFileChange}
            disabled={isDisabled}
          />
          {isBusy ? (
            <Loader size="sm" />
          ) : (
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          )}
        </label>

        {/* Floating preview badge: appears above the button without disrupting page layout */}
        {previewUrl && (
          <div
            role="status"
            aria-live="polite"
            className="absolute bottom-full left-0 mb-2 z-20 flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-2xl border border-border bg-card/95 p-1.5 pr-2.5 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-secondary">
              <img
                src={previewUrl}
                alt={t("imageUpload.previewAlt", { defaultValue: "Preview" })}
                className="h-full w-full object-cover"
              />
              {isBusy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader size="sm" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col pr-1">
              <span className="truncate text-xs font-medium text-foreground max-w-[140px] sm:max-w-[200px]">
                {fileName ||
                  t("imageUpload.previewAlt", { defaultValue: "Image" })}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {status === "compressing" &&
                  t("imageUpload.compressing", {
                    defaultValue: "Compressing...",
                  })}
                {status === "uploading" &&
                  t("imageUpload.uploading", {
                    defaultValue: "Uploading...",
                  })}
                {status === "sending" &&
                  t("imageUpload.sending", {
                    defaultValue: "Sending...",
                  })}
                {status === "success" && (
                  <span className="flex items-center gap-1 text-success font-medium">
                    <Check className="h-3 w-3" />
                    {t("imageUpload.uploaded", {
                      defaultValue: "Sent",
                    })}
                  </span>
                )}
                {status === "error" && (
                  <span className="flex items-center gap-1 text-destructive truncate max-w-[180px]">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {error ||
                      t("imageUpload.error", {
                        defaultValue: "Upload failed",
                      })}
                  </span>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              disabled={status === "sending"}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
              aria-label={t("imageUpload.cancel", { defaultValue: "Cancel" })}
              title={t("imageUpload.cancel", { defaultValue: "Cancel" })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  },
);

ChatImageUpload.displayName = "ChatImageUpload";

export default ChatImageUpload;
