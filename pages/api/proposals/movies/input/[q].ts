import type { NextApiRequest, NextApiResponse } from "next";
import { imdbSuggest } from "@/lib/api/external";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.status(400).json({ error: "q too short" });
  const data = await imdbSuggest(q);
  return res.status(200).json(data);
}
