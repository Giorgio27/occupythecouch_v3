"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Popcorn, Vote, Trophy } from "lucide-react";

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

export default function LandingHowItWorksSection() {
  const { t } = useTranslation("landing");
  const { ref, isInView } = useInView(0.2);

  const steps = [
    {
      number: "1",
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Desc"),
      icon: Users,
    },
    {
      number: "2",
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Desc"),
      icon: Popcorn,
    },
    {
      number: "3",
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Desc"),
      icon: Vote,
    },
    {
      number: "4",
      title: t("howItWorks.step4Title"),
      description: t("howItWorks.step4Desc"),
      icon: Trophy,
    },
  ];

  return (
    <section
      id="come-funziona"
      className="py-16 sm:py-20 md:py-28 lg:py-36 bg-card/30 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div
        ref={ref}
        className="mx-auto max-w-site px-4 sm:px-6 lg:px-8 xl:px-4 relative"
      >
        <div
          className={`transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="cine-title mb-4 sm:mb-6 text-xl sm:text-2xl md:text-3xl">
            {t("howItWorks.title")}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-10 sm:mb-12 md:mb-16 max-w-xl">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-4 lg:gap-5 xl:gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`relative group transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-10 -right-2.5 xl:-right-3 w-5 xl:w-6 h-px">
                    <div className="h-full bg-gradient-to-r from-primary/40 to-transparent" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary/40" />
                  </div>
                )}
                <div className="cine-card hover-lift h-full space-y-4 sm:space-y-5 relative overflow-hidden p-4 sm:p-5 md:p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-primary">
                      {step.number}
                    </span>
                  </div>
                  <div className="relative inline-flex">
                    <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150" />
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-secondary border-2 border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>
                  <div className="relative">
                    <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
