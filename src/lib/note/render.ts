export interface DraftSection {
  heading: string;
  text: string;
}

export function renderSections(sections: DraftSection[]): string {
  return sections
    .map((s) => `${s.heading.trim()}\n${s.text.trim()}`)
    .join("\n\n")
    .trim();
}
