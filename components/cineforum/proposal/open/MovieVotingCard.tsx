import * as React from "react";
import { GripVertical, Star, X, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface MovieVotingCardProps {
  movie: any;
  currentPosition: number | null;
  totalPositions: number;
  onPositionChange: (position: number | null) => void;
  isDragging?: boolean;
  isInUnranked?: boolean;
  /** Called when the user drops this card onto a ranking slot via touch */
  onTouchDrop?: (movieId: string, position: number) => void;
  /** Called during touchmove with the position number under the finger, or null when not over any slot */
  onTouchDragPositionChange?: (position: number | null) => void;
}

/**
 * Draggable movie card for voting interface
 * Can be dragged between position slots or moved via quick action buttons
 * Supports both mouse drag & drop (HTML5) and touch drag & drop (custom).
 */
export default function MovieVotingCard({
  movie,
  currentPosition,
  totalPositions,
  onPositionChange,
  isDragging = false,
  isInUnranked = false,
  onTouchDrop,
  onTouchDragPositionChange,
}: MovieVotingCardProps) {
  const { t } = useTranslation("proposal");
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  const [showPositionPicker, setShowPositionPicker] = React.useState(false);

  // ─── Touch device detection (client-side only to avoid SSR hydration mismatch) ─
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    setIsTouchDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ─── refs used during a touch drag ───────────────────────────────────────
  const ghostRef = React.useRef<HTMLDivElement | null>(null);
  const lastHighlightedSlot = React.useRef<Element | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  /** Offset from the finger's touch point to the card's top-left corner */
  const touchOffsetRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // ─── Mouse drag (HTML5) ──────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        movieId: movie.id,
        currentPosition,
      }),
    );
  };

  // ─── Touch drag helpers ──────────────────────────────────────────────────

  /** Find the nearest ancestor (or self) that is a ranking slot. */
  const findSlotElement = (el: Element | null): Element | null => {
    while (el) {
      if (el.getAttribute("data-ranking-slot") === "true") return el;
      el = el.parentElement;
    }
    return null;
  };

  /** Remove the ghost element from the DOM and clear the ref. */
  const removeGhost = () => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  };

  /** Remove the touch-drag-over highlight from the previously highlighted slot. */
  const clearSlotHighlight = () => {
    if (lastHighlightedSlot.current) {
      lastHighlightedSlot.current.removeAttribute("data-touch-drag-over");
      lastHighlightedSlot.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle single-finger touches
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];

    // Build a ghost clone that follows the finger
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    touchOffsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };

    const ghost = card.cloneNode(true) as HTMLDivElement;
    ghost.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.85;
      transform: scale(1.04) rotate(1.5deg);
      box-shadow: 0 16px 40px rgba(0,0,0,0.35);
      border-radius: 0.5rem;
      transition: none;
    `;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!ghostRef.current) return;
    if (e.touches.length !== 1) return;

    e.preventDefault();

    const touch = e.touches[0];

    ghostRef.current.style.left = `${touch.clientX - touchOffsetRef.current.x}px`;
    ghostRef.current.style.top = `${touch.clientY - touchOffsetRef.current.y}px`;

    ghostRef.current.style.display = "none";
    const elementUnder = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );
    ghostRef.current.style.display = "";

    const slotUnder = findSlotElement(elementUnder);

    if (slotUnder !== lastHighlightedSlot.current) {
      clearSlotHighlight();
      if (slotUnder) {
        slotUnder.setAttribute("data-touch-drag-over", "true");
        lastHighlightedSlot.current = slotUnder;
        const posAttr = slotUnder.getAttribute("data-position");
        onTouchDragPositionChange?.(posAttr ? Number(posAttr) : null);
      } else {
        onTouchDragPositionChange?.(null);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    onTouchDragPositionChange?.(null);
    if (!ghostRef.current) {
      clearSlotHighlight();
      return;
    }

    const touch = e.changedTouches[0];

    ghostRef.current.style.display = "none";
    const elementUnder = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );
    ghostRef.current.style.display = "";

    removeGhost();
    clearSlotHighlight();

    const slotEl = findSlotElement(elementUnder);
    if (slotEl && onTouchDrop) {
      const posAttr = slotEl.getAttribute("data-position");
      if (posAttr) {
        const position = Number(posAttr);
        if (!isNaN(position)) {
          onTouchDrop(movie.id, position);
        }
      }
    }
  };

  const handleTouchCancel = () => {
    onTouchDragPositionChange?.(null);
    removeGhost();
    clearSlotHighlight();
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseEnter={() => !isTouchDevice && setShowQuickActions(true)}
      onMouseLeave={() => !isTouchDevice && setShowQuickActions(false)}
      onClick={() => {
        if (isInUnranked) {
          // On touch devices, tap toggles the quick-action position picker
          if (isTouchDevice) {
            setShowQuickActions((prev) => !prev);
          }
        } else {
          setShowPositionPicker((prev) => !prev);
        }
      }}
      className={[
        "group relative rounded-lg border transition-all duration-200",
        isInUnranked
          ? "bg-card/80 border-border/60 hover:border-primary/50 hover:bg-card"
          : "bg-card border-primary/30 hover:border-primary/60",
        // On touch devices, ranked cards get a subtle interactive cursor hint
        !isInUnranked ? "cursor-pointer" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 group-hover:opacity-100" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3">
        {/* Main content row */}
        <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0">
          {/* Drag Handle */}
          <div className="shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Movie Poster */}
          <div className="shrink-0">
            {movie.imageMedium || movie.image || movie.poster ? (
              <img
                alt={movie.title}
                src={movie.imageMedium || movie.image || movie.poster}
                className="h-20 w-14 rounded border border-border/60 object-cover shadow-sm"
              />
            ) : (
              <div className="h-20 w-14 rounded border border-border/60 bg-muted/50 flex items-center justify-center">
                <Star className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Movie Info */}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm leading-tight line-clamp-2">
              {movie.title}
              {movie.year && (
                <span className="ml-1.5 text-muted-foreground font-normal">
                  ({movie.year})
                </span>
              )}
            </div>
            {movie.director && (
              <div className="mt-1 text-xs text-muted-foreground truncate">
                {movie.director}
              </div>
            )}

            {/* Movie metadata row */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {movie.runtime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                  <Clock className="h-3 w-3" />
                  <span>{movie.runtime}</span>
                </div>
              )}
              {movie.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${movie.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  title="View on IMDb"
                >
                  <Image
                    src="/imdb-icon.webp"
                    alt="IMDb"
                    width={16}
                    height={16}
                    className="rounded-sm"
                  />
                </a>
              )}
              {(movie.rating || movie.imdbRating) && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-muted-foreground font-medium">
                    {movie.rating || movie.imdbRating}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side: badges and actions */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0 self-end sm:self-center">
          {/* Current Position Badge — with ChevronDown hint that it's tappable */}
          {currentPosition !== null && !isInUnranked && (
            <div
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 border border-primary/30 cursor-pointer hover:bg-primary/30 transition-colors"
              title={t("open.tapToReorder")}
            >
              <Star className="h-3.5 w-3.5 fill-primary/30 text-primary" />
              <span className="text-xs font-bold text-primary">
                {currentPosition}°
              </span>
              {/* Always-visible chevron indicating the badge is interactive */}
              <ChevronDown className="h-3 w-3 text-primary/70" />
            </div>
          )}

          {/* Remove from position button (only when positioned) */}
          {currentPosition !== null && !isInUnranked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPositionChange(null);
              }}
              className={[
                "shrink-0 h-7 w-7 p-0 transition-opacity hover:bg-destructive/20 hover:text-destructive",
                // On touch devices always show the X; on desktop keep hover-only behaviour
                isTouchDevice
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              ].join(" ")}
              title="Remove from ranking"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* "Tap to rank" always-visible pill — shown on touch devices for unranked cards */}
      {isInUnranked && isTouchDevice && !showQuickActions && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 pointer-events-none">
          <span className="text-[10px] font-medium text-primary leading-none">
            {t("open.tapToRank")}
          </span>
        </div>
      )}

      {/* Quick Action Buttons — shown on desktop hover OR on touch tap when in unranked area */}
      {isInUnranked && showQuickActions && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-1 shadow-lg animate-fade-in z-10">
          {Array.from(
            { length: Math.min(totalPositions, 5) },
            (_, i) => i + 1,
          ).map((pos) => (
            <Button
              key={pos}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPositionChange(pos);
                // Close the picker after selection on touch
                if (isTouchDevice) setShowQuickActions(false);
              }}
              className="h-7 w-7 p-0 rounded-full text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all"
              title={`Assign to position ${pos}`}
            >
              {pos}
            </Button>
          ))}
          {totalPositions > 5 && (
            <span className="text-xs text-muted-foreground px-1">...</span>
          )}
          {/* Close button — useful on touch so users can dismiss without selecting */}
          {isTouchDevice && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickActions(false);
              }}
              className="h-7 w-7 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive transition-all"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Position Picker - Show on click when in ranked slot */}
      {!isInUnranked && showPositionPicker && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-1 shadow-lg animate-fade-in z-10">
          {Array.from(
            { length: Math.min(totalPositions, 5) },
            (_, i) => i + 1,
          ).map((pos) => (
            <Button
              key={pos}
              variant={pos === currentPosition ? "default" : "ghost"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPositionChange(pos);
                setShowPositionPicker(false);
              }}
              className={[
                "h-7 w-7 p-0 rounded-full text-xs font-bold transition-all",
                pos === currentPosition
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-primary hover:text-primary-foreground",
              ].join(" ")}
              title={`Move to position ${pos}`}
            >
              {pos}
            </Button>
          ))}
          {totalPositions > 5 && (
            <span className="text-xs text-muted-foreground px-1">...</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowPositionPicker(false);
            }}
            className="h-7 w-7 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive transition-all"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
