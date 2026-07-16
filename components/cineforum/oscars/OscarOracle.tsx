import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Crown, Medal, Loader2, ChevronDown } from "lucide-react";
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
  /** Candidate movies — used only for display data (poster/title/actual rating). */
  winners: MovieWinnerDTO[];
  /** Closed round → show a "predicted vs actual" recap instead of the scratch card. */
  closed: boolean;
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

const REVEAL_THRESHOLD = 0.5;
const BRUSH_RADIUS = 20;

/**
 * The Oracle's prediction for an oscar round. The forecast is computed
 * server-side from the club's historical taste + the candidates' platform
 * ratings — it never reads the club's votes on these candidates.
 *
 * Open round  → a scratch card the reader must deliberately reveal (no bias).
 * Closed round → a "predicted vs actual" recap.
 *
 * The prediction is fetched LAZILY (only after the user scratches / opens the
 * recap), so listing many closed rounds doesn't fire many requests up front.
 */
export default function OscarOracle({
  cineforumId,
  roundId,
  winners,
  closed,
}: OscarOracleProps) {
  const { t } = useTranslation("oscars");
  const [armed, setArmed] = useState(false); // has the user asked for it yet?
  const [prediction, setPrediction] = useState<OracleResponseDTO | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [fading, setFading] = useState(false);
  const [foilPainted, setFoilPainted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Lazy fetch: only once the user has armed it (scratch / open recap).
  useEffect(() => {
    if (!armed) return;
    let alive = true;
    jsonFetch<OracleResponseDTO>(
      `/api/cineforum/${cineforumId}/oscars/oracle?roundId=${roundId}`,
    )
      .then((res) => alive && setPrediction(res))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [armed, cineforumId, roundId]);

  const winnerById = useMemo(() => {
    const map = new Map<string, MovieWinnerDTO>();
    for (const w of winners) map.set(w.id, w);
    return map;
  }, [winners]);

  // Actual club ranking (closed rounds only) — from the real round ratings.
  const actualRank = useMemo(() => {
    const map = new Map<string, { rank: number; rating: number }>();
    winners
      .filter((w) => w.roundRating != null)
      .sort((a, b) => (b.roundRating ?? 0) - (a.roundRating ?? 0))
      .forEach((w, i) => map.set(w.id, { rank: i + 1, rating: w.roundRating! }));
    return map;
  }, [winners]);

  const ranked = prediction?.body ?? [];

  // Paint the foil (open round only, before reveal).
  useEffect(() => {
    if (closed || revealed) return;
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

      const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      grad.addColorStop(0, "#7c3aed");
      grad.addColorStop(0.5, "#a855f7");
      grad.addColorStop(1, "#6d28d9");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rect.width, rect.height);

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
  }, [closed, revealed]);

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
    setArmed(true);
    setFading(true);
    window.setTimeout(() => setRevealed(true), 450);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setArmed(true);
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointFromEvent(e);
    lastPoint.current = null;
    scratchLine(p.x, p.y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    scratchLine(pointFromEvent(e).x, pointFromEvent(e).y);
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    if (!fading && clearedRatio() >= REVEAL_THRESHOLD) reveal();
  };

  const wrap = (child: React.ReactNode) => (
    <div className="mt-3 border-t border-border/40 pt-3">{child}</div>
  );

  // ── Closed round: predicted-vs-actual recap (lazy, no scratch) ─────────────
  if (closed) {
    if (!armed) {
      return wrap(
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-violet-500/30 bg-linear-to-br from-violet-500/5 to-primary/5 px-4 py-2.5 text-sm font-semibold text-violet-500 transition-colors hover:bg-violet-500/10"
        >
          <Sparkles className="h-4 w-4" />
          {t("oracle.recapTitle")}
          <ChevronDown className="ml-auto h-4 w-4" />
        </button>,
      );
    }
    if (ranked.length === 0) {
      return wrap(
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>,
      );
    }
    if (ranked.length < 2) return null;

    const predWinner = ranked[0];
    const actualWinner = winners
      .filter((w) => w.roundRating != null)
      .sort((a, b) => (b.roundRating ?? 0) - (a.roundRating ?? 0))[0];
    const hit = actualWinner && actualWinner.id === predWinner.movie_id;

    return wrap(
      <div className="rounded-xl border border-violet-500/30 bg-linear-to-br from-violet-500/5 to-primary/5 p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-500">
          <Sparkles className="h-3.5 w-3.5" />
          {t("oracle.recapTitle")}
        </div>

        {hit ? (
          <p className="mb-3 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {t("oracle.hit")}
          </p>
        ) : actualWinner ? (
          <p className="mb-3 text-[11px] text-muted-foreground">
            {t("oracle.miss", {
              predicted: predWinner.title,
              actual: winnerById.get(actualWinner.id)?.title ?? actualWinner.title,
            })}
          </p>
        ) : null}

        <ol className="space-y-1">
          {ranked.map((r, i) => {
            const act = actualRank.get(r.movie_id);
            const delta = act ? i + 1 - act.rank : null; // + → finished higher
            return (
              <li key={r.movie_id} className="flex items-center gap-2 text-sm">
                <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {r.title}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {t("oracle.colPred")} {r.predicted_rating.toFixed(2)}
                </span>
                <span className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums">
                  {act ? (
                    <>
                      {t("oracle.colReal")} {act.rating.toFixed(2)}
                      {delta !== null && delta !== 0 && (
                        <span
                          className={
                            delta > 0
                              ? "ml-1 text-emerald-500"
                              : "ml-1 text-red-500"
                          }
                        >
                          {delta > 0 ? `↑${delta}` : `↓${-delta}`}
                        </span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>,
    );
  }

  // ── Open round: scratch card ───────────────────────────────────────────────
  if (prediction && ranked.length < 2) return null;

  const winner = ranked[0];
  const podium = ranked.slice(0, 4);

  return wrap(
    <div
      ref={containerRef}
      className="relative min-h-32 overflow-hidden rounded-xl border border-violet-500/30 bg-linear-to-br from-violet-500/5 to-primary/5"
    >
      {/* Revealed prediction (hidden until the foil has painted over it) */}
      <div
        className={`p-4 transition-opacity ${
          !revealed && !foilPainted ? "opacity-0" : "opacity-100"
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

            <div className="flex items-center gap-3">
              <MoviePoster
                imageMedium={winnerById.get(winner.movie_id)?.imageMedium}
                poster={winnerById.get(winner.movie_id)?.poster}
                image={winnerById.get(winner.movie_id)?.image}
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

            {podium.length > 1 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("oracle.podium")}
                </p>
                <ol className="space-y-1">
                  {podium.map((c, i) => (
                    <li key={c.movie_id} className="flex items-center gap-2 text-sm">
                      <Medal
                        className={`h-4 w-4 shrink-0 ${
                          i === 0
                            ? "text-yellow-400"
                            : i === 1
                              ? "text-gray-300"
                              : i === 2
                                ? "text-amber-600"
                                : "text-muted-foreground/50"
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
      {!revealed && (
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
    </div>,
  );
}
