import type { ReactNode, SyntheticEvent } from "react";
import Link from "next/link";
import { useCineforum } from "@/lib/client/contexts/CineforumContext";
import { movieDetailPath } from "@/lib/shared/routes";

type MovieLinkProps = {
  movieId: string;
  children: ReactNode;
  className?: string;
  /** Accessible name when the children are not descriptive (e.g. an icon). */
  ariaLabel?: string;
  /**
   * Open in a new tab. Use it where leaving the page would lose unsaved
   * state, such as a proposal ranking that has not been submitted yet.
   */
  newTab?: boolean;
};

/** Keeps a tap on the link from also toggling, expanding or dragging its parent row. */
const stop = (e: SyntheticEvent): void => e.stopPropagation();

/**
 * Link to a movie's page in the current cineforum. Renders its children as
 * plain content outside a cineforum context.
 */
export default function MovieLink({
  movieId,
  children,
  className,
  ariaLabel,
  newTab = false,
}: MovieLinkProps): JSX.Element {
  const { cineforumId } = useCineforum();
  if (!cineforumId) return <>{children}</>;

  return (
    <Link
      href={movieDetailPath(cineforumId, movieId)}
      className={
        className ?? "hover:text-primary hover:underline underline-offset-2"
      }
      aria-label={ariaLabel}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      draggable={false}
      onClick={stop}
      onPointerDown={stop}
      onTouchStart={stop}
      onMouseDown={stop}
    >
      {children}
    </Link>
  );
}
