// pages/api/user/change-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  // Verifica autenticazione
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Non autenticato" });
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  // Validazione input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: "Password corrente e nuova password sono obbligatorie",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: "La nuova password deve essere di almeno 6 caratteri",
    });
  }

  try {
    // Recupera l'utente dal database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // Verifica la password corrente
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isValidPassword) {
      return res.status(400).json({ error: "Password corrente non corretta" });
    }

    // Hash della nuova password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Aggiorna la password nel database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return res.status(200).json({
      ok: true,
      message: "Password aggiornata con successo",
    });
  } catch (error) {
    console.error("Errore durante il cambio password:", error);
    return res.status(500).json({
      error: "Errore interno del server",
    });
  }
}
