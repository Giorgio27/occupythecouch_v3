import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type PositionPickerProps = {
  totalPositions: number;
  currentPosition?: number | null;
  showClose?: boolean;
  onSelect: (pos: number) => void;
  onClose: () => void;
};

export default function PositionPicker({
  totalPositions,
  currentPosition,
  showClose = true,
  onSelect,
  onClose,
}: PositionPickerProps) {
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-1 shadow-lg animate-fade-in z-10">
      {Array.from({ length: Math.min(totalPositions, 5) }, (_, i) => i + 1).map(
        (pos) => (
          <Button
            key={pos}
            variant={pos === currentPosition ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(pos);
            }}
            className={[
              "h-7 w-7 p-0 rounded-full text-xs font-bold transition-all",
              pos === currentPosition
                ? "bg-primary text-primary-foreground"
                : "hover:bg-primary hover:text-primary-foreground",
            ].join(" ")}
            title={`Position ${pos}`}
          >
            {pos}
          </Button>
        ),
      )}
      {totalPositions > 5 && (
        <span className="text-xs text-muted-foreground px-1">...</span>
      )}
      {showClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="h-7 w-7 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive transition-all"
          title="Close"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
