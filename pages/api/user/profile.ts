// pages/api/user/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verifica autenticazione
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Non autenticato" });
  }

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("Errore durante il recupero del profilo:", error);
      return res.status(500).json({ error: "Errore interno del server" });
    }
  }

  if (req.method === "PUT") {
    const { name, image } = req.body as {
      name?: string;
      image?: string;
    };

    try {
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(name !== undefined && { name }),
          ...(image !== undefined && { image }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        ok: true,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Errore durante l'aggiornamento del profilo:", error);
      return res.status(500).json({ error: "Errore interno del server" });
    }
  }

  return res.status(405).json({ error: "Metodo non consentito" });
}
