import * as React from "react";
import { Film } from "lucide-react";

/**
 * Builds a reliable IMDB poster URL from an imdbId.
 * Uses the IMDB media viewer CDN which is more stable than the suggest API URLs.
 */
function buildImdbPosterUrl(imdbId: string): string {
  return `https://m.media-amazon.com/images/M/${imdbId}._V1_UY268_CR7,0,182,268_AL_.jpg`;
}

export type MoviePosterProps = {
  /** IMDB CDN medium-res image (from imageMedium field) */
  imageMedium?: string | null;
  /** TMDB poster URL (from poster field) */
  poster?: string | null;
  /** IMDB CDN small image (from image field) */
  image?: string | null;
  /** IMDB ID — used to construct a fallback CDN URL */
  imdbId?: string | null;
  /** Alt text for the image */
  alt?: string;
  className?: string;
  /** Placeholder size class when no image is available (default: "h-24 w-16") */
  placeholderClassName?: string;
};

/**
 * Movie poster with automatic fallback chain:
 * imageMedium → poster → image → IMDB CDN (from imdbId) → placeholder
 *
 * Handles broken URLs via onError cycling through the chain.
 */
export default function MoviePoster({
  imageMedium,
  poster,
  image,
  imdbId,
  alt = "",
  className = "h-24 w-16 rounded-lg object-cover shadow-sm",
  placeholderClassName,
}: MoviePosterProps) {
  // Build the ordered fallback list, filtering out nulls/undefineds
  const candidates = React.useMemo<string[]>(() => {
    const list: string[] = [];
    if (imageMedium) list.push(imageMedium);
    if (poster) list.push(poster);
    if (image) list.push(image);
    if (imdbId) list.push(buildImdbPosterUrl(imdbId));
    return list;
  }, [imageMedium, poster, image, imdbId]);

  const [index, setIndex] = React.useState(0);

  // Reset index when candidates change (e.g. different movie)
  React.useEffect(() => {
    setIndex(0);
  }, [imageMedium, poster, image, imdbId]);

  const currentSrc = candidates[index] ?? null;

  if (!currentSrc) {
    return (
      <div
        className={
          placeholderClassName ??
          className.replace(/object-cover/g, "").trim() +
            " flex items-center justify-center bg-muted"
        }
        aria-hidden="true"
      >
        <Film className="h-5 w-5 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      // IMDb/Amazon CDN sometimes blocks hotlinked images based on the referrer;
      // omitting it makes the fallback chain resolve more reliably.
      referrerPolicy="no-referrer"
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex((i) => i + 1);
        } else {
          // All candidates exhausted — force re-render with no src to show placeholder
          setIndex(candidates.length);
        }
      }}
    />
  );
}
