import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, CheckCircle2, ChevronDown, ChevronRight, LockKeyhole, Menu, Phone, Search, UserRound, UserRoundPen } from "lucide-react";
import crestAsset from "@/assets/vid-crest.asset.json";
import fundingAsset from "@/assets/eds-funding.asset.json";
import { CustomsPoints } from "@/components/CustomsPoints";
import { askAssistant } from "@/lib/ai.functions";
import { isGenericReply, toAiHistory, type Msg } from "@/lib/toms";
import { TomsAvatar, TomsChat, useScriptedChat } from "@/components/TomsChat";
import {
  CommunicationChoices,
  type CommunicationCategory,
} from "@/components/CommunicationChoices";
import { Button } from "@/components/ui/button";
import {
  clearConversation,
  detectTopic,
  edsReply,
  loadConversation,
  type Summary,
} from "@/lib/toms";

export const Route = createFileRoute("/eds")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { no?: string | undefined; category?: CommunicationCategory | undefined; point?: string | undefined } => ({
    no: typeof s["no"] === "string" ? s["no"] : undefined,
    category:
      s["category"] === "chat" || s["category"] === "doc" || s["category"] === "customs" || s["category"] === "history"
        ? s["category"]
        : undefined,
    point: typeof s["point"] === "string" ? s["point"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "EDS — Sarakste ar VID | Virtuālais asistents" },
      {
        name: "description",
        content:
          "EDS virtuālā asistenta prototips ar simulētām personalizētām atbildēm un sarežģītu jautājumu nodošanu speciālistam.",
      },
      { property: "og:title", content: "EDS — Sarakste ar VID | Virtuālais asistents" },
      { property: "og:description", content: "Vienkāršota saziņa ar VID EDS vidē." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EdsPage,
});
const MENU = [
  "Uz sākumu",
  "Dokumenti",
  "Atgādinājumi",
  "Sarakste ar VID",
  "Maksājumi",
  "Citas sistēmas",
  "Pārskati",
  "Izziņas",
  "E-rēķini",
  "Reģistri",
  "Iestatījumi",
  "Noderīgi",
  "Beigt darbu",
];
const TABS = ["Nelasītie", "Iesūtne", "Nosūtne", "Sagatavotie", "Rakstīt jaunu vēstuli"];
const greetings = {
   chat: "Labdien! Esmu VID virtuālais asistents. Atbildu uz nodokļu jautājumiem un sameklēju informāciju par Jums iestādes IS. Tikai sarežģītus jautājumus nododu speciālistam. Šajā prototipā atbildes un dati ir simulēti. Par ko vēlaties jautāt?",
  customs:
    "Labdien! Esmu VID virtuālais asistents. Atbildu uz muitas jautājumiem un sameklēju Jūsu informāciju muitas IS. Tikai sarežģītus jautājumus nododu muitas speciālistam. Šajā prototipā atbildes un dati ir simulēti.",
};
type SavedConversation = { id: string; category: "chat" | "customs"; messages: Msg[]; date?: string };
type SavedLetter = Summary & { date?: string };
const historyStorageKey = "vid-eds-correspondence-v1";
function EdsPage() {
  const router = useRouter();
  const { no, category, point } = Route.useSearch();
  const [tab, setTab] = useState(TABS[4]);
  const [signedIn, setSignedIn] = useState(!no);
  const [cat, setCat] = useState<CommunicationCategory | null>(null);
  const [sent, setSent] = useState<Summary | null>(null);
  const [outbox, setOutbox] = useState<SavedLetter[]>([]);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const activeConversation = useRef<string | null>(null);
  const [email, setEmail] = useState("jberzins@example.lv");
  const [editingEmail, setEditingEmail] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mailSearch, setMailSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const requestText = useRef("");
  const topic = useRef<CommunicationCategory>("chat");
  const previousSteps = useRef<Array<{ tab: string; cat: CommunicationCategory | null; sent: Summary | null; signedIn: boolean; messages: Msg[]; id: string | null; topic: CommunicationCategory; request: string; turn: number }>>([]);
  const chat = useScriptedChat([], (text, turn, history) => {
    requestText.current = [requestText.current, text].filter(Boolean).join("\n");
    const combined =
      topic.current === "customs"
        ? `Muitas jautājums: ${requestText.current}`
        : requestText.current;
    const complexPattern = /(apstrīd|pārsūdz|nepiekrīt|nepiekrītu|pretrun|sarežģīt|sarežģit)/i;
    const continuingSummary = turn > 0 && complexPattern.test(requestText.current) && !complexPattern.test(text);
    const r = edsReply(combined, turn, text, continuingSummary);
    if (!isGenericReply(r)) return r;
    return askAssistant({ data: { history: toAiHistory(history), domain: topic.current === "customs" ? "customs" : "tax" } }).then(({ text: answer }): Msg[] => [{ from: "toms", text: answer }]);
  });
  const rememberStep = () => {
    previousSteps.current.push({ tab, cat, sent, signedIn, messages: chat.messages, id: activeConversation.current, topic: topic.current, request: requestText.current, turn: chat.turn.current });
  };
  const goBack = () => {
    const step = previousSteps.current.pop();
    if (!step) {
      if (window.history.length > 1) router.history.back();
      else router.navigate({ to: "/" });
      return;
    }
    setTab(step.tab);
    setCat(step.cat);
    setSent(step.sent);
    setSignedIn(step.signedIn);
    activeConversation.current = step.id;
    topic.current = step.topic;
    requestText.current = step.request;
    const latest = conversations.find((row) => row.id === step.id)?.messages;
    chat.reset(latest ?? step.messages);
    chat.turn.current = latest ? latest.filter((m) => m.from === "user").length : step.turn;
  };
  const choose = (c: CommunicationCategory, saveStep = true) => {
    if (saveStep) rememberStep();
    activeConversation.current = c === "chat" || c === "customs" ? crypto.randomUUID() : null;
    setTab(TABS[4]);
    setCat(c);
    setSent(null);
    requestText.current = "";
    topic.current = c;
    if (c === "doc" || c === "history") chat.reset([]);
    else chat.reset([{ from: "toms", text: greetings[c] }]);
  };
  const continueConversation = () => {
    rememberStep();
    setSignedIn(true);
    if (no === "toms") {
      const previous = loadConversation();
      if (previous) {
        const lastUser = [...previous].reverse().find((m) => m.from === "user")?.text ?? "";
        const c = detectTopic(lastUser).kategorija === "Muitas jautājumi" ? "customs" : "chat";
        topic.current = c;
        activeConversation.current = crypto.randomUUID();
        requestText.current = lastUser;
        setCat(c);
        setTab(TABS[4]);
        chat.reset([
          ...previous.filter((m) => m.action !== "auth" && !m.text.toLowerCase().includes("identifik")),
          ...edsReply(lastUser, 0),
        ]);
        chat.turn.current = 1;
        clearConversation();
      }
    } else if (category) choose(category, false);
  };
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(historyStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.conversations)) setConversations(parsed.conversations.filter((row: SavedConversation) => row && typeof row.id === "string" && (row.category === "chat" || row.category === "customs") && Array.isArray(row.messages)));
        if (Array.isArray(parsed.outbox)) setOutbox(parsed.outbox);
      }
    } catch { /* An unavailable or expired browser session starts empty. */ }
    setHistoryLoaded(true);
  }, []);
  useEffect(() => {
    const id = activeConversation.current;
    if (!historyLoaded || !id || !chat.messages.some((m) => m.from === "user")) return;
    const row: SavedConversation = { id, category: topic.current === "customs" ? "customs" : "chat", messages: chat.messages, date: new Date().toISOString() };
    setConversations((rows) => rows.some((item) => item.id === id) ? rows.map((item) => item.id === id ? { ...row, date: item.date } : item) : [...rows, row]);
  }, [chat.messages, historyLoaded]);
  useEffect(() => {
    if (!historyLoaded) return;
    try { sessionStorage.setItem(historyStorageKey, JSON.stringify({ conversations, outbox })); } catch { /* Storage may be disabled in the browser. */ }
  }, [conversations, outbox, historyLoaded]);
  const resumeConversation = (row: SavedConversation) => {
    rememberStep();
    activeConversation.current = row.id;
    topic.current = row.category;
    requestText.current = row.messages.filter((m) => m.from === "user").map((m) => m.text).join("\n");
    setCat(row.category);
    setSent(null);
    setTab(TABS[4]);
    chat.reset(row.messages);
    chat.turn.current = row.messages.filter((m) => m.from === "user").length;
  };
  useEffect(() => {
    if (!no && category) choose(category, false);
    // Search changes are entry points, not changes to the active conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no, category, point]);
  const reset = () => {
    rememberStep();
    activeConversation.current = null;
    setCat(null);
    setSent(null);
    setTab(TABS[4]);
    chat.reset();
    clearConversation();
    requestText.current = "";
  };
  const submit = (s: Summary) => {
    rememberStep();
    setSent(s);
    setOutbox((rows) => [...rows, { ...s, date: new Date().toISOString() }]);
  };
  return (
    <div className="eds-shell flex min-h-screen bg-background">
      <aside
        className={`${mobileMenu ? "fixed inset-y-0 left-0 z-30 block" : "hidden"} eds-sidebar w-[177px] shrink-0 bg-sidebar md:block`}
      >
        <div className="flex h-[100px] flex-col items-center justify-center text-center text-sidebar-foreground">
          <img src={crestAsset.url} alt="Latvijas valsts ģerbonis" className="eds-crest mb-1 h-[55px] w-[55px] object-contain" />
          <div className="text-[9px] font-bold">Valsts ieņēmumu dienests</div>
        </div>
          <div className="flex h-[58px] items-center justify-center bg-secondary text-center text-[10px] leading-3 text-primary">
            <span>
            ELEKTRONISKĀS
            <br />
            DEKLARĒŠANAS SISTĒMA
            </span>
          </div>
        <nav aria-label="EDS izvēlne" className="pt-[10px]">
          {MENU.map((m) => (
            <div
              key={m}
              className={`eds-menu ${m === "Sarakste ar VID" ? "eds-menu-active" : ""} ${m === "Atgādinājumi" ? "!text-accent-orange" : ""}`}
            >
              <span className="flex items-center gap-2">{m === "Atgādinājumi" && <Bell size={12} />}{m.toUpperCase()}</span>
              {m === "Dokumenti" && (
                <span className="grid size-[17px] place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  3
                </span>
              )}
              {["Citas sistēmas", "Iestatījumi", "Noderīgi"].includes(m) && (
                <ChevronRight size={12} />
              )}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[42px] shrink-0 items-center gap-3 bg-primary pl-[15px] text-primary-foreground">
          <Button
            size="icon-sm"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="EDS izvēlne"
          >
            <Menu />
          </Button>
          <h1 className="text-base font-normal">SARAKSTE AR VID</h1>
          <div className="ml-auto flex h-full items-center">
            <Button variant="ghost" className="h-full rounded-none px-2 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground" onClick={() => setSearchOpen(!searchOpen)} aria-label="Meklēt EDS">
              <Search className="size-7" /><span className="hidden text-xs sm:inline">MEKLĒT</span><ChevronDown className="size-4" />
            </Button>
            <span className="grid h-full w-[38px] place-items-center border-l border-primary-foreground/20" aria-label="Lietotājs"><UserRound className="size-7" fill="currentColor" /></span>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setEditingEmail(false);
          }}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-[15px] pb-[13px] pt-[21px] sm:flex sm:gap-1"
        >
          <label htmlFor="contact-email" className="mr-2 text-[10px] text-foreground">
            Jūsu saziņas e-pasts
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            readOnly={!editingEmail}
            onChange={(e) => setEmail(e.target.value)}
            className="input-vid order-3 h-[26px] w-full min-w-0 rounded-none bg-chat-surface px-2 py-0 text-[10px] sm:order-none sm:w-[192px]"
          />
          <Button
            variant="outline"
            size="sm"
            type={editingEmail ? "submit" : "button"}
            onClick={() => {
              if (!editingEmail) setEditingEmail(true);
            }}
            className="h-[26px] rounded-none border-primary px-3 text-[10px] text-primary"
          >
            {editingEmail ? "Saglabāt" : "Labot"}
          </Button>
        </form>
        <nav
          aria-label="Sarakstes sadaļas"
          className="flex overflow-x-auto border-b border-border px-[22px]"
        >
          {TABS.map((t) => (
            <Button
              key={t}
              variant="ghost"
              onClick={() => { if (tab !== t) { rememberStep(); setTab(t); } }}
              className={`h-auto rounded-none ${tab === t ? "eds-tab-active" : "eds-tab"}`}
            >
              {t}
            </Button>
          ))}
        </nav>
        {searchOpen && <div className="border-b border-border px-[15px] py-2"><input aria-label="Meklēt EDS" autoFocus placeholder="Meklēt..." value={mailSearch} onChange={(e) => setMailSearch(e.target.value)} className="input-vid h-[26px] w-full max-w-[300px] rounded-none text-[10px]" /></div>}
        <main className={`flex-1 ${tab === TABS[4] ? "w-full max-w-[719px] px-[15px] pb-8 pt-7" : "pt-[7px]"}`}>
          <Button variant="link" size="sm" onClick={goBack} className="mb-4 h-auto px-0 text-xs text-primary"><ArrowLeft size={14} /> Atpakaļ</Button>
          {!signedIn ? (
            <section className="mx-auto mt-8 max-w-[430px] border border-border bg-card p-6" aria-labelledby="eds-login-title">
              <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-secondary text-primary"><LockKeyhole size={20} /></span><div><h2 id="eds-login-title" className="text-base font-bold text-primary">Pieslēgties EDS</h2><p className="text-xs text-muted-foreground">Droša identificēšanās sarunas turpināšanai</p></div></div>
              <p className="mb-5 text-sm leading-6">{no === "toms" ? "Pēc pieslēgšanās turpināsiet iesākto sarunu ar VID virtuālo asistentu." : point ? `Pēc pieslēgšanās varēsiet rakstīt: ${point}.` : "Pēc pieslēgšanās varēsiet rakstīt VID speciālistam."}</p>
              <Button className="w-full" onClick={continueConversation}>Pieslēgties EDS</Button>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">Pieslēgšanās šajā prototipā tiek demonstrēta.</p>
            </section>
          ) : tab !== TABS[4] ? (
            <>
              <input aria-label="Meklēt vēstulēs" placeholder="Meklēt..." value={mailSearch} onChange={(e) => setMailSearch(e.target.value)} className="input-vid mb-[7px] ml-[15px] h-[26px] w-[192px] rounded-none px-2 py-0 text-[10px]" />
              {tab === "Nosūtne" && outbox.some((s) => `${s.tema} ${s.teksts}`.toLowerCase().includes(mailSearch.toLowerCase())) ? (
                <div className="space-y-2 px-[15px]">
                  {outbox.filter((s) => `${s.tema} ${s.teksts}`.toLowerCase().includes(mailSearch.toLowerCase())).map((s, i) => (
                    <div key={i} className="border-b border-border py-3">
                      <p className="text-sm font-bold text-primary">{s.tema}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.struktura} · Nosūtīts prototipā
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{s.teksts}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="border-y border-border pl-[15px] text-[10px] leading-[15px] text-foreground">Nav atrasts neviens ziņojums</p>
              )}
            </>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                {(cat || sent) && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={reset}
                    className="h-auto p-0 text-xs text-muted-foreground"
                  >
                    <ArrowLeft size={12} />
                    Sākt no jauna
                  </Button>
                )}
              </div>
              {sent ? (
                <section role="status" className="border-t border-border py-5">
                  <CheckCircle2 className="mb-3 text-chat-primary" />
                  <h3 className="text-lg font-bold text-primary">
                     Paldies! Jūsu ziņa ir nodota speciālistam.
                  </h3>
                  <p className="mt-3 text-sm">Tēma: {sent.tema}</p>
                  <p className="mt-1 text-sm">Adresāts: {sent.struktura}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                     Standarta gadījumos cenšamies atbildēt 10 darba dienu laikā. Šī ir demonstrācija — VID speciālists ziņu nesaņem.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => { rememberStep(); setTab("Nosūtne"); }}>
                    Skatīt nosūtnē
                  </Button>
                </section>
              ) : cat === null ? (
                <CommunicationChoices onChoose={choose} />
              ) : cat === "history" ? (
                <CorrespondenceHistory outbox={outbox} conversations={conversations} onResume={resumeConversation} />
              ) : cat === "doc" ? (
                <DocForm onSent={submit} onCancel={goBack} {...(point ? { recipient: point } : {})} />
              ) : (
                <>
                  <section className="overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center gap-3 border-b border-border bg-chat-header px-4 py-3">
                       {cat !== "customs" && <TomsAvatar size={30} virtualAssistant />}
                      <div>
                         <h3 className="text-sm font-bold text-primary">Virtuālais asistents</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="online-dot" />
                          {cat === "customs" ? "Muitas jautājumi" : "Nodokļu jomas jautājumi"}
                        </p>
                      </div>
                    </div>
                    <TomsChat
                      hideAvatar={cat === "customs"}
                       virtualAssistant
                      messages={chat.messages}
                      onSend={chat.send}
                      busy={chat.busy}
                      onSubmitSummary={submit}
                      suggestions={
                        cat === "customs"
                          ? ["Pasta sūtījumi", "Muitas jautājumi", "Rakstu uz muitas punktu"]
                          : [
                              "Gada ienākumu deklarācija",
                               "Kāds man ir parāds?",
                              "Darbības EDS",
                               "Nepiekrītu aprēķinātajam parādam",
                            ]
                      }
                    />
                  </section>
                  <section className="mt-4 border-t border-border pt-4">
                    <h3 className="mb-3 text-xs font-bold text-primary">Citas saziņas iespējas</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal border-primary text-primary"
                        onClick={() => choose(cat === "customs" ? "chat" : "customs")}
                      >
                        {cat === "customs"
                          ? "Rakstīt par nodokļu jautājumu"
                          : "Rakstīt par muitas jautājumu"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal border-primary text-primary"
                        onClick={() => choose("doc")}
                      >
                        Iesniegt dokumentu vai rakstīt speciālistam
                      </Button>
                    </div>
                  </section>
                  {cat === "customs" && <section className="mt-4 border-t border-border pt-4"><CustomsPoints /></section>}
                </>
              )}
            </>
          )}
        </main>
        <footer className="eds-footer min-h-[84px] shrink-0 bg-secondary px-[15px] py-3 text-[10px] text-primary">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <a href="tel:67120000" className="flex items-center gap-1 font-bold"><Phone size={15} fill="currentColor" />67120000</a>
            {["Lietošanas noteikumi", "Personas datu apstrāde VID", "Sīkdatņu izmantošanas politika"].map((label) => <span key={label} className="flex items-center gap-1 font-bold underline"><UserRoundPen size={17} fill="currentColor" />{label}</span>)}
            <img src={fundingAsset.url} alt="Nacionālais attīstības plāns 2020 un Eiropas Savienības Eiropas Reģionālās attīstības fonds — Ieguldījums tavā nākotnē" className="h-[50px] w-[222px] object-contain" />
          </div>
          <p className="mt-[-2px] text-[9px] text-foreground">Versija 28.0.60.7, <Link to="/" className="text-primary underline">www.vid.gov.lv</Link></p>
        </footer>
      </div>
    </div>
  );
}
const formats = [
  "odt",
  "ods",
  "docx",
  "xlsx",
  "pdf",
  "jpg",
  "jpeg",
  "tif",
  "tiff",
  "png",
  "edoc",
  "asice",
  "heic",
  "xhtml",
  "zip",
];
function HistoryDate({ date }: { date?: string }) {
  if (!date || Number.isNaN(Date.parse(date))) return <p className="mb-1 text-xs text-muted-foreground">Datums nav saglabāts</p>;
  return <time dateTime={date} className="mb-1 block text-xs text-muted-foreground">{new Date(date).toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Riga" })}</time>;
}
function CorrespondenceHistory({ outbox, conversations, onResume }: { outbox: SavedLetter[]; conversations: SavedConversation[]; onResume: (row: SavedConversation) => void }) {
  return <section aria-labelledby="history-title">
    <h3 id="history-title" className="mb-1 text-base font-bold text-primary">Sarakstes vēsture</h3>
    <p className="mb-3 text-xs text-muted-foreground">Sarunas un speciālistam pārsūtītās vēstules</p>
    <div className="mb-5 flex flex-wrap gap-2 text-xs font-bold text-primary-foreground">
      <span className="rounded bg-primary px-2 py-1">Parastos gadījumos — 10 darba dienas</span>
      <span className="rounded bg-primary px-2 py-1">Sarežģītos gadījumos — 30 darba dienas</span>
    </div>
    <div className="divide-y divide-border border-y border-border">
      {conversations.map((row) => <article key={row.id} className="py-4">
        <HistoryDate date={row.date} />
        <h4 className="text-sm font-bold text-primary">{row.messages.find((m) => m.from === "user")?.text}</h4>
        <details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">Saruna ar virtuālo asistentu</summary>
          <div className="mt-3 space-y-3">{row.messages.filter((m) => m.from !== "system").map((m, i) => <div key={i}><p className="text-xs font-bold text-primary">{m.from === "user" ? "Jūs" : "Virtuālais asistents"}</p><p className="mt-1 whitespace-pre-wrap text-sm">{m.text}</p></div>)}</div>
        </details>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => onResume(row)}>Turpināt saraksti</Button>
      </article>)}
      {outbox.map((item, index) => <article key={`letter-${index}`} className="py-4">
        <HistoryDate date={item.date} />
        <h4 className="text-sm font-bold text-primary">{item.tema}</h4>
        <p className="mt-1 text-xs text-muted-foreground">Speciālistam pārsūtīta vēstule · {item.struktura}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm">{item.teksts}</p>
      </article>)}
      {!conversations.length && !outbox.length && <p className="py-4 text-sm text-muted-foreground">Nav sarunu vai speciālistam pārsūtītu vēstuļu.</p>}
    </div>
  </section>;
}

const documentSubtypes: Record<string, string[]> = {
  "Iesniegums": ["Iesniegums par nodokļu atmaksu", "Iesniegums par nodokļu parāda samaksas termiņa pagarinājumu", "Iesniegums par nodokļu maksājumu sadalīšanu termiņos", "Iesniegums par nodokļu aprēķina pārskatīšanu", "Cits iesniegums"],
  "Paskaidrojums": ["Paskaidrojums par deklarācijas datiem", "Paskaidrojums par ienākumiem", "Paskaidrojums par nodokļu maksājumiem", "Cits paskaidrojums"],
  "Pilnvara": ["Pilnvara pārstāvībai VID", "Pilnvara muitas formalitāšu kārtošanai", "Pilnvaras atsaukums", "Cita pilnvara"],
  "Muitas jautājums": ["Par pasta sūtījuma muitošanu", "Par muitas deklarācijas precizēšanu", "Par muitas maksājumu atmaksu", "Cits muitas jautājums"],
  "Cits dokuments": ["Papildu informācija iepriekšējai vēstulei", "Apliecinoši dokumenti", "Cits dokuments vai ziņa speciālistam"],
};

function DocForm({ onSent, onCancel, recipient }: { onSent: (s: Summary) => void; onCancel: () => void; recipient?: string }) {
  const [type, setType] = useState(recipient ? "Muitas jautājums" : "");
  const [subtype, setSubtype] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!type || !subtype || !text.trim() || error) return;
        onSent({
          kategorija: "Dokumenta iesniegšana",
          tema: subtype,
          struktura: recipient ?? "VID speciālists",
          teksts: text,
        });
      }}
    >
      <h3 className="text-base font-bold text-primary">
        Iesniegt dokumentu vai rakstīt speciālistam
      </h3>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">
        {recipient ? `Adresāts: ${recipient}. ` : ""}Aizpildiet paskaidrojumu un, ja nepieciešams, pievienojiet dokumentu.
      </p>
      <label className="mb-4 block text-sm text-primary">
        Dokumenta veids<span className="text-destructive">*</span>
        <select
          required
          value={type}
          onChange={(e) => { setType(e.target.value); setSubtype(""); }}
          className="input-vid mt-1 h-9 w-full"
        >
          <option value="">— izvēlieties —</option>
          {Object.keys(documentSubtypes).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {type && <label className="mb-4 block text-sm text-primary">
        Dokumenta apakšveids<span className="text-destructive">*</span>
        <select required value={subtype} onChange={(e) => setSubtype(e.target.value)} className="input-vid mt-1 h-9 w-full">
          <option value="">— izvēlieties —</option>
          {(documentSubtypes[type] ?? []).map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>}
      <label className="mb-5 block text-sm text-primary">
        Vēstules teksts / paskaidrojums<span className="text-destructive">*</span>
        <textarea
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Aprakstiet savu jautājumu vai sniedziet paskaidrojumu"
          className="input-vid mt-1 h-[130px] w-full resize-y"
        />
      </label>
      <label className="block text-sm text-primary">
        Pielikumi
        <input
          aria-label="Pielikumi"
          type="file"
          multiple
          accept={formats.map((f) => `.${f}`).join(",")}
          className="mt-1 block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border file:border-input file:bg-card file:px-3 file:py-2 file:text-sm file:text-primary"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            const invalid = files.find(
              (f) => !formats.includes(f.name.split(".").pop()?.toLowerCase() ?? ""),
            );
            setError(
              invalid
                ? `Neatļauts faila formāts: ${invalid.name}`
                : files.some((f) => f.size > 20 * 1024 * 1024)
                  ? "Viena faila izmērs nedrīkst pārsniegt 20 MB."
                  : files.reduce((sum, f) => sum + f.size, 0) > 50 * 1024 * 1024
                    ? "Kopējais failu izmērs nedrīkst pārsniegt 50 MB."
                    : "",
            );
          }}
        />
      </label>
      <p className="mt-1 text-xs leading-4 text-muted-foreground">
        Atļautie failu formāti: {formats.join(", ").toUpperCase()}
        <br />
        Maksimāli pieļaujamais viena faila izmērs: 20 MB
        <br />
        Maksimāli pieļaujamais visu dokumentam pievienoto failu kopējais izmērs: 50 MB
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <Button type="submit" disabled={!type || !subtype || !text.trim() || !!error}>
          Nosūtīt
        </Button>
        <Button variant="outline" type="button" onClick={onCancel}>
          Atcelt
        </Button>
      </div>
      <p className="mt-4 rounded-md border border-accent-orange/50 bg-warning-surface px-3 py-3 text-xs text-warning-text">
        Šeit iesniegtie dokumenti nonāk VID informācijas sistēmās un tos manuāli apstrādā VID
        darbinieki.
      </p>
    </form>
  );
}
