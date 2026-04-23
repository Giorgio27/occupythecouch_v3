import { useState, useMemo } from "react";
import { Users, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { MovieWinnerDTO } from "@/lib/shared/types/cineforum";

type SortField = "name" | "rating";
type SortDir = "asc" | "desc";

interface UserVotesProps {
  votes: MovieWinnerDTO["roundVotes"];
}

export default function UserVotes({ votes }: UserVotesProps) {
  const [sortField, setSortField] = useState<SortField>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...votes].sort((a, b) => {
      if (sortField === "name") {
        const na = (a.userName ?? a.user).toLowerCase();
        const nb = (b.userName ?? b.user).toLowerCase();
        return sortDir === "asc" ? na.localeCompare(nb) : nb.localeCompare(na);
      }
      return sortDir === "asc" ? a.rating - b.rating : b.rating - a.rating;
    });
  }, [votes, sortField, sortDir]);

  if (votes.length === 0) return null;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "rating" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-2.5 h-2.5" />
    ) : (
      <ArrowDown className="w-2.5 h-2.5" />
    );
  };

  return (
    <div className="oscars-comparison">
      <h4 className="oscars-comparison__title">
        <Users className="w-3.5 h-3.5" />
        Voti Utenti
      </h4>
      <div className="oscars-comparison__table">
        <div className="oscars-comparison__header">
          <button
            onClick={() => toggleSort("name")}
            className="flex-1 flex items-center gap-1 hover:text-foreground transition-colors text-left"
          >
            Utente <SortIcon field="name" />
          </button>
          <button
            onClick={() => toggleSort("rating")}
            className="w-14 flex items-center justify-end gap-1 hover:text-foreground transition-colors"
          >
            <SortIcon field="rating" /> Voto
          </button>
        </div>
        {sorted.map((v) => (
          <div key={v.user} className="oscars-comparison__row">
            <span className="flex-1 text-xs text-foreground">
              {v.userName ?? v.user}
            </span>
            <span className="w-14 text-right text-xs font-bold text-gradient">
              {v.rating.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
