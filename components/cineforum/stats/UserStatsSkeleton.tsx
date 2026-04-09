import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Gift, BarChart3, TrendingUp, AlertCircle } from "lucide-react";

export function ProfileStatsSkeleton() {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-fade-in-up">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="cine-card p-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Profilo Votante */}
      <div className="cine-card p-6 mb-8 animate-fade-in-up">
        <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Profilo Votante
        </h3>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30"
              >
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function LoveReceivedSkeleton() {
  return (
    <div className="cine-card p-6 mb-8 animate-fade-in-up">
      <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <Heart className="w-4 h-4" />
        Amore Ricevuto
      </h3>

      <div className="mb-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-3 w-24 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LoveGivenSkeleton() {
  return (
    <div className="cine-card p-6 mb-8 animate-fade-in-up">
      <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <Gift className="w-4 h-4" />
        Amore Dato
      </h3>

      <div className="mb-4 p-4 rounded-xl bg-secondary/30 border border-border">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-3 w-20 ml-auto" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-3 w-24 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RatingDistributionSkeleton() {
  return (
    <div className="cine-card p-6 mb-8 animate-fade-in-up">
      <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Distribuzione Voti
      </h3>

      <div className="h-[300px] sm:h-[350px] flex items-end justify-around gap-2 px-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <Skeleton
            key={i}
            className="w-full"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function DeviantMoviesSkeleton() {
  return (
    <div className="cine-card p-6 mb-8 animate-fade-in-up">
      <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Film con Maggiore Divergenza
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-3 w-12" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-3 w-16 ml-auto" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-3 w-20 ml-auto" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-3 w-20 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
