"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangleIcon,
  CheckIcon,
  ClipboardCopyIcon,
  CloudIcon,
  FileTextIcon,
  FlaskConicalIcon,
  Loader2Icon,
  RotateCcwIcon,
  ServerIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataFlowDialog } from "@/components/data-flow-dialog";
import { FIELDS, type FieldKey, type SoapSection } from "@/lib/note/fields";
import { collectText, findIdentifiers } from "@/lib/note/privacy";
import { MAX_FIELD, MAX_FREE_NOTES, emptyFields, hasAnyInput, type DraftResult, type NoteFormat } from "@/lib/note/schema";
import { SAMPLE_INPUT } from "@/lib/note/samples";

type Engine = "local" | "claude";
type Status = { claudeAvailable: boolean; model: string | null } | null;

const SECTION_GROUP_LABELS: Record<SoapSection, string> = {
  S: "Frá foreldri / forsjáraðila",
  O: "Mælingar og skoðun",
  A: "Mat (aðeins þitt eigið)",
  P: "Fræðsla og eftirfylgd",
};

export function NoteWorkbench() {
  const [freeNotes, setFreeNotes] = useState("");
  const [fields, setFields] = useState<Record<FieldKey, string>>(emptyFields);
  const [format, setFormat] = useState<NoteFormat>("soap");
  const [engine, setEngine] = useState<Engine>("local");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [draft, setDraft] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStatus)
      .catch(() => setStatus({ claudeAvailable: false, model: null }));
  }, []);

  const identifiers = useMemo(() => findIdentifiers(collectText(freeNotes, fields)), [freeNotes, fields]);
  const inputPresent = hasAnyInput({ freeNotes, fields });
  const filledCount = Object.values(fields).filter((v) => v.trim()).length;
  const draftEdited = result !== null && draft !== result.draft;
  const claudeBlocked = engine === "claude" && (!consent || identifiers.length > 0 || !status?.claudeAvailable);
  const canGenerate = inputPresent && !loading && !claudeBlocked;

  function setField(key: FieldKey, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function requestGenerate() {
    if (draftEdited) setConfirmOverwrite(true);
    else void generate();
  }

  async function generate() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({ freeNotes, fields, format, engine, thirdPartyConsent: engine === "claude" && consent }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || typeof data.draft !== "string") {
        throw new Error(data?.error ?? `Nótugerð mistókst (villa ${res.status}).`);
      }
      setResult(data as DraftResult);
      setDraft(data.draft);
      setReviewed(false);
      setCopied(false);
      requestAnimationFrame(() => draftRef.current?.focus({ preventScroll: true }));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof TypeError ? "Ekki náðist samband við þjóninn. Athugaðu tenginguna og reyndu aftur." : (err as Error).message);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      toast.success("Drögin voru afrituð. Mundu að hreinsa þegar skráningu er lokið.");
    } catch {
      toast.error("Ekki tókst að afrita. Veldu textann og afritaðu handvirkt (Ctrl/⌘ + C).");
    }
  }

  function clearAll() {
    abortRef.current?.abort();
    setFreeNotes("");
    setFields(emptyFields());
    setResult(null);
    setDraft("");
    setError(null);
    setReviewed(false);
    setCopied(false);
    setConsent(false);
    setLoading(false);
    toast("Allur innsláttur og drög hafa verið hreinsuð.");
  }

  function loadSample() {
    setFreeNotes(SAMPLE_INPUT.freeNotes);
    setFields({ ...SAMPLE_INPUT.fields });
    setFormat(SAMPLE_INPUT.format);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nótuaðstoð ungbarnaverndar</h1>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
              Frumgerð
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Breyttu stuttum nótum eftir viðtal eða skoðun í skipulögð drög að sjúkraskrárfærslu. Þú yfirferð og
            berð ábyrgð á færslunni áður en hún er skráð.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSample} disabled={loading}>
            <FlaskConicalIcon /> Tilbúið dæmi
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmClear(true)}
            disabled={!inputPresent && !result && !error}
          >
            <Trash2Icon /> Hreinsa allt
          </Button>
        </div>
      </header>

      <Alert className="border-primary/30 bg-primary/5">
        <ShieldCheckIcon />
        <AlertTitle>Ekki skrá nafn, kennitölu eða önnur bein auðkenni</AlertTitle>
        <AlertDescription>
          Ekkert er vistað. Gögnin eru aðeins í þessum vafraflipa þar til þú hreinsar eða lokar honum. Frumgerðin er
          ekki metin eða samþykkt til klínískrar notkunar — notaðu eingöngu tilbúin gögn.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Nótur</CardTitle>
              <CardDescription>Skrifaðu eins og þér hentar — skammstafanir og stikkorð eru í lagi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="freeNotes">Frjálsar nótur</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {freeNotes.length}/{MAX_FREE_NOTES}
                  </span>
                </div>
                <Textarea
                  id="freeNotes"
                  value={freeNotes}
                  onChange={(e) => setFreeNotes(e.target.value)}
                  maxLength={MAX_FREE_NOTES}
                  rows={7}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="t.d. móðir kom m. barn í 6 v skoðun, gengur vel m. brjóstagjöf, vaknar 2x á nóttu …"
                  className="min-h-40 text-base sm:text-sm"
                />
              </div>

              {identifiers.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangleIcon />
                  <AlertTitle>Möguleg bein auðkenni fundust</AlertTitle>
                  <AlertDescription>
                    {identifiers.map((i) => `${i.label}: „${i.match}“`).join(" · ")}. Fjarlægðu þau áður en þú heldur
                    áfram.
                  </AlertDescription>
                </Alert>
              )}

              <details className="group rounded-lg border bg-muted/30" open={filledCount > 0 || undefined}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
                  <span>Skipulögð atriði (valfrjálst)</span>
                  <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                    {filledCount > 0 && <Badge variant="secondary">{filledCount} útfyllt</Badge>}
                    <span className="transition-transform group-open:rotate-180">▾</span>
                  </span>
                </summary>
                <div className="space-y-6 border-t px-4 py-4">
                  {(["S", "O", "A", "P"] as SoapSection[]).map((section) => (
                    <fieldset key={section} className="space-y-3">
                      <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {SECTION_GROUP_LABELS[section]}
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {FIELDS.filter((f) => f.section === section).map((f) => (
                          <div key={f.key} className={cn("space-y-1.5", f.multiline && "sm:col-span-2")}>
                            <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
                            {f.multiline ? (
                              <Textarea
                                id={`f-${f.key}`}
                                value={fields[f.key]}
                                onChange={(e) => setField(f.key, e.target.value)}
                                maxLength={MAX_FIELD}
                                rows={2}
                                autoComplete="off"
                                spellCheck={false}
                                placeholder={f.placeholder}
                                className="min-h-14 bg-background text-base sm:text-sm"
                              />
                            ) : (
                              <Input
                                id={`f-${f.key}`}
                                value={fields[f.key]}
                                onChange={(e) => setField(f.key, e.target.value)}
                                maxLength={MAX_FIELD}
                                autoComplete="off"
                                spellCheck={false}
                                placeholder={f.placeholder}
                                className="bg-background text-base sm:text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Nótugerð</CardTitle>
              <CardDescription>Veldu snið og hvernig drögin eru búin til.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Snið</Label>
                <Tabs value={format} onValueChange={(v) => setFormat(v as NoteFormat)}>
                  <TabsList>
                    <TabsTrigger value="soap">SOAP</TabsTrigger>
                    <TabsTrigger value="efnisflokkar">Efnisflokkar</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>Aðferð</Label>
                <div role="radiogroup" aria-label="Aðferð" className="grid gap-3 sm:grid-cols-2">
                  <EngineOption
                    selected={engine === "local"}
                    onSelect={() => setEngine("local")}
                    icon={<ServerIcon />}
                    title="Staðbundið sniðmát"
                    description="Ekkert sent út. Raðar reitum undir fyrirsagnir; frjáls texti óflokkaður."
                  />
                  <EngineOption
                    selected={engine === "claude"}
                    onSelect={() => setEngine("claude")}
                    disabled={status !== null && !status.claudeAvailable}
                    icon={<CloudIcon />}
                    title="Claude (Anthropic)"
                    description={
                      status === null
                        ? "Athuga stöðu …"
                        : status.claudeAvailable
                          ? "Flokkar og orðar frjálsan texta. Texti er sendur til Anthropic."
                          : "Ekki stillt á þjóni (vantar API-lykil)."
                    }
                  />
                </div>
                <DataFlowDialog />
              </div>

              {engine === "claude" && status?.claudeAvailable && (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                  <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5 bg-white" />
                  <span>
                    Ég staðfesti að textinn inniheldur engin bein auðkenni og að senda megi hann til Anthropic (Claude) í
                    Bandaríkjunum til að búa til drög. Gildir þar til ég hreinsa.
                  </span>
                </label>
              )}

              <Button size="lg" className="h-11 w-full text-base" onClick={requestGenerate} disabled={!canGenerate}>
                {loading ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
                {loading ? "Bý til drög …" : result ? "Búa til drög aftur" : "Búa til drög"}
              </Button>
              {!inputPresent && <p className="text-center text-xs text-muted-foreground">Skráðu nótur til að halda áfram.</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              3. Drög að færslu
              {result && (
                <Badge variant="secondary">{result.engine === "claude" ? "Claude" : "Sniðmát"}</Badge>
              )}
              {draftEdited && <Badge variant="outline">Breytt</Badge>}
            </CardTitle>
            <CardDescription>Yfirfarðu, leiðréttu og samþykktu áður en þú afritar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertTitle>Nótugerð mistókst</AlertTitle>
                <AlertDescription>
                  <p>{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => void generate()} disabled={!canGenerate}>
                    <RotateCcwIcon /> Reyna aftur
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {loading && !result && <DraftSkeleton />}

            {!loading && !result && !error && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
                <FileTextIcon className="size-8 opacity-50" />
                <p className="max-w-xs">
                  Drögin birtast hér. Þú getur breytt þeim áður en þú afritar þau í sjúkraskrárkerfið.
                </p>
              </div>
            )}

            {result && (
              <>
                <div className="relative">
                  <Textarea
                    ref={draftRef}
                    aria-label="Drög að færslu"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setCopied(false);
                    }}
                    spellCheck={false}
                    rows={18}
                    className={cn("min-h-80 font-mono text-[13px] leading-relaxed", loading && "opacity-50")}
                  />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2Icon className="size-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <ResultList
                  tone="warning"
                  title="Athugaðu sérstaklega"
                  items={result.warnings}
                />
                <ResultList tone="question" title="Spurningar til þín" items={result.questions} />
                <ResultList
                  tone="info"
                  title="Ekki gefið upp — bættu við ef við á"
                  items={result.missing}
                />

                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox checked={reviewed} onCheckedChange={(v) => setReviewed(v === true)} className="mt-0.5" />
                    <span>
                      Ég hef yfirfarið drögin, leiðrétt það sem þurfti og staðfest að þau innihaldi aðeins upplýsingar
                      sem komu fram.
                    </span>
                  </label>
                  <Button className="w-full" variant={copied ? "secondary" : "default"} onClick={copyDraft} disabled={!reviewed || !draft.trim()}>
                    {copied ? <CheckIcon /> : <ClipboardCopyIcon />}
                    {copied ? "Afritað" : "Afrita drög"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="pb-4 text-center text-xs text-muted-foreground">
        Aðstoðartæki fyrir hjúkrunarfræðinga — ekki greiningar- eða meðferðartæki. Mat-kaflinn inniheldur
        aðeins mat sem þú skráir sjálf(ur).
      </footer>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Hreinsa allt?"
        description="Allar nótur, skipulögð atriði og drög verða fjarlægð úr þessum flipa. Ekki er hægt að afturkalla."
        confirmLabel="Hreinsa allt"
        destructive
        onConfirm={clearAll}
      />
      <ConfirmDialog
        open={confirmOverwrite}
        onOpenChange={setConfirmOverwrite}
        title="Skipta út breyttum drögum?"
        description="Þú hefur breytt drögunum. Ný drög munu koma í stað breytinganna þinna."
        confirmLabel="Búa til ný drög"
        onConfirm={() => void generate()}
      />
    </div>
  );
}

function EngineOption({
  selected,
  onSelect,
  disabled,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
      )}
    >
      {icon}
      <span className="space-y-0.5">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

function ResultList({ tone, title, items }: { tone: "warning" | "question" | "info"; title: string; items: string[] }) {
  if (items.length === 0) return null;
  const styles = {
    warning: "border-amber-300 bg-amber-50 text-amber-950",
    question: "border-sky-300 bg-sky-50 text-sky-950",
    info: "border-border bg-muted/40",
  }[tone];
  return (
    <div className={cn("rounded-lg border p-3 text-sm", styles)}>
      <p className="mb-1.5 font-medium">{title}</p>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function DraftSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-4" aria-busy="true" aria-label="Bý til drög">
      {[40, 90, 75, 35, 85, 60, 30, 70].map((w, i) => (
        <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
