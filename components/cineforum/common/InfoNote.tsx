import { Info } from "lucide-react";

type Props = {
  title: string;
  /** One or more explanatory paragraphs, rendered in order. */
  paragraphs: string[];
  className?: string;
};

/** "How this is computed" callout: an icon, a title, and explanatory paragraphs. */
export default function InfoNote({ title, paragraphs, className = "" }: Props) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-border bg-muted/30 p-4 ${className}`}
    >
      <div className="h-fit shrink-0 rounded-lg bg-primary/10 p-2">
        <Info className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
        {paragraphs.map((text, index) => (
          <p
            key={index}
            className={`text-sm leading-relaxed text-muted-foreground ${index > 0 ? "mt-3" : ""}`}
          >
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
