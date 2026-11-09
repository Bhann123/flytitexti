import { z } from "zod";
import { FIELDS, type FieldKey } from "./fields";

export const MAX_FREE_NOTES = 6000;
export const MAX_FIELD = 1000;

const fieldShape = Object.fromEntries(
  FIELDS.map((f) => [f.key, z.string().max(MAX_FIELD).optional().default("")]),
) as Record<FieldKey, z.ZodDefault<z.ZodOptional<z.ZodString>>>;

export const noteFormatSchema = z.enum(["soap", "efnisflokkar"]);
export type NoteFormat = z.infer<typeof noteFormatSchema>;

export const noteInputSchema = z.object({
  freeNotes: z.string().max(MAX_FREE_NOTES).default(""),
  fields: z.object(fieldShape).default(() => emptyFields()),
  format: noteFormatSchema.default("soap"),
});
export type NoteInput = z.infer<typeof noteInputSchema>;

export const draftRequestSchema = noteInputSchema.extend({
  engine: z.enum(["local", "claude"]),
  /** Explicit, per-request consent to send the text to Anthropic. */
  thirdPartyConsent: z.boolean().default(false),
});
export type DraftRequest = z.infer<typeof draftRequestSchema>;

export interface DraftResult {
  draft: string;
  /** Information the nurse should add or confirm; never filled in by the app. */
  missing: string[];
  /** Questions for the nurse where the notes were ambiguous. */
  questions: string[];
  warnings: string[];
  engine: "local" | "claude";
}

export function emptyFields(): Record<FieldKey, string> {
  return Object.fromEntries(FIELDS.map((f) => [f.key, ""])) as Record<FieldKey, string>;
}

export function hasAnyInput(input: Pick<NoteInput, "freeNotes" | "fields">): boolean {
  return (
    input.freeNotes.trim().length > 0 ||
    Object.values(input.fields).some((v) => v.trim().length > 0)
  );
}
