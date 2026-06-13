import { useEffect, useRef, useState } from "react";

interface UseTouchDragOptions {
  movieId: string;
  onTouchDrop?: (movieId: string, position: number) => void;
  onTouchDragPositionChange?: (position: number | null) => void;
}

// Pixels of movement needed before the drag ghost appears.
const DRAG_START_THRESHOLD = 4;

/**
 * Mobile drag-and-drop via a dedicated grip handle.
 *
 * Design principles:
 * - NO long-press timer. The user touches the grip and moves — ghost starts
 *   immediately after DRAG_START_THRESHOLD px. This eliminates the entire
 *   class of "held too long → iOS system event → touchcancel → broken state"
 *   bugs that plagued the timer-based approach.
 * - touch-action/callout/user-select are scoped to the handle only so the
 *   rest of the card remains normally scrollable.
 * - touchend on the handle always prevents the synthetic click so the
 *   grip is drag-only (tapping the card body still opens the PositionPicker).
 * - Sticky drop target: lastHighlightedSlot is not cleared when the finger
 *   leaves a slot momentarily — only on touchend/touchcancel — so a
 *   micro-slip before release still commits the drop.
 *
 * cardRef    → outer card div, used only for ghost sizing/positioning.
 * dragHandleRef → grip icon div, touch events and CSS live here.
 */
export function useTouchDrag({
  movieId,
  onTouchDrop,
  onTouchDragPositionChange,
}: UseTouchDragOptions) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const lastHighlightedSlot = useRef<Element | null>(null);
  const touchOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDragActiveRef = useRef(false);
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

  const clearSlotHighlight = () => {
    if (lastHighlightedSlot.current) {
      lastHighlightedSlot.current.removeAttribute("data-touch-drag-over");
      lastHighlightedSlot.current = null;
    }
  };

  const removeSlotVisual = () => {
    if (lastHighlightedSlot.current) {
      lastHighlightedSlot.current.removeAttribute("data-touch-drag-over");
    }
  };

  useEffect(() => {
    const handle = dragHandleRef.current;
    const card = cardRef.current;
    if (!handle || !card) return;

    // Scoped to handle only — rest of card stays scrollable on mobile.
    // touch-action:none → browser never starts scroll for this touch sequence.
    // -webkit-touch-callout:none → no iOS link/image callout on long press.
    // user-select:none → no text-selection gesture.
    handle.style.touchAction = "none";
    handle.style.setProperty("-webkit-touch-callout", "none");
    handle.style.userSelect = "none";

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchDragActiveRef.current = false;
      setIsTouchPressing(true);
    };

    const startDrag = (startClientX: number, startClientY: number) => {
      setIsTouchPressing(false);
      const rect = card.getBoundingClientRect();
      touchOffsetRef.current = {
        x: startClientX - rect.left,
        y: startClientY - rect.top,
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
      if (navigator.vibrate) navigator.vibrate(20);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;

      if (!touchDragActiveRef.current) {
        if (
          Math.abs(dx) > DRAG_START_THRESHOLD ||
          Math.abs(dy) > DRAG_START_THRESHOLD
        ) {
          e.preventDefault();
          startDrag(touchStartPosRef.current.x, touchStartPosRef.current.y);
          // Fall through immediately to update ghost position on this same event.
        } else {
          return;
        }
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
          removeSlotVisual();
          slotUnder.setAttribute("data-touch-drag-over", "true");
          lastHighlightedSlot.current = slotUnder;
          const posAttr = slotUnder.getAttribute("data-position");
          onTouchDragPositionChangeRef.current?.(posAttr ? Number(posAttr) : null);
        } else {
          // Left all slots — clear visual but keep ref sticky so a micro-slip
          // just before release still commits the drop.
          removeSlotVisual();
          onTouchDragPositionChangeRef.current?.(null);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      setIsTouchPressing(false);
      // Always prevent click — the grip handle is drag-only.
      // Tapping the card body (not the grip) still opens the PositionPicker.
      e.preventDefault();
      onTouchDragPositionChangeRef.current?.(null);

      if (!touchDragActiveRef.current) {
        clearSlotHighlight();
        return;
      }
      touchDragActiveRef.current = false;

      // Primary: sticky slot tracked during touchmove.
      // Fallback: finger never crossed a slot, or last touchmove missed it —
      // do a final hit-test at the lift position.
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
