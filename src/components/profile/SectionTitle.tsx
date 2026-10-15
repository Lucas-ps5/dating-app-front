import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  className = "",
}) => (
  <h2
    className={`text-base font-semibold tracking-tight text-foreground ${className}`}
  >
    {children}
  </h2>
);
