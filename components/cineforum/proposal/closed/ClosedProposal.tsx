import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Trophy } from "lucide-react";

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
    <Card className="cine-card relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <CardHeader className="relative pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Winner
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-2">
        <div className="text-xl sm:text-2xl font-black tracking-tight text-balance">
          <span className="text-gradient">{winnerTitle}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-primary/70" />
          <span>Screening date: {last.date ?? "-"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
