const NUMBER_RE = /\d+(?:[.,]\d+)*/g;

function normalize(n: string): string {
  return n.replace(/[.,]/g, "").replace(/^0+(?=\d)/, "");
}

/**
 * Returns numbers that appear in the draft but nowhere in the input.
 * A new number usually means an invented measurement, dose or date, so the
 * nurse is warned before copying.
 */
export function findUnsupportedNumbers(draft: string, inputText: string): string[] {
  const known = new Set((inputText.match(NUMBER_RE) ?? []).map(normalize));
  const unsupported = new Set<string>();
  for (const n of draft.match(NUMBER_RE) ?? []) {
    if (!known.has(normalize(n))) unsupported.add(n);
  }
  return [...unsupported];
}
