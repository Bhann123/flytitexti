import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildUserMessage, OUTPUT_SCHEMA, SYSTEM_PROMPT } from "./prompt";
import { renderSections } from "./render";
import type { DraftResult, NoteInput } from "./schema";

const DEFAULT_MODEL = "claude-sonnet-5-5";

const claudeOutputSchema = z.object({
  sections: z.array(z.object({ heading: z.string(), text: z.string() })).min(1),
  missing: z.array(z.string()),
  questions: z.array(z.string()),
});

export class DraftError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function claudeConfig() {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY?.trim() || null,
    model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
  };
}

export async function buildClaudeDraft(input: NoteInput): Promise<DraftResult> {
  const { apiKey, model } = claudeConfig();
  if (!apiKey) {
    throw new DraftError("Claude er ekki stillt á þjóninum (ANTHROPIC_API_KEY vantar). Notaðu staðbundið sniðmát.", 503);
  }

  const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });

  let text: string;
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(input) }],
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    });
    if (response.stop_reason === "max_tokens") {
      throw new DraftError("Svarið frá Claude var of langt og var skorið af. Styttu nóturnar og reyndu aftur.", 502);
    }
    text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    if (err instanceof DraftError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      throw new DraftError("API-lykill fyrir Claude var hafnað. Hafðu samband við umsjónaraðila.", 502);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new DraftError("Of margar beiðnir til Claude í bili. Bíddu andartak og reyndu aftur.", 429);
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError || err instanceof Anthropic.APIConnectionError) {
      throw new DraftError("Ekki náðist samband við Claude. Athugaðu nettengingu og reyndu aftur.", 504);
    }
    if (err instanceof Anthropic.APIError) {
      throw new DraftError(`Claude skilaði villu (${err.status ?? "óþekkt"}). Reyndu aftur síðar.`, 502);
    }
    throw new DraftError("Óvænt villa við nótugerð.", 500);
  }

  let parsed: z.infer<typeof claudeOutputSchema>;
  try {
    parsed = claudeOutputSchema.parse(JSON.parse(text));
  } catch {
    throw new DraftError("Svarið frá Claude var á röngu sniði. Reyndu aftur.", 502);
  }

  return {
    draft: renderSections(parsed.sections),
    missing: parsed.missing,
    questions: parsed.questions,
    warnings: [],
    engine: "claude",
  };
}
