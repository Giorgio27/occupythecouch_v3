import { useTranslation } from "react-i18next";
import { User, Users } from "lucide-react";

type ProposalOwnerBadgeProps = {
  owner: { id: string; type: "User" | "Team"; name?: string | null } | null;
  /** i18n namespace — defaults to "proposal" */
  tNamespace?: string;
  className?: string;
};

export default function ProposalOwnerBadge({
  owner,
  tNamespace = "proposal",
  className = "",
}: ProposalOwnerBadgeProps) {
  const { t } = useTranslation(tNamespace);

  if (!owner) return null;

  const isTeam = owner.type === "Team";
  const Icon = isTeam ? Users : User;
  const label = owner.name
    ? isTeam
      ? t("owner.team", { name: owner.name })
      : owner.name
    : isTeam
      ? t("owner.teamFallback")
      : t("owner.userFallback");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium
        ${
          isTeam
            ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
            : "border-primary/30 bg-primary/10 text-primary"
        } ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate max-w-[12rem]">{label}</span>
    </span>
  );
}
