import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Winner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-lg font-medium">
          {last.winner?.title ?? last.title}
        </div>
        <div className="text-sm text-muted-foreground">
          Screening date: {last.date ?? "-"}
        </div>
      </CardContent>
    </Card>
  );
}
