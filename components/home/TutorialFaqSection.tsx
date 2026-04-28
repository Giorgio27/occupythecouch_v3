"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

const FAQ_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

type AccordionItemProps = {
  qKey: string;
  index: number;
  isInView: boolean;
};

function AccordionItem({ qKey, index, isInView }: AccordionItemProps) {
  const { t } = useTranslation("tutorial");
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`cine-card overflow-hidden transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 md:p-6 text-left group"
        aria-expanded={open}
      >
        <span className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 leading-snug">
          {t(`faq.q${qKey}`)}
        </span>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-primary" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96" : "max-h-0"}`}
      >
        <p className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 text-sm sm:text-base text-muted-foreground leading-relaxed border-t border-border/50 pt-3 sm:pt-4">
          {t(`faq.a${qKey}`)}
        </p>
      </div>
    </div>
  );
}

export default function TutorialFaqSection() {
  const { t } = useTranslation("tutorial");
  const { ref, isInView } = useInView(0.1);

  return (
    <section className="py-16 sm:py-20 md:py-28 lg:py-36 relative">
      <div
        ref={ref}
        className="mx-auto max-w-site px-4 sm:px-6 lg:px-8 xl:px-4"
      >
        <div
          className={`transition-all duration-700 mb-10 sm:mb-12 md:mb-16 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="cine-title mb-4 sm:mb-6 text-xl sm:text-2xl md:text-3xl">
            {t("faq.title")}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
            {t("faq.subtitle")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {FAQ_KEYS.map((key, idx) => (
            <AccordionItem
              key={key}
              qKey={key}
              index={idx}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
