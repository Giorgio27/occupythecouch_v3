import { useState } from "react";
import { Button } from "./button";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function ExpandableText({
  text,
  maxLength = 200,
  className = "",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText =
    isExpanded || !shouldTruncate ? text : text.slice(0, maxLength) + "...";

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
        {displayText}
      </p>
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
