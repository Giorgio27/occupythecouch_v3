import * as React from "react";

type SectionHeaderProps = {
  title: string;
  /** Optional lucide icon node rendered before the title */
  icon?: React.ReactNode;
  /** Optional description line rendered below the title */
  subtitle?: string;
  className?: string;
};

/**
 * Reusable section header with optional icon and subtitle.
 * Replaces the repeated `<h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide ...">` pattern.
 */
export default function SectionHeader({
  title,
  icon,
  subtitle,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary">
        {icon}
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
