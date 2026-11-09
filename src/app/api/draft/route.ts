import { buildClaudeDraft, DraftError } from "@/lib/note/claude";
import { buildLocalDraft } from "@/lib/note/local";
import { collectText, findIdentifiers } from "@/lib/note/privacy";
import { draftRequestSchema, hasAnyInput, type DraftResult } from "@/lib/note/schema";
import { findUnsupportedNumbers } from "@/lib/note/verify";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(error: string, status: number) {
  return Response.json({ error }, { status, headers: NO_STORE });
}

// Note content is never logged or persisted here: it lives only in this request.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Ógild beiðni.", 400);
  }

  const parsed = draftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Innsláttur er ógildur eða of langur. Styttu nóturnar og reyndu aftur.", 400);
  }
  const req = parsed.data;

  if (!hasAnyInput(req)) {
    return fail("Engar nótur hafa verið skráðar.", 400);
  }

  const inputText = collectText(req.freeNotes, req.fields);
  const identifiers = findIdentifiers(inputText);

  if (req.engine === "claude") {
    if (!req.thirdPartyConsent) {
      return fail("Staðfesta þarf að senda megi textann til Anthropic (Claude) áður en hann er sendur.", 400);
    }
    if (identifiers.length > 0) {
      return fail(
        `Fjarlægðu bein auðkenni (${identifiers.map((i) => i.label.toLowerCase()).join(", ")}) áður en texti er sendur til Claude.`,
        422,
      );
    }
  }

  let result: DraftResult;
  try {
    result = req.engine === "claude" ? await buildClaudeDraft(req) : buildLocalDraft(req);
  } catch (err) {
    if (err instanceof DraftError) return fail(err.message, err.status);
    return fail("Óvænt villa við nótugerð.", 500);
  }

  const unsupported = findUnsupportedNumbers(result.draft, inputText);
  if (unsupported.length > 0) {
    result.warnings.push(
      `Drögin innihalda tölur sem koma ekki fram í nótunum: ${unsupported.join(", ")}. Athugaðu sérstaklega og fjarlægðu ef þær eru ekki réttar.`,
    );
  }
  if (identifiers.length > 0) {
    result.warnings.push("Nóturnar virðast innihalda bein auðkenni (t.d. kennitölu eða símanúmer). Fjarlægðu þau.");
  }

  return Response.json(result, { headers: NO_STORE });
}
