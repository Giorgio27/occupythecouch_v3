import { useEffect, useRef, useState } from "react";

interface UseTouchDragOptions {
  movieId: string;
  onTouchDrop?: (movieId: string, position: number) => void;
  onTouchDragPositionChange?: (position: number | null) => void;
}

const LONG_PRESS_DELAY = 350;
const LONG_PRESS_MOVE_THRESHOLD = 8;

export function useTouchDrag({
  movieId,
  onTouchDrop,
  onTouchDragPositionChange,
}: UseTouchDragOptions) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const lastHighlightedSlot = useRef<Element | null>(null);
  const touchOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragActiveRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouchPressing, setIsTouchPressing] = useState(false);

  // Stable refs for callbacks
  const onTouchDropRef = useRef(onTouchDrop);
  const onTouchDragPositionChangeRef = useRef(onTouchDragPositionChange);
  useEffect(() => {
    onTouchDropRef.current = onTouchDrop;
  }, [onTouchDrop]);
  useEffect(() => {
    onTouchDragPositionChangeRef.current = onTouchDragPositionChange;
  }, [onTouchDragPositionChange]);

  const findSlotElement = (el: Element | null): Element | null => {
    while (el) {
      if (el.getAttribute("data-ranking-slot") === "true") return el;
      el = el.parentElement;
    }
    return null;
  };

  const removeGhost = () => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  };

  const clearSlotHighlight = () => {
    if (lastHighlightedSlot.current) {
      lastHighlightedSlot.current.removeAttribute("data-touch-drag-over");
      lastHighlightedSlot.current = null;
    }
  };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchDragActiveRef.current = false;
      setIsTouchPressing(true);

      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        setIsTouchPressing(false);

        const rect = card.getBoundingClientRect();
        touchOffsetRef.current = {
          x: touchStartPosRef.current.x - rect.left,
          y: touchStartPosRef.current.y - rect.top,
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
        touchDragActiveRef.current = true;
        if (navigator.vibrate) navigator.vibrate(30);
      }, LONG_PRESS_DELAY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;

      if (!touchDragActiveRef.current) {
        if (
          Math.abs(dx) > LONG_PRESS_MOVE_THRESHOLD ||
          Math.abs(dy) > LONG_PRESS_MOVE_THRESHOLD
        ) {
          if (longPressTimerRef.current !== null) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          setIsTouchPressing(false);
        }
        return;
      }

      e.preventDefault();
      const ghost = ghostRef.current;
      if (!ghost) return;

      ghost.style.left = `${touch.clientX - touchOffsetRef.current.x}px`;
      ghost.style.top = `${touch.clientY - touchOffsetRef.current.y}px`;

      ghost.style.display = "none";
      const elementUnder = document.elementFromPoint(
        touch.clientX,
        touch.clientY,
      );
      ghost.style.display = "";

      const slotUnder = findSlotElement(elementUnder);
      if (slotUnder !== lastHighlightedSlot.current) {
        clearSlotHighlight();
        if (slotUnder) {
          slotUnder.setAttribute("data-touch-drag-over", "true");
          lastHighlightedSlot.current = slotUnder;
          const posAttr = slotUnder.getAttribute("data-position");
          onTouchDragPositionChangeRef.current?.(
            posAttr ? Number(posAttr) : null,
          );
        } else {
          onTouchDragPositionChangeRef.current?.(null);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsTouchPressing(false);
      onTouchDragPositionChangeRef.current?.(null);

      if (!touchDragActiveRef.current) {
        clearSlotHighlight();
        return;
      }
      // Prevent the synthetic click that browsers fire after touchend,
      // which would open the PositionPicker on ranked cards.
      e.preventDefault();
      touchDragActiveRef.current = false;

      const slotEl = lastHighlightedSlot.current;
      removeGhost();
      clearSlotHighlight();

      if (slotEl && onTouchDropRef.current) {
        const posAttr = slotEl.getAttribute("data-position");
        if (posAttr) {
          const position = Number(posAttr);
          if (!isNaN(position)) onTouchDropRef.current(movieId, position);
        }
      }
    };

    const onTouchCancel = () => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsTouchPressing(false);
      touchDragActiveRef.current = false;
      onTouchDragPositionChangeRef.current?.(null);
      removeGhost();
      clearSlotHighlight();
    };

    card.addEventListener("touchstart", onTouchStart, { passive: true });
    card.addEventListener("touchmove", onTouchMove, { passive: false });
    card.addEventListener("touchend", onTouchEnd, { passive: false });
    card.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      card.removeEventListener("touchstart", onTouchStart);
      card.removeEventListener("touchmove", onTouchMove);
      card.removeEventListener("touchend", onTouchEnd);
      card.removeEventListener("touchcancel", onTouchCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  return { cardRef, isTouchPressing };
}
