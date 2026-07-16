import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Crown, Medal, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { jsonFetch } from "@/lib/client/https";
import MoviePoster from "@/components/ui/MoviePoster";
import type {
  MovieWinnerDTO,
  OracleResponseDTO,
  OracleConfidence,
} from "@/lib/shared/types/cineforum";

interface OscarOracleProps {
  cineforumId: string;
  roundId: string;
  /** Candidate movies — used only for display data (poster/title), never votes. */
  winners: MovieWinnerDTO[];
}

const CONFIDENCE_STYLE: Record<OracleConfidence, string> = {
  sure: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  likely: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  tossup: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const CONFIDENCE_KEY: Record<OracleConfidence, string> = {
  sure: "oracle.confidenceSure",
  likely: "oracle.confidenceLikely",
  tossup: "oracle.confidenceTossup",
};

/** Fraction of the foil that must be scratched away before it auto-reveals. */
const REVEAL_THRESHOLD = 0.5;
/** Radius (CSS px) of the scratch brush. */
const BRUSH_RADIUS = 20;

/**
 * A playful "scratch card" hiding the Oracle's prediction for an OPEN oscar
 * round. The prediction is computed server-side from the club's historical taste
 * and the candidates' platform ratings — it never reads the club's votes on the
 * candidates. Hidden behind a foil the reader must deliberately scratch, so it
 * only ever appears opt-in.
 */
export default function OscarOracle({
  cineforumId,
  roundId,
  winners,
}: OscarOracleProps) {
  const { t } = useTranslation("oscars");
  const [prediction, setPrediction] = useState<OracleResponseDTO | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [fading, setFading] = useState(false);
  // Guards against a 1-frame flash of the answer before the foil canvas paints.
  const [foilPainted, setFoilPainted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let alive = true;
    jsonFetch<OracleResponseDTO>(
      `/api/cineforum/${cineforumId}/oscars/oracle?roundId=${roundId}`,
    )
      .then((res) => {
        if (alive) setPrediction(res);
      })
      .catch(() => {
        /* silent — oracle is a non-critical flourish */
      });
    return () => {
      alive = false;
    };
  }, [cineforumId, roundId]);

  const posterById = useMemo(() => {
    const map = new Map<string, MovieWinnerDTO>();
    for (const w of winners) map.set(w.id, w);
    return map;
  }, [winners]);

  const ranked = prediction?.body ?? [];

  // Paint / repaint the foil layer to match the container size.
  useEffect(() => {
    if (revealed || ranked.length < 2) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const paint = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Base foil gradient.
      const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      grad.addColorStop(0, "#7c3aed");
      grad.addColorStop(0.5, "#a855f7");
      grad.addColorStop(1, "#6d28d9");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Diagonal shimmer stripes.
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 8;
      for (let x = -rect.height; x < rect.width; x += 26) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + rect.height, rect.height);
        ctx.stroke();
      }
      ctx.restore();

      // Sparkle speckles.
      ctx.save();
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        ctx.globalAlpha = 0.15 + Math.random() * 0.35;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 1.6 + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      setFoilPainted(true);
    };

    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [revealed, ranked.length]);

  const scratchLine = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = BRUSH_RADIUS * 2;
    const prev = lastPoint.current;
    ctx.beginPath();
    if (prev) {
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    lastPoint.current = { x, y };
  };

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const clearedRatio = (): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    const { width, height } = canvas;
    if (width === 0 || height === 0) return 0;
    const data = ctx.getImageData(0, 0, width, height).data;
    let cleared = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 64) {
      total++;
      if (data[i] === 0) cleared++;
    }
    return total > 0 ? cleared / total : 0;
  };

  const reveal = () => {
    setFading(true);
    window.setTimeout(() => setRevealed(true), 450);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointFromEvent(e);
    lastPoint.current = null;
    scratchLine(p.x, p.y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = pointFromEvent(e);
    scratchLine(p.x, p.y);
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    if (!fading && clearedRatio() >= REVEAL_THRESHOLD) reveal();
  };

  // Nothing to predict (no history or a single candidate) — render nothing.
  if (prediction && ranked.length < 2) return null;

  const winner = ranked[0];
  const podium = ranked.slice(0, 3);
  const showFoil = !revealed && ranked.length >= 2;

  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-violet-500/30 bg-linear-to-br from-violet-500/5 to-primary/5"
      >
        {/* Revealed prediction (kept hidden until the foil has painted over it) */}
        <div
          className={`p-4 transition-opacity ${
            showFoil && !foilPainted ? "opacity-0" : "opacity-100"
          }`}
        >
          {ranked.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-500">
                <Sparkles className="h-3.5 w-3.5" />
                {t("oracle.title")}
              </div>

              {/* Predicted winner */}
              <div className="flex items-center gap-3">
                <MoviePoster
                  imageMedium={posterById.get(winner.movie_id)?.imageMedium}
                  poster={posterById.get(winner.movie_id)?.poster}
                  image={posterById.get(winner.movie_id)?.image}
                  alt={winner.title}
                  className="h-16 w-11 shrink-0 rounded-md object-cover shadow"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground leading-none">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    {t("oracle.willWin")}
                  </p>
                  <p className="truncate text-base font-black text-foreground">
                    {winner.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        CONFIDENCE_STYLE[prediction!.confidence]
                      }`}
                    >
                      {t(CONFIDENCE_KEY[prediction!.confidence])}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {t("oracle.predictedShort")} {winner.predicted_rating.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Predicted podium */}
              {podium.length > 1 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("oracle.podium")}
                  </p>
                  <ol className="space-y-1">
                    {podium.map((c, i) => (
                      <li
                        key={c.movie_id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Medal
                          className={`h-4 w-4 shrink-0 ${
                            i === 0
                              ? "text-yellow-400"
                              : i === 1
                                ? "text-gray-300"
                                : "text-amber-600"
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          {c.title}
                        </span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                          {c.predicted_rating.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <p className="mt-3 text-[11px] italic text-muted-foreground">
                {t("oracle.basisNote", { count: prediction!.based_on_films })}
              </p>
            </>
          )}
        </div>

        {/* Foil scratch layer */}
        {showFoil && (
          <>
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className={`absolute inset-0 z-10 touch-none cursor-grab transition-opacity duration-500 active:cursor-grabbing ${
                fading ? "opacity-0" : "opacity-100"
              }`}
            />
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 text-center text-white">
              <Sparkles
                className={`h-6 w-6 transition-opacity duration-500 ${
                  fading ? "opacity-0" : "opacity-100"
                }`}
              />
              <p
                className={`text-sm font-bold transition-opacity duration-500 ${
                  fading ? "opacity-0" : "opacity-100"
                }`}
              >
                {t("oracle.cover")}
              </p>
              <p
                className={`text-xs transition-opacity duration-500 ${
                  fading ? "opacity-0" : "opacity-90"
                }`}
              >
                {t("oracle.coverHint")}
              </p>
            </div>

            {/* Sparkle burst while the foil dissolves */}
            {fading && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <Sparkles
                    key={i}
                    className="absolute h-5 w-5 animate-ping text-violet-300"
                    style={{
                      left: `${25 + i * 16}%`,
                      top: `${30 + (i % 2) * 30}%`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                ))}
              </div>
            )}

            {!fading && (
              <button
                type="button"
                onClick={reveal}
                className="absolute bottom-2 right-2 z-30 rounded-md bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                {t("oracle.revealAll")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
