import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Trophy, Film, Sparkles, Clock } from "lucide-react";

export default function ClosedProposal({
  last,
}: {
  last: {
    id: string;
    date: string | null;
    title: string;
    winner?: { id: string; title: string } | null;
  };
}) {
  const winnerTitle = last.winner?.title ?? last.title;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Winner Announcement Card */}
      <Card className="cine-card relative overflow-hidden border-2 border-primary/30">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />

        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-full bg-primary/20 animate-glow-pulse">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <span className="text-gradient">Film Vincitore</span>
            </CardTitle>

            <div className="cine-badge animate-scale-in delay-200">
              <Sparkles className="mr-2 h-4 w-4" />
              Proposta chiusa
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6">
          {/* Winner Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Film className="h-4 w-4 text-primary/70" />
              <span>Il gruppo ha scelto</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-balance leading-tight">
              <span className="text-foreground hover-glow transition-all duration-300">
                {winnerTitle}
              </span>
            </div>
          </div>

          {/* Screening Date */}
          {last.date && (
            <div className="cine-card p-4 bg-primary/5 border-primary/20 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Data di proiezione
                  </div>
                  <div className="text-lg font-bold text-foreground mt-0.5">
                    {last.date}
                  </div>
                </div>
                <Clock className="h-5 w-5 text-primary/50" />
              </div>
            </div>
          )}

          {/* Proposal Info */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
              <span>
                Proposta:{" "}
                <span className="font-semibold text-foreground">
                  {last.title}
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Message */}
      <div className="cine-card cine-glass p-4 animate-fade-in-up delay-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">
              Proiezione programmata
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              La votazione è conclusa e il film vincitore è stato selezionato.
              Dopo la data di proiezione, potrai creare una nuova proposta per
              il prossimo round.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
