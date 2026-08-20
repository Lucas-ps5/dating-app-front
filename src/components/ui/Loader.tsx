export default function Loader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "size-4 border",
    md: "size-8 border",
    lg: "size-12 border",
  };

  return (
    <div
      className={`${sizeMap[size]} animate-spin rounded-full border-t-transparent border-primary`}
    />
  );
}