import * as React from "react";
import { useTranslation } from "react-i18next";
import { User, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type ProfileInfoCardProps = {
  email: string;
  name: string;
  createdDate: string;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  success: boolean;
  error: string | null;
};

export default function ProfileInfoCard({
  email,
  name,
  createdDate,
  onNameChange,
  onSubmit,
  submitting,
  success,
  error,
}: ProfileInfoCardProps) {
  const { t } = useTranslation("auth");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>{t("profile.infoCardTitle")}</CardTitle>
        </div>
        <CardDescription>{t("profile.infoCardDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t("profile.profileUpdated")}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {t("profile.emailReadonly")}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("profile.namePlaceholder")}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("profile.memberSince")}</Label>
            <Input
              type="text"
              value={createdDate}
              disabled
              className="bg-muted"
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? t("profile.saving") : t("profile.saveChanges")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
