import { Film } from "lucide-react";

type RankingHeaderProps = {
  title: string;
  label?: string;
};

export default function RankingHeader({
  title,
  label = "Voto",
}: RankingHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-t-xl">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-cine-red-soft to-primary opacity-90" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            rgba(255,255,255,0.05) 20px,
            rgba(255,255,255,0.05) 40px
          )`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Position column */}
          <div className="w-12 sm:w-16 flex items-center justify-center">
            <span className="text-primary-foreground/90 font-bold text-sm sm:text-base">
              #
            </span>
          </div>

          {/* Title column */}
          <div className="flex-1 flex items-center gap-2 sm:gap-3">
            <Film className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground/80" />
            <span className="font-bold text-sm sm:text-base uppercase tracking-wider text-primary-foreground">
              {title}
            </span>
          </div>

          {/* Rating column */}
          <div className="w-16 sm:w-20 text-right">
            <span className="font-bold text-sm sm:text-base uppercase tracking-wider text-primary-foreground">
              {label}
            </span>
          </div>

          {/* Expand icon spacer */}
          <div className="w-8 sm:w-10" />
        </div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent" />
    </div>
  );
}
