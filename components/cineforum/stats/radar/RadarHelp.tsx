import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PROFILE_AXES } from "@/lib/shared/types";

/** Collapsed-by-default "how to read the hexagons" explanation. */
export default function RadarHelp() {
  const { t } = useTranslation("stats");

  return (
    <Accordion
      type="single"
      collapsible
      className="mb-4 rounded-xl border border-border bg-secondary/30 px-4"
    >
      <AccordionItem value="help" className="border-b-0">
        <AccordionTrigger className="py-3 text-sm font-semibold text-foreground hover:no-underline">
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            {t("radar.howTitle")}
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>{t("radar.howProfile")}</p>
          <ul className="space-y-1">
            {PROFILE_AXES.map((key) => (
              <li key={key}>
                <span className="font-semibold text-foreground">
                  {t(`radar.profile.${key}`)}
                </span>
                : {t(`radar.profileHelp.${key}`)}
              </li>
            ))}
          </ul>
          <p>{t("radar.howTaste")}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
