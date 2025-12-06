"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Vote, Popcorn } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cine-bg via-cine-bg-soft to-cine-bg text-white overflow-hidden">
      {/* Hero Section */}
      <main className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-cine-red/5 blur-3xl rounded-full animate-glow" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-cine-red/3 blur-3xl rounded-full opacity-50" />
        </div>

        <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8 space-y-16">
          {/* Main headline with staggered animations */}
          <div className="space-y-6 text-center">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-tight animate-fade-in-up text-balance">
              Scegli film con gli{" "}
              <span className="text-cine-red animate-slide-in-left">amici</span>
            </h1>
            <p
              className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Crea un round, invita gli amici a proporre film, votate insieme,
              il migliore vince. Niente discussioni, solo cinema.
            </p>
          </div>

          {/* CTA Button with enhanced hover - Added Link to /signup */}
          <div
            className="flex justify-center animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-cine-red hover:bg-cine-red-soft text-white text-lg h-14 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-cine-red/50 hover:scale-105"
              >
                Crea il tuo cineforum
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* How it works - 4 steps */}
          <div className="mt-12 pt-12">
            <h2 className="text-3xl font-bold text-left mb-16 animate-fade-in-up border-l-4 border-cine-red pl-4">
              Come funziona
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  number: "1",
                  title: "Crea cineforum",
                  description: "Dai un nome, scegli gli amici da invitare",
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
                  description:
                    "Tutti votano il loro preferito. Vince il migliore",
                  icon: Vote,
                },
                {
                  number: "4",
                  title: "Guarda insieme",
                  description: "Il film vincente diventa la scelta del gruppo",
                  icon: () => (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                },
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="relative group animate-scale-in"
                    style={{ animationDelay: `${0.1 * idx}s` }}
                  >
                    {/* Connector line */}
                    {idx < 3 && (
                      <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-cine-red/50 to-transparent" />
                    )}

                    <div className="space-y-4">
                      <div className="relative inline-flex">
                        <div className="absolute inset-0 bg-cine-red/20 blur-lg rounded-full group-hover:bg-cine-red/40 transition-all duration-300 group-hover:scale-110" />
                        <div className="relative w-16 h-16 rounded-full bg-cine-bg border-2 border-cine-red flex items-center justify-center group-hover:border-cine-red-soft transition-colors duration-300">
                          <Icon className="w-8 h-8 text-cine-red group-hover:text-cine-red-soft transition-colors duration-300" />
                        </div>
                      </div>

                      <div>
                        <p className="text-cine-red font-bold text-lg">
                          Step {step.number}
                        </p>
                        <h3 className="text-lg font-bold mt-2">{step.title}</h3>
                        <p className="text-white/60 text-sm mt-2">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Why CineForum section */}
          <div className="mt-12 pt-12 space-y-12">
            <h2 className="text-3xl font-bold text-left border-l-4 border-cine-red pl-4 animate-fade-in-up">
              Perché CineForum
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Democrazia vera",
                  description:
                    "Niente dittatura del leader. Il film lo sceglie il gruppo, tutti votano in modo uguale.",
                },
                {
                  title: "Zero discussioni",
                  description:
                    "Niente litigate su quale film guardare. Il sistema di voto è trasparente e giusto.",
                },
                {
                  title: "Puro e semplice",
                  description:
                    "Un'app fatta solo per scegliere film con gli amici. Niente distrazioni, niente altre cose.",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-white/10 bg-cine-bg-lighter/50 hover:bg-cine-bg-lighter hover:border-cine-red/50 transition-all duration-300 group animate-fade-in-up"
                  style={{ animationDelay: `${0.15 * idx}s` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-cine-red/20 group-hover:bg-cine-red/30 transition-all duration-300 mb-4 flex items-center justify-center">
                    <div className="w-6 h-6 rounded bg-cine-red" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA - Added Link to /signup */}
          <div className="mt-12 pt-12 text-center space-y-8 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-left border-l-4 border-cine-red pl-4">
              Inizia gratis adesso
            </h2>
            <p className="text-white/60 text-lg">
              Niente carte, niente promesse. Solo film con gli amici.
            </p>
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-cine-red hover:bg-cine-red-soft text-white text-lg h-14 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-cine-red/50 hover:scale-105"
              >
                Crea il tuo cineforum
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
