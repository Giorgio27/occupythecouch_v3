"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Vote, Heart, Clapperboard } from "lucide-react";

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

export default function LandingWhySection() {
  const { t } = useTranslation("landing");
  const { ref, isInView } = useInView(0.2);

  const features = [
    {
      icon: Vote,
      title: t("why.feature1Title"),
      description: t("why.feature1Desc"),
      accent: "bg-primary/10",
    },
    {
      icon: Heart,
      title: t("why.feature2Title"),
      description: t("why.feature2Desc"),
      accent: "bg-cine-red-soft/10",
    },
    {
      icon: Clapperboard,
      title: t("why.feature3Title"),
      description: t("why.feature3Desc"),
      accent: "bg-primary/10",
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-28 lg:py-36 relative">
      <div
        ref={ref}
        className="mx-auto max-w-site px-4 sm:px-6 lg:px-8 xl:px-4"
      >
        <div
          className={`transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="cine-title mb-4 sm:mb-6 text-xl sm:text-2xl md:text-3xl">
            {t("why.title")}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-10 sm:mb-12 md:mb-16 max-w-xl">
            {t("why.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`cine-card hover-lift group relative overflow-hidden transition-all duration-700 p-4 sm:p-5 md:p-6 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${idx === 2 ? "sm:col-span-2 lg:col-span-1" : ""}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl ${feature.accent} group-hover:bg-primary/20 transition-all duration-300 mb-4 sm:mb-5 md:mb-6 flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
