# Nótuaðstoð ungbarnaverndar (frumgerð)

Vefapp fyrir hjúkrunarfræðinga í ungbarnavernd á heilsugæslu. Það breytir stuttum, óskipulögðum nótum eftir
viðtal eða skoðun í skipulögð **drög** að sjúkraskrárfærslu á íslensku (SOAP eða efnisflokkar).

> **Frumgerð — ekki metin eða samþykkt til klínískrar notkunar.** Notaðu eingöngu tilbúin gögn. Áður en
> appið er notað í raunverulegri heilbrigðisþjónustu þarf m.a. mat á áhrifum á persónuvernd (DPIA),
> vinnslusamning við Anthropic ef Claude er notað, mat á flutningi gagna út fyrir EES, öryggisúttekt og
> samþykki ábyrgðaraðila. Hjúkrunarfræðingur ber ábyrgð á að yfirfara og samþykkja hverja færslu.

## Notkun

1. Skráðu frjálsar nótur og/eða fylltu út skipulögð atriði (aldur, tilefni, svefn, næring, mælingar, mat o.fl.).
   Smelltu á **Tilbúið dæmi** til að hlaða tilbúnum sýnigögnum.
2. Veldu snið (SOAP er sjálfgefið) og aðferð:
   - **Staðbundið sniðmát** — ekkert fer út fyrir þjóninn. Skipulögðu reitirnir eru settir orðrétt undir rétta
     fyrirsögn; frjáls texti er hafður óflokkaður svo þú flokkir hann sjálf(ur).
   - **Claude (Anthropic)** — flokkar og orðar frjálsan texta. Krefst API-lykils á þjóni og skýrs samþykkis í
     viðmótinu áður en texti er sendur.
3. Smelltu á **Búa til drög**, yfirfarðu og breyttu, hakaðu við staðfestingu og smelltu á **Afrita drög**.
4. **Hreinsa allt** fjarlægir allan innslátt og drög.

## Öryggis- og persónuverndarráðstafanir í frumgerðinni

- Engin vistun: gögn eru aðeins í minni vafraflipans; ekkert í localStorage, vafrakökum eða gagnagrunni.
  Bakendinn skráir ekki texta nótna og svarar með `Cache-Control: no-store`.
- Engin bein auðkenni: viðmótið biður ekki um nafn eða kennitölu. Kennitölur, netföng og símanúmer eru skimuð;
  viðvörun birtist og bakendinn **neitar** að senda slíkan texta til Claude. (Skimunin finnur ekki nöfn.)
- Claude aðeins með samþykki: bakendinn hafnar Claude-beiðni nema `thirdPartyConsent` sé sett.
- API-lykill aðeins á bakenda (`ANTHROPIC_API_KEY`, lesið í `src/lib/note/claude.ts` sem er `server-only`).
- Engar uppfundnar upplýsingar: kerfisfyrirmæli banna Claude að búa til mælingar, mat, ráðleggingar o.fl. og
  krefjast „Ekki gefið upp.“ þar sem upplýsingar vantar. Svarið er á föstu JSON-sniði. Bakendinn ber auk þess
  allar tölur í drögunum saman við inntakið og varar við tölum sem komu ekki fram.
- Mat-kaflinn inniheldur aðeins mat sem hjúkrunarfræðingur skráði sjálf(ur).
- Afritun er óvirk þar til notandi staðfestir að hafa yfirfarið drögin. Stafsetningarleiðrétting vafra er
  slökkt í reitunum (sumir vafrar senda texta til skýjaþjónustu).

## Uppbygging

| Hluti | Skrár |
| --- | --- |
| Viðmót (Next.js, React, Tailwind, shadcn/ui) | `src/app/page.tsx`, `src/components/` |
| Bakendi (Route Handlers) | `src/app/api/draft/route.ts`, `src/app/api/status/route.ts` |
| Staðbundið sniðmát | `src/lib/note/local.ts` |
| Claude-tenging og fyrirmæli | `src/lib/note/claude.ts`, `src/lib/note/prompt.ts` |
| Skimun auðkenna og sannprófun talna | `src/lib/note/privacy.ts`, `src/lib/note/verify.ts` |
| Tilbúin sýnigögn | `src/lib/note/samples.ts` |
| Prófanir | `tests/` |

## Keyrsla

Krefst Node.js 20+.

```bash
npm install
cp .env.example .env.local   # valfrjálst: settu ANTHROPIC_API_KEY til að virkja Claude
npm run dev                  # http://localhost:4317
```

Án API-lykils virkar staðbundna sniðmátið og Claude-valkosturinn er óvirkur.

## Prófanir

```bash
npm test            # einingaprófanir og API-prófanir (Claude er hermt, engin netköll)
npm run typecheck
npm run lint
```
