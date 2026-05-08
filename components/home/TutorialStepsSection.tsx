"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusCircle,
  Film,
  Vote,
  XCircle,
  Trophy,
  Bell,
  UserPlus,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  BarChart2,
} from "lucide-react";

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

const STEP_ICONS = [
  UserPlus, // 01 invite
  PlusCircle, // 02 create round
  Film, // 03 proposals
  Vote, // 04 vote
  XCircle, // 05 close proposal
  Trophy, // 06 oscar voting
  XCircle, // 07 close round
  Bell, // 08 notifications
  BarChart2, // 09 rankings
];
const STEP_ACCENTS = [
  "bg-primary/10",
  "bg-green-500/10",
  "bg-amber-500/10",
  "bg-primary/10",
  "bg-cine-red-soft/10",
  "bg-yellow-500/10",
  "bg-green-500/10",
  "bg-primary/10",
  "bg-blue-500/10",
];
const STEP_KEYS = [
  "step01",
  "step02",
  "step03",
  "step04",
  "step05",
  "step06",
  "step07",
  "step08",
  "step09",
] as const;
const STEPS_LENGTH = STEP_KEYS.length;

type StepKey = (typeof STEP_KEYS)[number];

type StepCardProps = {
  stepKey: StepKey;
  number: string;
  index: number;
  isInView: boolean;
};

function StepCard({ stepKey, number, index, isInView }: StepCardProps) {
  const { t } = useTranslation("tutorial");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const Icon = STEP_ICONS[index];
  const accent = STEP_ACCENTS[index];

  const bullets = [
    t(`steps.${stepKey}.bullet1`),
    t(`steps.${stepKey}.bullet2`),
    t(`steps.${stepKey}.bullet3`),
    t(`steps.${stepKey}.bullet4`),
  ];

  return (
    <div
      className={`relative group transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${Math.min(index * 80, 400)}ms` }}
    >
      <div className="cine-card hover-lift relative overflow-hidden p-5 sm:p-6 md:p-8">
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Step number watermark */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 text-5xl sm:text-6xl font-black text-foreground/[0.04] select-none pointer-events-none leading-none">
          {number}
        </div>

        <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 md:gap-8 relative">
          {/* Icon + subtitle column */}
          <div className="shrink-0 flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-3 lg:w-48 xl:w-56">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150" />
              <div
                className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl ${accent} border-2 border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-primary/60 tracking-widest uppercase">
                  Step {number}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-snug">
                {t(`steps.${stepKey}.subtitle`)}
              </p>
            </div>
          </div>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-2 sm:mb-3">
              {t(`steps.${stepKey}.title`)}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-5">
              {t(`steps.${stepKey}.description`)}
            </p>

            <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
              {bullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-3 sm:mb-4">
              <span className="text-primary text-base leading-none mt-0.5">
                💡
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground/80">
                  {t("steps.tipLabel")}{" "}
                </span>
                {t(`steps.${stepKey}.tip`)}
              </p>
            </div>

            {/* Expandable details */}
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary/70 hover:text-primary transition-colors duration-200"
              aria-expanded={detailsOpen}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${detailsOpen ? "rotate-180" : ""}`}
              />
              {detailsOpen ? t("steps.detailsHide") : t("steps.detailsShow")}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${detailsOpen ? "max-h-64 mt-3" : "max-h-0"}`}
            >
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 sm:pl-4">
                {t(`steps.${stepKey}.details`)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connector arrow between steps */}
      {index < STEPS_LENGTH - 1 && (
        <div className="flex justify-center my-2 sm:my-3">
          <ChevronRight className="w-5 h-5 text-primary/30 rotate-90" />
        </div>
      )}
    </div>
  );
}

export default function TutorialStepsSection() {
  const { t } = useTranslation("tutorial");
  const { ref, isInView } = useInView(0.05);

  return (
    <section
      id="tutorial-steps"
      className="py-16 sm:py-20 md:py-28 lg:py-36 bg-card/30 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div
        ref={ref}
        className="mx-auto max-w-site px-4 sm:px-6 lg:px-8 xl:px-4 relative"
      >
        <div
          className={`transition-all duration-700 mb-10 sm:mb-12 md:mb-16 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="cine-title mb-4 sm:mb-6 text-xl sm:text-2xl md:text-3xl">
            {t("steps.title")}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
            {t("steps.subtitle")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-0">
          {STEP_KEYS.map((key, idx) => (
            <StepCard
              key={key}
              stepKey={key}
              number={String(idx + 1).padStart(2, "0")}
              index={idx}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
