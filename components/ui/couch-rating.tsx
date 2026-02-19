import * as React from "react";
import Image from "next/image";

interface CouchRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  disabled?: boolean;
  max?: number;
}

export function CouchRating({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  max = 5,
}: CouchRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const handleClick = (couchIndex: number, quarter: number) => {
    if (readOnly || disabled) return;
    // quarter: 0 = 0.25, 1 = 0.5, 2 = 0.75, 3 = 1.0
    const newValue = couchIndex + (quarter + 1) * 0.25;
    onChange(newValue);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((couchNum) => {
        const couchValue = couchNum - 1; // 0-indexed
        const filled = displayValue >= couchNum;
        const partialFill =
          displayValue > couchValue && displayValue < couchNum;
        const fillPercentage = partialFill
          ? (displayValue - couchValue) * 100
          : filled
            ? 100
            : 0;

        return (
          <div
            key={couchNum}
            className={`relative w-6 h-6 ${
              readOnly || disabled ? "cursor-default" : "cursor-pointer"
            }`}
            onMouseLeave={() => !readOnly && !disabled && setHoverValue(null)}
          >
            {/* Divide couch into 4 clickable quarters for 0.25 increments */}
            <div className="absolute inset-0 grid grid-cols-4">
              {[0, 1, 2, 3].map((quarter) => (
                <div
                  key={quarter}
                  className="h-full"
                  onMouseEnter={() => {
                    if (!readOnly && !disabled) {
                      setHoverValue(couchValue + (quarter + 1) * 0.25);
                    }
                  }}
                  onClick={() => handleClick(couchValue, quarter)}
                />
              ))}
            </div>

            {/* Gray couch (background) */}
            <div className="absolute inset-0 pointer-events-none">
              <Image
                src="/couch-gray.svg"
                alt="couch"
                width={24}
                height={24}
                className="w-full h-full"
              />
            </div>

            {/* Red couch (foreground) with clip-path for partial fill */}
            {fillPercentage > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                }}
              >
                <Image
                  src="/couch-red.svg"
                  alt="couch filled"
                  width={24}
                  height={24}
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
