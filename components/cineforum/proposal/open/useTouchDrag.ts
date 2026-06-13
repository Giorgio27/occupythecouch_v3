import { useEffect, useRef, useState } from "react";

interface UseTouchDragOptions {
  movieId: string;
  onTouchDrop?: (movieId: string, position: number) => void;
  onTouchDragPositionChange?: (position: number | null) => void;
}

const LONG_PRESS_DELAY = 350;
const LONG_PRESS_MOVE_THRESHOLD = 8;

/**
 * Handles mobile long-press drag using a dedicated drag handle element.
 *
 * Touch events and touch-action:none are scoped to dragHandleRef only,
 * so the rest of the card stays scrollable. The ghost is created from
 * the full card (cardRef) for visual fidelity.
 *
 * Desktop drag is handled separately via the HTML5 draggable API on the card.
 */
export function useTouchDrag({
  movieId,
  onTouchDrop,
  onTouchDragPositionChange,
}: UseTouchDragOptions) {
  /** Outer card div — used only to size/position the drag ghost. */
  const cardRef = useRef<HTMLDivElement | null>(null);
  /** Grip icon div — touch events live here; touch-action:none scoped here. */
  const dragHandleRef = useRef<HTMLDivElement | null>(null);

  const ghostRef = useRef<HTMLDivElement | null>(null);
  const lastHighlightedSlot = useRef<Element | null>(null);
  const touchOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragActiveRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouchPressing, setIsTouchPressing] = useState(false);

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

  /**
   * Full cleanup: removes the highlight attribute AND nulls the ref.
   * Call from touchend / touchcancel only.
   */
  const clearSlotHighlight = () => {
    if (lastHighlightedSlot.current) {
      lastHighlightedSlot.current.removeAttribute("data-touch-drag-over");
      lastHighlightedSlot.current = null;
    }
  };

  /**
   * Removes only the visual attribute, keeps the ref pointing to the last slot.
   * Used in touchmove so the last confirmed slot stays as a sticky drop target:
   * a micro-slip just before release still triggers the drop.
   */
  const removeSlotVisual = () => {
    if (lastHighlightedSlot.current) {
      lastHighlightedSlot.current.removeAttribute("data-touch-drag-over");
    }
  };

  useEffect(() => {
    const handle = dragHandleRef.current;
    const card = cardRef.current;
    if (!handle || !card) return;

    // Scoped to the handle only — keeps the rest of the card scrollable.
    // touch-action:none → browser won't start scroll during the 350ms wait.
    // -webkit-touch-callout:none → iOS won't show the link callout on inner anchors.
    // user-select:none → prevents text-selection touchcancel.
    handle.style.touchAction = "none";
    handle.style.setProperty("-webkit-touch-callout", "none");
    handle.style.userSelect = "none";

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchDragActiveRef.current = false;
      setIsTouchPressing(true);

      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        setIsTouchPressing(false);

        // Ghost is sized from the full card, not just the handle.
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
      const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
      ghost.style.display = "";

      const slotUnder = findSlotElement(elementUnder);

      if (slotUnder !== lastHighlightedSlot.current) {
        if (slotUnder) {
          // Entered a new slot — switch highlight to the new one.
          removeSlotVisual();
          slotUnder.setAttribute("data-touch-drag-over", "true");
          lastHighlightedSlot.current = slotUnder;
          const posAttr = slotUnder.getAttribute("data-position");
          onTouchDragPositionChangeRef.current?.(posAttr ? Number(posAttr) : null);
        } else {
          // Left all slots — clear visual but keep lastHighlightedSlot sticky.
          // This ensures a micro-slip at release still drops onto the last slot.
          removeSlotVisual();
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
      // Prevent the synthetic click (would open PositionPicker on ranked cards).
      e.preventDefault();
      touchDragActiveRef.current = false;

      // Primary: sticky slot from touchmove.
      // Fallback: if the drag started but the finger never crossed a slot,
      // do one final hit-test at the lift position.
      let slotEl = lastHighlightedSlot.current;
      if (!slotEl && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const ghost = ghostRef.current;
        if (ghost) ghost.style.display = "none";
        const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        if (ghost) ghost.style.display = "";
        slotEl = findSlotElement(elementUnder);
      }

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

    handle.addEventListener("touchstart", onTouchStart, { passive: true });
    handle.addEventListener("touchmove", onTouchMove, { passive: false });
    handle.addEventListener("touchend", onTouchEnd, { passive: false });
    handle.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      handle.removeEventListener("touchstart", onTouchStart);
      handle.removeEventListener("touchmove", onTouchMove);
      handle.removeEventListener("touchend", onTouchEnd);
      handle.removeEventListener("touchcancel", onTouchCancel);
      handle.style.touchAction = "";
      handle.style.removeProperty("-webkit-touch-callout");
      handle.style.userSelect = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  return { cardRef, dragHandleRef, isTouchPressing };
}
