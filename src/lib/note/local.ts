import { FIELDS, NOT_PROVIDED, SECTION_TITLES, type FieldKey, type SoapSection } from "./fields";
import { renderSections, type DraftSection } from "./render";
import type { DraftResult, NoteInput } from "./schema";

const ESSENTIAL: FieldKey[] = ["aldur", "tilefni", "mat", "eftirfylgd"];

function clean(value: string): string {
  const v = value.trim().replace(/\s+\n/g, "\n");
  if (!v) return v;
  return /[.!?…:]$/.test(v) ? v : `${v}.`;
}

/**
 * Deterministic draft built only from what the nurse typed: structured fields
 * are placed under their headings verbatim, and free-text notes are kept
 * unclassified rather than guessed into a section. Nothing leaves the server.
 */
export function buildLocalDraft(input: NoteInput): DraftResult {
  const filled = FIELDS.filter((f) => input.fields[f.key]?.trim());
  const freeNotes = input.freeNotes.trim();
  const sections: DraftSection[] = [];

  if (input.format === "soap") {
    for (const s of ["S", "O", "A", "P"] as SoapSection[]) {
      const lines = filled
        .filter((f) => f.section === s)
        .map((f) => `${f.label}: ${clean(input.fields[f.key])}`);
      sections.push({ heading: SECTION_TITLES[s], text: lines.length ? lines.join("\n") : NOT_PROVIDED });
    }
  } else {
    for (const f of filled) {
      sections.push({ heading: f.label, text: clean(input.fields[f.key]) });
    }
  }

  if (freeNotes) {
    sections.push({
      heading: "Óflokkaðar nótur (færa í réttan kafla við yfirferð)",
      text: freeNotes,
    });
  }

  const missing = ESSENTIAL.filter((k) => !input.fields[k]?.trim()).map(
    (k) => FIELDS.find((f) => f.key === k)!.label,
  );

  const warnings: string[] = [];
  if (freeNotes) {
    warnings.push(
      "Staðbundið sniðmát flokkar ekki frjálsan texta. Færðu óflokkuðu nóturnar handvirkt í rétta kafla eða notaðu skipulögðu reitina.",
    );
  }

  return {
    draft: renderSections(sections),
    missing,
    questions: [],
    warnings,
    engine: "local",
  };
}
