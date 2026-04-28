"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Film, Sparkles } from "lucide-react";

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

function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute top-20 left-[10%] w-16 h-16 rounded-full border-2 border-primary/20 animate-float opacity-20"
        style={{ animationDelay: "0s" }}
      >
        <div className="absolute inset-2 rounded-full border border-primary/30" />
      </div>
      <div
        className="absolute top-40 right-[15%] w-12 h-12 rounded-full border-2 border-primary/15 animate-float-slow opacity-15"
        style={{ animationDelay: "1s" }}
      >
        <div className="absolute inset-2 rounded-full border border-primary/20" />
      </div>
      <div
        className="absolute bottom-32 left-[20%] w-10 h-10 rounded-full border-2 border-primary/10 animate-float opacity-10"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute top-32 right-[25%] w-2 h-2 bg-primary/30 rounded-full animate-pulse-soft" />
      <div
        className="absolute top-60 left-[30%] w-1.5 h-1.5 bg-primary/20 rounded-full animate-pulse-soft"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute bottom-40 right-[30%] w-2 h-2 bg-primary/25 rounded-full animate-pulse-soft"
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
}

export default function TutorialHeroSection() {
  const { t } = useTranslation("tutorial");

  const stats = [
    { value: "8", label: t("hero.statSteps") },
    { value: "1", label: t("hero.statVoting") },
    { value: "∞", label: t("hero.statNights") },
  ];

  return (
    <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-20 md:pt-16 lg:pt-20 md:pb-28 lg:pb-36">
      <FloatingElements />
      <div className="mx-auto max-w-site px-4 sm:px-6 lg:px-8 xl:px-4 relative">
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-10 animate-fade-in-down">
          <div className="cine-badge animate-shine group cursor-default text-xs sm:text-sm">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 group-hover:animate-spin-slow" />
            <span>{t("hero.badge")}</span>
          </div>
        </div>

        <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.9] text-balance">
            <span className="inline-block animate-fade-in-up">
              {t("hero.headline1")}
            </span>
            <br />
            <span className="text-gradient inline-block animate-scale-in-bounce delay-300 relative sm:pb-3 md:pb-4 lg:pb-5">
              {t("hero.headline2")}
            </span>
          </h1>

          <p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-400 opacity-0 px-2 sm:px-0"
            style={{ animationFillMode: "forwards" }}
          >
            {t("hero.subtitle")}{" "}
            <span className="text-foreground/80 font-medium">
              {t("hero.subtitleBold")}
            </span>{" "}
            {t("hero.subtitleEnd")}
          </p>
        </div>

        <div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 sm:mt-10 md:mt-12 lg:mt-14 animate-fade-in-up delay-600 opacity-0 px-2 sm:px-0"
          style={{ animationFillMode: "forwards" }}
        >
          <Button
            size="lg"
            className="cine-btn text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto group"
            onClick={() =>
              document
                .getElementById("tutorial-steps")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span>{t("hero.ctaRead")}</span>
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <Link href="/auth/signup" className="group w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="cine-btn-ghost text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 bg-transparent w-full sm:w-auto"
            >
              <Film className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span>{t("hero.ctaStart")}</span>
            </Button>
          </Link>
        </div>

        <div
          className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 mt-12 sm:mt-16 md:mt-20 lg:mt-24 pt-8 sm:pt-10 md:pt-12 border-t border-border/50 animate-fade-in-up delay-800 opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center group cursor-default">
              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gradient">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
