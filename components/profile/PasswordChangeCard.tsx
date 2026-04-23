import * as React from "react";
import { useTranslation } from "react-i18next";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PasswordInput from "./PasswordInput";

type PasswordChangeCardProps = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (v: string) => void;
  onNewPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  success: boolean;
  error: string | null;
};

export default function PasswordChangeCard({
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  submitting,
  success,
  error,
}: PasswordChangeCardProps) {
  const { t } = useTranslation("auth");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <CardTitle>{t("profile.passwordCardTitle")}</CardTitle>
        </div>
        <CardDescription>{t("profile.passwordCardDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t("profile.passwordChanged")}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <PasswordInput
            id="currentPassword"
            label={t("profile.currentPassword")}
            value={currentPassword}
            onChange={onCurrentPasswordChange}
            autoComplete="current-password"
            showLabel={t("profile.showPassword")}
            hideLabel={t("profile.hidePassword")}
          />

          <PasswordInput
            id="newPassword"
            label={t("profile.newPassword")}
            value={newPassword}
            onChange={onNewPasswordChange}
            autoComplete="new-password"
            hint={t("profile.passwordHint")}
            showLabel={t("profile.showPassword")}
            hideLabel={t("profile.hidePassword")}
          />

          <PasswordInput
            id="confirmPassword"
            label={t("profile.confirmPassword")}
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            autoComplete="new-password"
            showLabel={t("profile.showPassword")}
            hideLabel={t("profile.hidePassword")}
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? t("profile.updating") : t("profile.changePassword")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
