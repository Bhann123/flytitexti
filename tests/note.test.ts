import { describe, expect, it } from "vitest";
import { NOT_PROVIDED, SECTION_TITLES } from "@/lib/note/fields";
import { buildLocalDraft } from "@/lib/note/local";
import { findIdentifiers } from "@/lib/note/privacy";
import { SAMPLE_INPUT } from "@/lib/note/samples";
import { emptyFields, noteInputSchema } from "@/lib/note/schema";
import { findUnsupportedNumbers } from "@/lib/note/verify";

describe("buildLocalDraft", () => {
  it("places structured fields under SOAP headings verbatim", () => {
    const { draft } = buildLocalDraft(SAMPLE_INPUT);
    expect(draft).toContain(SECTION_TITLES.S);
    expect(draft).toContain("Aldur barns: 6 vikna.");
    expect(draft).toContain("Mælingar: Þyngd 4.850 g, lengd 56 cm, höfuðummál 38 cm.");
    expect(draft.indexOf(SECTION_TITLES.O)).toBeLessThan(draft.indexOf("Mælingar:"));
  });

  it("marks missing assessment as not provided and never invents one", () => {
    const result = buildLocalDraft(SAMPLE_INPUT);
    const assessment = result.draft.split(SECTION_TITLES.A)[1].split(SECTION_TITLES.P)[0];
    expect(assessment.trim()).toBe(NOT_PROVIDED);
    expect(result.missing).toContain("Mat hjúkrunarfræðings");
  });

  it("keeps free notes unclassified and warns about it", () => {
    const result = buildLocalDraft(SAMPLE_INPUT);
    expect(result.draft).toContain("Óflokkaðar nótur");
    expect(result.draft).toContain(SAMPLE_INPUT.freeNotes);
    expect(result.warnings.length).toBe(1);
  });

  it("marks every SOAP section as not provided when only free notes are given", () => {
    const input = noteInputSchema.parse({ freeNotes: "sefur vel", fields: emptyFields() });
    const { draft } = buildLocalDraft(input);
    expect(draft.match(new RegExp(NOT_PROVIDED.replace(".", "\\."), "g"))?.length).toBe(4);
  });

  it("topic format only includes filled topics", () => {
    const input = noteInputSchema.parse({
      format: "efnisflokkar",
      fields: { ...emptyFields(), svefn: "Vaknar 2x á nóttu" },
    });
    const { draft } = buildLocalDraft(input);
    expect(draft).toBe("Svefn\nVaknar 2x á nóttu.");
  });

  it("produces no numbers that are absent from the input", () => {
    const { draft } = buildLocalDraft(SAMPLE_INPUT);
    const inputText = [SAMPLE_INPUT.freeNotes, ...Object.values(SAMPLE_INPUT.fields)].join("\n");
    expect(findUnsupportedNumbers(draft, inputText)).toEqual([]);
  });
});

describe("findUnsupportedNumbers", () => {
  it("flags invented measurements", () => {
    expect(findUnsupportedNumbers("Þyngd 4.900 g, lengd 56 cm", "þyngd 4850 g, lengd 56 cm")).toEqual(["4.900"]);
  });

  it("treats thousand separators as equivalent", () => {
    expect(findUnsupportedNumbers("Þyngd 4.850 g", "þyngd 4850g")).toEqual([]);
  });
});

describe("findIdentifiers", () => {
  it("detects kennitala, email and phone numbers", () => {
    const kinds = findIdentifiers("kt 010125-1239, s. 555 1234, foreldri@example.is").map((h) => h.kind);
    expect(kinds).toEqual(["kennitala", "netfang", "simanumer"]);
  });

  it("does not flag ordinary measurements", () => {
    expect(findIdentifiers(SAMPLE_INPUT.freeNotes + Object.values(SAMPLE_INPUT.fields).join(" "))).toEqual([]);
  });
});
