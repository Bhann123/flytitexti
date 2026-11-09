import { emptyFields, type NoteInput } from "./schema";

/** Entirely fictional example data for demos and tests. */
export const SAMPLE_INPUT: NoteInput = {
  format: "soap",
  freeNotes:
    "móðir kom m. barn í 6 v skoðun. segir að gangi vel m. brjóstagjöf, drekkur 8-10x á sólarhring. sefur vel, vaknar 2x á nóttu. smá ungbarnakveisa á kvöldin, ca 1 klst. móðir hefur áhyggjur af þurri húð á kinnum. fræðsla um húðumhirðu og D-vítamín.",
  fields: {
    ...emptyFields(),
    aldur: "6 vikna",
    tilefni: "6 vikna skoðun",
    maelingar: "Þyngd 4.850 g, lengd 56 cm, höfuðummál 38 cm",
    throski: "Brosir félagslegu brosi, fylgir með augum",
    skodun: "Þurrir blettir á báðum kinnum, annars húð eðlileg að sjá",
    bolusetningar: "Engar bólusetningar í dag",
    eftirfylgd: "3 mánaða skoðun",
  },
};
