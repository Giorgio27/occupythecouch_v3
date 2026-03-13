"use client";

import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { Globe, Trophy, TrendingUp, MapPin } from "lucide-react";
import { fetchCountriesRankings } from "@/lib/client/cineforum/rankings";
import LoadingCard from "@/components/cineforum/common/LoadingCard";
import type { CountryData } from "@/lib/shared/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Props = {
  cineforumId: string;
  cineforumName: string;
};

type ChartData = {
  name: string;
  count: number;
};

// Cinema-themed color palette (from dark red to lighter shades)
const COLORS = [
  "#a52a2d", // primary cine-red
  "#c73b3e", // cine-red-soft
  "#8a2225", // cine-red-muted
  "#d45d60", // lighter red
  "#e07578", // even lighter
  "#b84245", // medium red
  "#9e3538", // darker red
  "#cc5255", // bright red
  "#a84548", // muted red
  "#be4a4d", // warm red
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-cine-bg-elevated border border-cine-border rounded-xl px-4 py-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground">{label}</span>
        </div>
        <p className="text-muted-foreground text-sm">
          <span className="text-primary font-bold">{payload[0].value}</span>{" "}
          film
        </p>
      </div>
    );
  }
  return null;
};

export default function CountriesRankingPage({
  cineforumId,
  cineforumName,
}: Props) {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCountries();
  }, [cineforumId]);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const response = await fetchCountriesRankings(cineforumId);
      setCountries(response.body);
    } catch (error) {
      console.error("Error loading countries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for Recharts
  const chartData: ChartData[] = countries.map(([name, count]) => ({
    name,
    count,
  }));

  const totalFilms = countries.reduce((sum, [, c]) => sum + c, 0);
  const topCountry = countries[0];

  if (loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingCard text="Caricamento paesi..." />
        </div>
      </CineforumLayout>
    );
  }

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-8 sm:mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 glow-red-soft">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Ranking Nazioni
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Distribuzione geografica dei film votati dal tuo cineforum
          </p>
        </div>

        {/* Stats Summary Cards */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div
              className="cine-card p-4 animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-1">
                <Globe className="w-4 h-4" />
                <span>Paesi</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gradient">
                {countries.length}
              </p>
            </div>

            <div
              className="cine-card p-4 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Film Totali</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground">
                {totalFilms}
              </p>
            </div>

            {topCountry && (
              <div
                className="col-span-2 sm:col-span-1 cine-card p-4 animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Top Paese</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {topCountry[0]}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {chartData.length === 0 ? (
          <div className="cine-card text-center py-12 sm:py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nessun dato disponibile
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              I dati sui paesi di produzione appariranno qui quando ci saranno
              film votati
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chart Card */}
            <div
              className="cine-card p-4 sm:p-6 animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-lg font-bold text-foreground">
                  Film per Paese di Produzione
                </h2>
              </div>

              <div
                className="w-full"
                style={{ height: Math.max(400, chartData.length * 35) + "px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 30,
                      left: 10,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--cine-border)"
                      opacity={0.3}
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "var(--cine-text-muted)", fontSize: 12 }}
                      axisLine={{ stroke: "var(--cine-border)" }}
                      tickLine={{ stroke: "var(--cine-border)" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fill: "var(--cine-text)", fontSize: 12 }}
                      axisLine={{ stroke: "var(--cine-border)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "var(--cine-bg-lighter)", opacity: 0.5 }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                      animationDuration={1000}
                      animationBegin={0}
                    >
                      {chartData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="transition-opacity duration-300 hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Table */}
            <div
              className="cine-card overflow-hidden animate-fade-in-up"
              style={{ animationDelay: "500ms" }}
            >
              {/* Table Header */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-cine-red-soft to-primary opacity-90" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                <div className="relative px-4 sm:px-6 py-4 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-white/90" />
                  <h2 className="text-lg font-bold text-white">
                    Dettaglio per Paese
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cine-bg-lighter border-b border-border">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                        #
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Paese
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Film
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Percentuale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {countries.map(([name, count], index) => {
                      const percentage = ((count / totalFilms) * 100).toFixed(
                        1,
                      );
                      // calculate position with ties
                      let position = 1;
                      for (let i = 0; i < index; i++) {
                        if (countries[i][1] > count) {
                          position++;
                        }
                      }
                      const isTop3 = position <= 3;

                      return (
                        <tr
                          key={name}
                          className="hover:bg-cine-bg-lighter transition-colors duration-200 group"
                          style={{ animationDelay: `${600 + index * 50}ms` }}
                        >
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            {isTop3 ? (
                              <div
                                className={`
                                w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${position === 1 ? "bg-yellow-500/20 text-yellow-500" : ""}
                                ${position === 2 ? "bg-gray-400/20 text-gray-400" : ""}
                                ${position === 3 ? "bg-amber-600/20 text-amber-600" : ""}
                              `}
                              >
                                {position}
                              </div>
                            ) : (
                              <span className="font-medium text-sm text-muted-foreground pl-2">
                                {position}
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              />
                              <span
                                className={`font-medium text-sm sm:text-base ${isTop3 ? "text-foreground" : "text-foreground/80"}`}
                              >
                                {name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                            <span
                              className={`font-bold text-sm sm:text-base ${isTop3 ? "text-gradient" : "text-foreground"}`}
                            >
                              {count}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="hidden sm:block w-16 h-1.5 bg-cine-bg-elevated rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor:
                                      COLORS[index % COLORS.length],
                                  }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground min-w-[45px] text-right">
                                {percentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
