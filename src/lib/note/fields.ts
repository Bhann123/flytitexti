export type SoapSection = "S" | "O" | "A" | "P";

export type FieldKey =
  | "aldur"
  | "tilefni"
  | "lidan"
  | "svefn"
  | "naering"
  | "thvagHaegdir"
  | "ahyggjur"
  | "maelingar"
  | "throski"
  | "skodun"
  | "bolusetningar"
  | "mat"
  | "fraedsla"
  | "eftirfylgd";

export interface FieldDef {
  key: FieldKey;
  label: string;
  section: SoapSection;
  placeholder: string;
  multiline: boolean;
}

export const FIELDS: FieldDef[] = [
  { key: "aldur", label: "Aldur barns", section: "S", placeholder: "t.d. 6 vikna", multiline: false },
  { key: "tilefni", label: "Tilefni", section: "S", placeholder: "t.d. 6 vikna skoðun", multiline: false },
  { key: "lidan", label: "Líðan", section: "S", placeholder: "Líðan barns að sögn foreldris", multiline: true },
  { key: "svefn", label: "Svefn", section: "S", placeholder: "t.d. vaknar 2x á nóttu", multiline: true },
  { key: "naering", label: "Næring", section: "S", placeholder: "t.d. eingöngu á brjósti, 8–10 gjafir á sólarhring", multiline: true },
  { key: "thvagHaegdir", label: "Þvag / hægðir", section: "S", placeholder: "t.d. 6+ blautar bleiur, gular hægðir daglega", multiline: true },
  { key: "ahyggjur", label: "Áhyggjur foreldris", section: "S", placeholder: "Það sem foreldri/forsjáraðili nefndi", multiline: true },
  { key: "maelingar", label: "Mælingar", section: "O", placeholder: "t.d. þyngd 4.850 g, lengd 56 cm, höfuðummál 38 cm", multiline: true },
  { key: "throski", label: "Þroski", section: "O", placeholder: "t.d. brosir félagslegu brosi, fylgir með augum", multiline: true },
  { key: "skodun", label: "Skoðun", section: "O", placeholder: "Það sem sást eða fannst við skoðun", multiline: true },
  { key: "bolusetningar", label: "Bólusetningar", section: "O", placeholder: "t.d. engar í dag / gefið skv. áætlun", multiline: true },
  { key: "mat", label: "Mat hjúkrunarfræðings", section: "A", placeholder: "Aðeins þitt eigið mat — appið býr ekki til mat", multiline: true },
  { key: "fraedsla", label: "Fræðsla / ráðgjöf", section: "P", placeholder: "Fræðsla sem fór fram", multiline: true },
  { key: "eftirfylgd", label: "Eftirfylgd / næsti tími", section: "P", placeholder: "t.d. 3 mánaða skoðun, hringja ef …", multiline: true },
];

export const SECTION_TITLES: Record<SoapSection, string> = {
  S: "S – Huglægar upplýsingar",
  O: "O – Hlutlægar upplýsingar",
  A: "A – Mat",
  P: "P – Áætlun",
};

export const NOT_PROVIDED = "Ekki gefið upp.";
