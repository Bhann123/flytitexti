import { connection } from "next/server";
import { claudeConfig } from "@/lib/note/claude";

export async function GET() {
  await connection();
  const { apiKey, model } = claudeConfig();
  return Response.json(
    { claudeAvailable: Boolean(apiKey), model: apiKey ? model : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
