import { useState } from "react";
import { Button } from "./button";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  /** When true, renders text as HTML (e.g. when the server returns <br> tags). */
  html?: boolean;
}

export function ExpandableText({
  text,
  maxLength = 200,
  className = "",
  html = false,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText =
    isExpanded || !shouldTruncate ? text : text.slice(0, maxLength) + "...";

  return (
    <div className={className}>
      {html ? (
        <p
          className="text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {displayText}
        </p>
      )}
      {shouldTruncate && (
        <Button
          variant="link"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 text-xs"
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
}
