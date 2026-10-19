import * as React from "react";

/**
 * Every asset placed inside `src/assets/images` is eagerly resolved by Vite at
 * build time. This lets local images be referenced by name (e.g. "logo.png")
 * instead of importing each one manually.
 */
const localImageModules = import.meta.glob(
  "/src/assets/images/**/*.{png,jpg,jpeg,svg,gif,webp,avif}",
  { eager: true, import: "default" },
) as Record<string, string>;

const localImages: Record<string, string> = {};
for (const [path, src] of Object.entries(localImageModules)) {
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const relativePath = path.replace(/^\/?src\/assets\/images\//, "");

  // Index by full name, base name and path relative to the images folder so
  // callers can use whichever form is most convenient.
  localImages[fileName] ??= src;
  localImages[relativePath] ??= src;
  localImages[fileName.replace(/\.[^.]+$/, "")] ??= src;
}

/**
 * Resolve the final `src` for an image.
 * - External images (`isLocal` false) are returned untouched.
 * - Local images are looked up inside `src/assets/images` by path or file name.
 */
export function resolveImageUrl(
  url: string,
  isLocal: boolean,
): string | undefined {
  const backendURL: string | undefined =
    import.meta.env.VITE_REST_API_BASE_URL + "/media/";

  if (!url) return undefined;
  if (!isLocal) return url;

  const cleanPath = url
    .replace(/^\/?src\/assets\/images\//, "")
    .replace(/^\.?\//, "");
  const fileName = cleanPath.slice(cleanPath.lastIndexOf("/") + 1);

  return localImages[cleanPath] ?? localImages[fileName] ?? undefined;
}

export interface ImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  /** When `true`, `url` is resolved from `src/assets/images/`. */
  isLocal: boolean;
  /** External image URL, or the name/path of a local image. */
  url: string;
}

/**
 * Single image primitive used across the app. Renders a native `<img>` while
 * transparently handling local assets that live in `src/assets/images`.
 */
export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ isLocal, url, alt = "", ...props }, ref) => (
    <img ref={ref} src={resolveImageUrl(url, isLocal)} alt={alt} {...props} />
  ),
);

Image.displayName = "Image";

export default Image;
