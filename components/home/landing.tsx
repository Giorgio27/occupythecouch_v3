"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  Vote,
  Popcorn,
  Play,
  Film,
  Star,
  Clapperboard,
  Sparkles,
  Trophy,
  Heart,
} from "lucide-react";

// Hook per animazioni on scroll
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

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated counter component
function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: string;
  suffix?: string;
}) {
  const [displayed, setDisplayed] = useState(value === "∞" ? "∞" : "0");
  const { ref, isInView } = useInView();

  useEffect(() => {
    if (!isInView || value === "∞") return;

    const numValue = parseInt(value.replace("%", ""));
    const duration = 1500;
    const steps = 30;
    const increment = numValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current) + (value.includes("%") ? "%" : ""));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {displayed}
      {suffix}
    </span>
  );
}

// Floating film elements component
function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating film reels */}
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

      {/* Sparkle effects */}
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

export function Landing() {
  const howItWorksSection = useInView(0.2);
  const whySection = useInView(0.2);
  const ctaSection = useInView(0.3);

  return (
    <div className="bg-background text-foreground overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Main glow - positioned higher */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[800px] h-[800px] bg-primary/8 blur-[150px] rounded-full animate-pulse-soft" />
        {/* Secondary accent glow */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cine-red-soft/5 blur-[120px] rounded-full animate-float-slow" />
        {/* Left subtle glow */}
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-primary/3 blur-[100px] rounded-full" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-20 md:pt-16 lg:pt-20 md:pb-28 lg:pb-36">
        <FloatingElements />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 xl:px-4 relative">
          {/* Badge */}
          <div className="flex justify-center mb-6 sm:mb-8 md:mb-10 animate-fade-in-down">
            <div className="cine-badge animate-shine group cursor-default text-xs sm:text-sm">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 group-hover:animate-spin-slow" />
              <span>La democrazia del cinema</span>
            </div>
          </div>

          {/* Main headline */}
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.9] text-balance">
              <span className="inline-block animate-fade-in-up">
                Scegli film con gli
              </span>
              <br />
              <span className="text-gradient inline-block animate-scale-in-bounce delay-300 relative">
                amici
                <span className="absolute -right-5 sm:-right-6 md:-right-8 -top-2 sm:-top-3 md:-top-4 animate-bounce-gentle delay-500">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary fill-primary/30" />
                </span>
              </span>
            </h1>

            <p
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-400 opacity-0 px-2 sm:px-0"
              style={{ animationFillMode: "forwards" }}
            >
              Crea un round, invita gli amici a proporre film, votate insieme.
              <br className="hidden sm:block" />
              <span className="text-foreground/80 font-medium">
                Il migliore vince.
              </span>{" "}
              Niente discussioni, solo cinema.
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 sm:mt-10 md:mt-12 lg:mt-14 animate-fade-in-up delay-600 opacity-0 px-2 sm:px-0"
            style={{ animationFillMode: "forwards" }}
          >
            <Link href="/auth/signup" className="group w-full sm:w-auto">
              <Button
                size="lg"
                className="cine-btn text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto"
              >
                <span>Crea il tuo cineforum</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="cine-btn-ghost text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 group bg-transparent w-full sm:w-auto"
              onClick={() => {
                document
                  .getElementById("come-funziona")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:scale-110" />
              <span>Come funziona</span>
            </Button>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 mt-12 sm:mt-16 md:mt-20 lg:mt-24 pt-8 sm:pt-10 md:pt-12 border-t border-border/50 animate-fade-in-up delay-800 opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            {[
              { value: "100%", label: "Democratico", icon: Vote },
              { value: "0", label: "Discussioni", icon: Heart },
              { value: "∞", label: "Serate film", icon: Film },
            ].map((stat, idx) => (
              <div key={idx} className="text-center group cursor-default">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gradient">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="come-funziona"
        className="py-16 sm:py-20 md:py-28 lg:py-36 bg-card/30 relative"
      >
        {/* Section background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

        <div
          ref={howItWorksSection.ref}
          className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 xl:px-4 relative"
        >
          <div
            className={`transition-all duration-700 ${howItWorksSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="cine-title mb-4 sm:mb-6 text-xl sm:text-2xl md:text-3xl">
              Come funziona
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-10 sm:mb-12 md:mb-16 max-w-xl">
              Quattro semplici passaggi per organizzare la serata film perfetta
              con i tuoi amici.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-4 lg:gap-5 xl:gap-6">
            {[
              {
                number: "1",
                title: "Crea cineforum",
                description: "Dai un nome al gruppo e invita i tuoi amici",
                icon: Users,
              },
              {
                number: "2",
                title: "Round di proposte",
                description: "Ognuno propone i film che vuole vedere",
                icon: Popcorn,
              },
              {
                number: "3",
                title: "Votazione",
                description: "Tutti votano il preferito. Vince il migliore",
                icon: Vote,
              },
              {
                number: "4",
                title: "Guarda insieme",
                description: "Il film vincente diventa la scelta del gruppo",
                icon: Trophy,
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              const delay = idx * 100;
              return (
                <div
                  key={idx}
                  className={`relative group transition-all duration-700 ${howItWorksSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  {/* Connector line - only on lg+ */}
                  {idx < 3 && (
                    <div className="hidden lg:block absolute top-10 -right-2.5 xl:-right-3 w-5 xl:w-6 h-px">
                      <div className="h-full bg-gradient-to-r from-primary/40 to-transparent" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary/40" />
                    </div>
                  )}

                  <div className="cine-card hover-lift h-full space-y-4 sm:space-y-5 relative overflow-hidden p-4 sm:p-5 md:p-6">
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Step number badge */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-bold text-primary">
                        {step.number}
                      </span>
                    </div>

                    {/* Icon container */}
                    <div className="relative inline-flex">
                      <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150" />
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-secondary border-2 border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>

                    {/* Content */}
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

      {/* Features / Why CineForum */}
      <section className="py-16 sm:py-20 md:py-28 lg:py-36 relative">
        <div
          ref={whySection.ref}
          className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 xl:px-4"
        >
          <div
            className={`transition-all duration-700 ${whySection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="cine-title mb-4 sm:mb-6 text-xl sm:text-2xl md:text-3xl">
              Perche CineForum
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-10 sm:mb-12 md:mb-16 max-w-xl">
              Perche le serate film dovrebbero essere divertenti, non una
              battaglia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {[
              {
                icon: Vote,
                title: "Democrazia vera",
                description:
                  "Niente dittatura del leader. Il film lo sceglie il gruppo, tutti votano in modo uguale.",
                accent: "bg-primary/10",
              },
              {
                icon: Heart,
                title: "Zero discussioni",
                description:
                  "Niente litigate su quale film guardare. Il sistema di voto e trasparente e giusto.",
                accent: "bg-cine-red-soft/10",
              },
              {
                icon: Clapperboard,
                title: "Puro e semplice",
                description:
                  "Un'app fatta solo per scegliere film con gli amici. Niente distrazioni.",
                accent: "bg-primary/10",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              const delay = idx * 100;
              return (
                <div
                  key={idx}
                  className={`cine-card hover-lift group relative overflow-hidden transition-all duration-700 p-4 sm:p-5 md:p-6 ${whySection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${idx === 2 ? "sm:col-span-2 lg:col-span-1" : ""}`}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  {/* Background accent on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Glow effect */}
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

      {/* Final CTA */}
      <section className="py-16 sm:py-20 md:py-28 lg:py-36 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-radial-glow opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />

        <div
          ref={ctaSection.ref}
          className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 xl:px-4 relative"
        >
          <div
            className={`cine-card text-center py-10 sm:py-12 md:py-16 lg:py-20 px-5 sm:px-8 md:px-10 lg:px-12 relative overflow-hidden transition-all duration-700 ${ctaSection.isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            {/* Animated border glow */}
            <div
              className="absolute inset-0 rounded-xl animate-border-glow"
              style={{ padding: "1px" }}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20" />
            </div>

            {/* Background accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 sm:w-52 md:w-64 h-40 sm:h-52 md:h-64 bg-primary/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-5 md:mb-6">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Inizia ora</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 md:mb-5 text-foreground tracking-tight text-balance">
                Inizia gratis adesso
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 md:mb-10 max-w-xs sm:max-w-sm md:max-w-md mx-auto leading-relaxed">
                Niente carte, niente promesse.
                <br />
                <span className="text-foreground/80">
                  Solo film con gli amici.
                </span>
              </p>
              <Link href="/auth/signup" className="inline-block group">
                <Button
                  size="lg"
                  className="cine-btn text-base sm:text-lg h-12 sm:h-14 px-8 sm:px-10 md:px-12 animate-glow-pulse"
                >
                  <span>Crea il tuo cineforum</span>
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
