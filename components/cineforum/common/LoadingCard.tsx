import { Card, CardContent } from "@/components/ui/card";

export default function LoadingCard({ text = "Loading…" }: { text?: string }) {
  return (
    <Card>
      <CardContent className="py-6">{text}</CardContent>
    </Card>
  );
}
