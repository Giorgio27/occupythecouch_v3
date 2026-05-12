import * as React from "react";

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  /** Optional lucide icon node rendered above the title */
  icon?: React.ReactNode;
  /** "default" = standalone card; "muted" = inside an existing card section */
  variant?: "default" | "muted";
  /** Optional CTA slot (e.g. a Button) rendered below the subtitle */
  children?: React.ReactNode;
};

/**
 * Generic empty-state display.
 * All props except `title` are optional — existing call sites remain unchanged.
 */
export default function EmptyState({
  title,
  subtitle,
  icon,
  variant = "default",
  children,
}: EmptyStateProps) {
  const containerClass =
    variant === "muted"
      ? "rounded-xl border border-border bg-muted/30 px-6 py-10 text-center"
      : "rounded-xl border border-border bg-card px-6 py-10 text-center";

  return (
    <div className={containerClass}>
      {icon && (
        <div className="mb-4 flex justify-center text-muted-foreground">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
