"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InfoIcon } from "lucide-react";

export function DataFlowDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="link" size="sm" className="h-auto px-0" />}>
        <InfoIcon /> Hvert fara gögnin?
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hvert fara gögnin?</DialogTitle>
          <DialogDescription>Stutt yfirlit yfir gagnaflæði í þessari frumgerð.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>Vafrinn:</strong> Innsláttur og drög eru aðeins geymd í minni vafraflipans. Ekkert er vistað
            í vafrakökum, localStorage eða gagnagrunni. Þegar þú smellir á „Hreinsa allt“, endurhleður eða lokar
            síðunni hverfa gögnin.
          </p>
          <p>
            <strong>Bakendinn (þessi þjónn):</strong> Tekur við texta, býr til drög og skilar þeim strax. Texti nótna
            er hvorki skráður í annála né vistaður.
          </p>
          <p>
            <strong>Staðbundið sniðmát:</strong> Ekkert fer út fyrir þjóninn. Skipulögðu reitirnir eru settir orðrétt
            undir rétta fyrirsögn og frjálsar nótur eru hafðar óflokkaðar.
          </p>
          <p>
            <strong>Claude (Anthropic):</strong> Aðeins ef þú velur það og staðfestir. Þá sendir bakendinn textann til
            API Anthropic í Bandaríkjunum. API-lykillinn er eingöngu á bakendanum. Meðferð og varðveisla gagna hjá
            Anthropic fer eftir samningi og stillingum þess aðgangs sem lykillinn tilheyrir — það þarf að meta
            (m.a. vinnslusamning og flutning gagna út fyrir EES) áður en raunveruleg gögn eru notuð.
          </p>
          <p className="text-muted-foreground">
            Bein auðkenni (kennitölur, netföng, símanúmer) eru skimuð og stöðvuð áður en sent er til Claude. Skimunin
            finnur ekki nöfn — ekki skrá nöfn.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
