export interface IdentifierHit {
  kind: "kennitala" | "netfang" | "simanumer";
  label: string;
  match: string;
}

const PATTERNS: { kind: IdentifierHit["kind"]; label: string; re: RegExp }[] = [
  // Icelandic national ID: DDMMYY-NNNN or DDMMYYNNNN
  { kind: "kennitala", label: "Möguleg kennitala", re: /\b(?:[0-3]\d)(?:[01]\d)\d{2}-?\d{4}\b/g },
  { kind: "netfang", label: "Netfang", re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  // Icelandic phone numbers: 7 digits, optionally +354 and a space/dash after 3 digits
  { kind: "simanumer", label: "Mögulegt símanúmer", re: /(?:\+354[\s-]?)?\b[4-8]\d{2}[\s-]?\d{4}\b/g },
];

/**
 * Heuristic screen for direct identifiers. It will miss names and other
 * free-text identifiers, so it supplements (never replaces) the nurse's own judgement.
 */
export function findIdentifiers(text: string): IdentifierHit[] {
  const hits: IdentifierHit[] = [];
  const seen = new Set<string>();
  for (const { kind, label, re } of PATTERNS) {
    for (const m of text.matchAll(re)) {
      const key = `${kind}:${m[0]}`;
      if (seen.has(key)) continue;
      if (kind === "simanumer" && hits.some((h) => h.kind === "kennitala" && h.match.includes(m[0]))) continue;
      seen.add(key);
      hits.push({ kind, label, match: m[0] });
    }
  }
  return hits;
}

export function collectText(freeNotes: string, fields: Record<string, string>): string {
  return [freeNotes, ...Object.values(fields)].join("\n");
}
