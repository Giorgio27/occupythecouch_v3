"use client";

import TutorialHeroSection from "./TutorialHeroSection";
import TutorialStepsSection from "./TutorialStepsSection";
import TutorialFaqSection from "./TutorialFaqSection";
import TutorialCtaSection from "./TutorialCtaSection";

export function Tutorial() {
  return (
    <div className="bg-background text-foreground overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[800px] h-[800px] bg-primary/8 blur-[150px] rounded-full animate-pulse-soft" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cine-red-soft/5 blur-[120px] rounded-full animate-float-slow" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-primary/3 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <TutorialHeroSection />
      <TutorialStepsSection />
      <TutorialFaqSection />
      <TutorialCtaSection />
    </div>
  );
}
