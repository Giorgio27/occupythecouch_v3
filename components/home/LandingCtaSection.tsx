"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

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

export default function LandingCtaSection() {
  const { t } = useTranslation("landing");
  const { ref, isInView } = useInView(0.3);

  return (
    <section className="py-16 sm:py-20 md:py-28 lg:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />

      <div
        ref={ref}
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 xl:px-4 relative"
      >
        <div
          className={`cine-card text-center py-10 sm:py-12 md:py-16 lg:py-20 px-5 sm:px-8 md:px-10 lg:px-12 relative overflow-hidden transition-all duration-700 ${isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          <div
            className="absolute inset-0 rounded-xl animate-border-glow"
            style={{ padding: "1px" }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20" />
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 sm:w-52 md:w-64 h-40 sm:h-52 md:h-64 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-5 md:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t("cta.badge")}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 md:mb-5 text-foreground tracking-tight text-balance">
              {t("cta.title")}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 md:mb-10 max-w-xs sm:max-w-sm md:max-w-md mx-auto leading-relaxed">
              {t("cta.subtitle")}
              <br />
              <span className="text-foreground/80">
                {t("cta.subtitleBold")}
              </span>
            </p>
            <Link href="/auth/signup" className="inline-block group">
              <Button
                size="lg"
                className="cine-btn text-base sm:text-lg h-12 sm:h-14 px-8 sm:px-10 md:px-12 animate-glow-pulse"
              >
                <span>{t("cta.button")}</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
