import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Bell, CheckCircle2, ChevronDown, ChevronRight, LockKeyhole, Menu, Phone, Search, UserRound, UserRoundPen, X } from "lucide-react";
import vidCrestMark from "@/assets/vid-crest-mark.png";
import fundingImage from "@/assets/eds-funding.png";
import { CustomsPoints } from "@/components/CustomsPoints";
import { askAssistant, usableAssistantAnswer, type AssistantDomain } from "@/lib/ai.functions";
import { documentSubtypes, matchStructuredForm, submittedFormNotice } from "@/lib/documents";
import { gamblingReply, isGenericReply, toAiHistory, type Msg } from "@/lib/toms";
import { TomsAvatar, TomsChat, useScriptedChat } from "@/components/TomsChat";
import {
  CommunicationChoices,
  ViewSwitch,
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
      s["category"] === "chat" || s["category"] === "doc" || s["category"] === "customs" || s["category"] === "history" || s["category"] === "gambling" || s["category"] === "gambling-doc"
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
  gambling:
    "Labdien! Esmu VID virtuālais asistents. Atbildu uz azartspēļu un izložu jautājumiem. Tikai sarežģītus jautājumus nododu jomas speciālistam. Šajā prototipā atbildes ir simulētas.",
};
type SavedConversation = { id: string; category: "chat" | "customs" | "gambling"; messages: Msg[]; date?: string | undefined; cancelled?: boolean | undefined };
type SavedLetter = Summary & { id: string; date?: string | undefined; cancelled?: boolean | undefined };
const historyStorageKey = "vid-eds-correspondence-v1";
function EdsPage() {
  const router = useRouter();
  const { no, category, point } = Route.useSearch();
  const [tab, setTab] = useState(TABS[4]);
  const [signedIn, setSignedIn] = useState(!no);
  const [authTarget, setAuthTarget] = useState<CommunicationCategory | null>(null);
  const [cat, setCat] = useState<CommunicationCategory | null>(null);
  const [sent, setSent] = useState<Summary | null>(null);
  const [notice, setNotice] = useState<Summary | null>(null);
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
  const previousSteps = useRef<Array<{ tab: string | undefined; cat: CommunicationCategory | null; sent: Summary | null; signedIn: boolean; messages: Msg[]; id: string | null; topic: CommunicationCategory; request: string; turn: number }>>([]);
  const chat = useScriptedChat([], (text, turn, history) => {
    requestText.current = [requestText.current, text].filter(Boolean).join("\n");
    const combined =
      topic.current === "customs"
        ? `Muitas jautājums: ${requestText.current}`
        : requestText.current;
    const complexPattern = /(apstrīd|pārsūdz|nepiekrīt|nepiekrītu|pretrun|sarežģīt|sarežģit)/i;
    const continuingSummary = turn > 0 && complexPattern.test(requestText.current) && !complexPattern.test(text);
    const r = topic.current === "gambling" ? gamblingReply(text, history) : edsReply(combined, turn, text, continuingSummary);
    if (!isGenericReply(r)) return r;
    const domain: AssistantDomain = topic.current === "customs" ? "customs" : topic.current === "gambling" ? "gambling" : "tax";
    return askAssistant({ data: { history: toAiHistory(history), domain } }).then(({ text: answer }): Msg[] => {
      const usable = usableAssistantAnswer(answer);
      return usable ? [{ from: "toms", text: usable }] : r;
    }).catch(() => r);
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
  const choose = (c: CommunicationCategory, saveStep = true, fromAuth = false) => {
    if ((c === "doc" || c === "gambling-doc") && !fromAuth) {
      if (saveStep) rememberStep();
      setAuthTarget(c);
      setSignedIn(false);
      setCat(null);
      setSent(null);
      return;
    }
    if (saveStep) rememberStep();
    setAuthTarget(null);
    activeConversation.current = c === "chat" || c === "customs" || c === "gambling" ? crypto.randomUUID() : null;
    setTab(TABS[4]);
    setCat(c);
    setSent(null);
    requestText.current = "";
    topic.current = c;
    if (c === "doc" || c === "history" || c === "gambling-doc") chat.reset([]);
    else chat.reset([{ from: "toms", text: greetings[c] }]);
  };
  const continueConversation = () => {
    setSignedIn(true);
    if (no === "toms") {
      const previous = loadConversation();
      if (previous) {
        const lastUser = [...previous].reverse().find((m) => m.from === "user")?.text ?? "";
        const detected = detectTopic(lastUser).kategorija;
        const c = detected === "Muitas jautājumi" ? "customs" : detected === "Azartspēļu un izložu jautājumi" ? "gambling" : "chat";
        topic.current = c;
        activeConversation.current = crypto.randomUUID();
        requestText.current = lastUser;
        setCat(c);
        setTab(TABS[4]);
        const gamblingContinuation = gamblingReply(lastUser, previous);
        const continuation = c !== "gambling"
          ? edsReply(lastUser, 0)
          : gamblingContinuation.some((m) => m.action === "auth")
            ? [{ from: "toms" as const, text: "Pēc pieslēgšanās turpinām azartspēļu un izložu jautājumu. Ja vajag konkrētas situācijas izvērtējumu, varat rakstīt VID speciālistam." }]
            : gamblingContinuation;
        chat.reset([
          ...previous.filter((m) => m.action !== "auth" && !m.text.toLowerCase().includes("identifik")),
          ...continuation,
        ]);
        chat.turn.current = 1;
        clearConversation();
      }
    } else if (authTarget) choose(authTarget, false, true);
    else if (category) choose(category, false, true);
  };
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(historyStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.conversations)) setConversations(parsed.conversations.filter((row: SavedConversation) => row && typeof row.id === "string" && (row.category === "chat" || row.category === "customs" || row.category === "gambling") && Array.isArray(row.messages)).map((row: SavedConversation) => ({ ...row, cancelled: row.cancelled === true })));
        if (Array.isArray(parsed.outbox)) setOutbox(parsed.outbox.filter((row: SavedLetter) => row && typeof row.tema === "string").map((row: SavedLetter) => ({ ...row, id: typeof row.id === "string" ? row.id : crypto.randomUUID(), cancelled: row.cancelled === true })));
      }
    } catch { /* An unavailable or expired browser session starts empty. */ }
    setHistoryLoaded(true);
  }, []);
  useEffect(() => {
    const id = activeConversation.current;
    if (!historyLoaded || !id || !chat.messages.some((m) => m.from === "user")) return;
    const row: SavedConversation = { id, category: topic.current === "customs" ? "customs" : topic.current === "gambling" ? "gambling" : "chat", messages: chat.messages, date: new Date().toISOString() };
    setConversations((rows) => rows.some((item) => item.id === id) ? rows.map((item) => item.id === id ? { ...row, date: item.date, cancelled: item.cancelled } : item) : [...rows, row]);
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
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const submit = (s: Summary) => {
    setOutbox((rows) => [...rows, { ...s, id: crypto.randomUUID(), date: new Date().toISOString() }]);
    setAssistantReply(null);
    const domain: AssistantDomain = /muit/i.test(`${s.kategorija} ${s.tema} ${s.teksts}`) ? "customs" : /azart|izlož|izloz/i.test(`${s.kategorija} ${s.tema} ${s.teksts}`) ? "gambling" : "tax";
    askAssistant({ data: { history: [{ role: "user", content: s.teksts }], domain } })
      .then(({ text }) => setAssistantReply(usableAssistantAnswer(text)))
      .catch(() => setAssistantReply(null));
    if (previousSteps.current.length) {
      setNotice(s);
      goBack();
    } else setSent(s);
  };
  const cancelLetter = (id: string) => setOutbox((rows) => rows.map((row) => row.id === id ? { ...row, cancelled: true } : row));
  const cancelConversation = (id: string) => setConversations((rows) => rows.map((row) => row.id === id ? { ...row, cancelled: true } : row));
  const opened = !signedIn || (tab === TABS[4] && (sent !== null || cat !== null));
  const blockTitle = !signedIn
    ? "Pieslēgties EDS"
    : sent
      ? "Ziņa nosūtīta"
      : cat === "doc" || cat === "gambling-doc"
        ? "Iesniegt dokumentu vai rakstīt speciālistam"
        : cat === "history"
          ? "Sarakstes vēsture"
          : cat === "customs"
            ? "Saziņa par muitas jautājumiem"
            : cat === "gambling"
              ? "Saziņa par azartspēļu un izložu jautājumiem"
              : "Saziņa ar VID par nodokļu jomas jautājumiem";
  return (
    <div className="eds-shell flex min-h-screen bg-background pt-12">
      <ViewSwitch onReset={reset} />
      <aside
        className={`${mobileMenu ? "fixed bottom-0 left-0 top-12 z-30 block" : "hidden"} eds-sidebar w-[177px] shrink-0 bg-sidebar md:block`}
      >
        <div className="flex h-[100px] flex-col items-center justify-center text-center text-sidebar-foreground">
          <img src={vidCrestMark} alt="Latvijas valsts ģerbonis" className="eds-crest mb-1 h-[55px] w-[55px] object-contain" />
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
          {!opened && notice && (
            <SentResult
              summary={notice}
              reply={assistantReply}
              onHistory={() => choose("history")}
              actions={
                <>
                  <Button variant="outline" onClick={() => { setNotice(null); setAssistantReply(null); }}>Aizvērt</Button>
                  <Button variant="outline" onClick={() => { setNotice(null); setAssistantReply(null); rememberStep(); setTab("Nosūtne"); }}>Skatīt nosūtnē</Button>
                </>
              }
            />
          )}
          {signedIn && (tab !== TABS[4] ? (
            <>
              <input aria-label="Meklēt vēstulēs" placeholder="Meklēt..." value={mailSearch} onChange={(e) => setMailSearch(e.target.value)} className="input-vid mb-[7px] ml-[15px] h-[26px] w-[192px] rounded-none px-2 py-0 text-[10px]" />
              {tab === "Nosūtne" && outbox.some((s) => `${s.tema} ${s.teksts}`.toLowerCase().includes(mailSearch.toLowerCase())) ? (
                <div className="space-y-2 px-[15px]">
                  {outbox.filter((s) => `${s.tema} ${s.teksts}`.toLowerCase().includes(mailSearch.toLowerCase())).map((s) => (
                    <div key={s.id} className="border-b border-border py-3">
                      <p className="text-sm font-bold text-primary">{s.tema}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.struktura} · {s.cancelled ? "Ziņojums atcelts" : "Nosūtīts prototipā"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{s.teksts}</p>
                      {!s.cancelled && <Button variant="outline" size="sm" className="mt-3" onClick={() => cancelLetter(s.id)}>Atcelt ziņojumu</Button>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="border-y border-border pl-[15px] text-[10px] leading-[15px] text-foreground">Nav atrasts neviens ziņojums</p>
              )}
            </>
          ) : (
            <CommunicationChoices onChoose={choose} />
          ))}
        </main>
        {opened && (
          <div className="fixed bottom-0 left-0 right-0 top-12 z-40 flex flex-col bg-background">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
              <h2 className="text-base font-bold text-primary">{blockTitle}</h2>
              <Button variant="outline" onClick={goBack}><X size={16} /> Aizvērt</Button>
            </div>
            <div className={`min-h-0 flex-1 ${signedIn && !sent && (cat === "chat" || cat === "customs" || cat === "gambling") ? "flex flex-col" : "overflow-auto"}`}>
              {!signedIn ? (
                <section className="mx-auto mt-8 max-w-[430px] border border-border bg-card p-6" aria-labelledby="eds-login-title">
                  <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-secondary text-primary"><LockKeyhole size={20} /></span><div><h2 id="eds-login-title" className="text-base font-bold text-primary">Pieslēgties EDS</h2><p className="text-xs text-muted-foreground">Droša identificēšanās sarunas turpināšanai</p></div></div>
                  <p className="mb-5 text-sm leading-6">{no === "toms" ? "Pēc pieslēgšanās turpināsiet iesākto sarunu ar VID virtuālo asistentu." : point ? `Pēc pieslēgšanās varēsiet rakstīt: ${point}.` : "Pēc pieslēgšanās varēsiet rakstīt VID speciālistam."}</p>
                  <Button className="w-full" onClick={continueConversation}>Pieslēgties EDS</Button>
                  <p className="mt-3 text-center text-[10px] text-muted-foreground">Pieslēgšanās šajā prototipā tiek demonstrēta.</p>
                </section>
              ) : sent ? (
                <div className="mx-auto max-w-3xl px-4 py-6">
                  <SentResult summary={sent} reply={assistantReply} onHistory={() => choose("history")} actions={<Button variant="outline" onClick={goBack}>Atgriezties</Button>} />
                </div>
              ) : cat === "history" ? (
                <div className="mx-auto max-w-3xl px-4 py-6"><CorrespondenceHistory outbox={outbox} conversations={conversations} onResume={resumeConversation} onCancelLetter={cancelLetter} onCancelConversation={cancelConversation} /></div>
              ) : cat === "doc" || cat === "gambling-doc" ? (
                <div className="mx-auto max-w-3xl px-4 py-6">
                  <DocForm onSent={submit} onCancel={goBack} {...(point ? { recipient: point } : cat === "gambling-doc" ? { recipient: "VID azartspēļu un izložu jomas speciālists", documentType: "Azartspēļu un izložu jautājums" } : {})} />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-border bg-chat-header px-4 py-3">
                      {cat !== "customs" && cat !== "gambling" && <TomsAvatar size={30} virtualAssistant />}
                      <div>
                        <h3 className="text-sm font-bold text-primary">Virtuālais asistents</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="online-dot" />
                          {cat === "customs" ? "Muitas jautājumi" : cat === "gambling" ? "Azartspēļu un izložu jautājumi" : "Nodokļu jomas jautājumi"}
                        </p>
                      </div>
                    </div>
                    <TomsChat
                      hideAvatar={cat === "customs" || cat === "gambling"}
                      sidePanel
                      virtualAssistant
                      messages={chat.messages}
                      onSend={chat.send}
                      busy={chat.busy}
                      onSubmitSummary={submit}
                      suggestions={
                        cat === "customs"
                          ? ["Pasta sūtījumi", "Muitas jautājumi", "Rakstu uz muitas punktu"]
                          : cat === "gambling"
                            ? ["Azartspēļu organizēšana", "Izložu atļauja"]
                            : ["Gada ienākumu deklarācija", "Kāds man ir parāds?", "Darbības EDS", "Nepiekrītu aprēķinātajam parādam"]
                      }
                    />
                  </section>
                  <section className="shrink-0 border-t border-border bg-card px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {cat === "gambling" ? (
                        <Button variant="outline" size="sm" className="h-auto whitespace-normal border-primary text-primary" onClick={() => choose("gambling-doc")}>Rakstīt speciālistam</Button>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" className="h-auto whitespace-normal border-primary text-primary" onClick={() => choose(cat === "customs" ? "chat" : "customs")}>
                            {cat === "customs" ? "Rakstīt par nodokļu jautājumu" : "Rakstīt par muitas jautājumu"}
                          </Button>
                          <Button variant="outline" size="sm" className="h-auto whitespace-normal border-primary text-primary" onClick={() => choose("doc")}>Iesniegt dokumentu vai rakstīt speciālistam</Button>
                        </>
                      )}
                    </div>
                    {cat === "customs" && <div className="mt-3 max-h-48 overflow-auto"><CustomsPoints /></div>}
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
        <footer className="eds-footer min-h-[84px] shrink-0 bg-secondary px-[15px] py-3 text-[10px] text-primary">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <a href="tel:67120000" className="flex items-center gap-1 font-bold"><Phone size={15} fill="currentColor" />67120000</a>
            {["Lietošanas noteikumi", "Personas datu apstrāde VID", "Sīkdatņu izmantošanas politika"].map((label) => <span key={label} className="flex items-center gap-1 font-bold underline"><UserRoundPen size={17} fill="currentColor" />{label}</span>)}
            <img src={fundingImage} alt="Nacionālais attīstības plāns 2020 un Eiropas Savienības Eiropas Reģionālās attīstības fonds — Ieguldījums tavā nākotnē" className="h-[50px] w-[222px] object-contain" />
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
function HistoryDate({ date }: { date?: string | undefined }) {
  if (!date || Number.isNaN(Date.parse(date))) return <p className="mb-1 text-xs text-muted-foreground">Datums nav saglabāts</p>;
  return <time dateTime={date} className="mb-1 block text-xs text-muted-foreground">{new Date(date).toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Riga" })}</time>;
}
function CorrespondenceHistory({ outbox, conversations, onResume, onCancelLetter, onCancelConversation }: { outbox: SavedLetter[]; conversations: SavedConversation[]; onResume: (row: SavedConversation) => void; onCancelLetter: (id: string) => void; onCancelConversation: (id: string) => void }) {
  return <section aria-labelledby="history-title">
    <h3 id="history-title" className="mb-1 text-base font-bold text-primary">Sarakstes vēsture</h3>
    <p className="mb-3 text-xs text-muted-foreground">Sarunas un speciālistam pārsūtītās vēstules. Ziņojumu var atcelt ar pogu pie ieraksta.</p>
    <div className="mb-5 flex flex-wrap gap-2 text-xs font-bold text-primary-foreground">
      <span className="rounded bg-primary px-2 py-1">Parastos gadījumos — 10 darba dienas</span>
      <span className="rounded bg-primary px-2 py-1">Sarežģītos gadījumos — līdz vienam mēnesim</span>
    </div>
    <div className="divide-y divide-border border-y border-border">
      {conversations.map((row) => <article key={row.id} className="py-4">
        <HistoryDate date={row.date} />
        <h4 className="text-sm font-bold text-primary">{row.messages.find((m) => m.from === "user")?.text}</h4>
        <details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">Saruna ar virtuālo asistentu</summary>
          <div className="mt-3 space-y-3">{row.messages.filter((m) => m.from !== "system").map((m, i) => <div key={i}><p className="text-xs font-bold text-primary">{m.from === "user" ? "Jūs" : "Virtuālais asistents"}</p><p className="mt-1 whitespace-pre-wrap text-sm">{m.text}</p></div>)}</div>
        </details>
        {row.cancelled ? <p className="mt-3 text-sm font-bold text-primary">Ziņojums atcelts</p> : <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => onResume(row)}>Turpināt saraksti</Button><Button variant="outline" size="sm" onClick={() => onCancelConversation(row.id)}>Atcelt ziņojumu</Button></div>}
      </article>)}
      {outbox.map((item) => <article key={item.id} className="py-4">
        <HistoryDate date={item.date} />
        <h4 className="text-sm font-bold text-primary">{item.tema}</h4>
        <p className="mt-1 text-xs text-muted-foreground">Speciālistam pārsūtīta vēstule · {item.struktura}{item.cancelled ? " · Ziņojums atcelts" : ""}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm">{item.teksts}</p>
        {!item.cancelled && <Button variant="outline" size="sm" className="mt-3" onClick={() => onCancelLetter(item.id)}>Atcelt ziņojumu</Button>}
      </article>)}
      {!conversations.length && !outbox.length && <p className="py-4 text-sm text-muted-foreground">Nav sarunu vai speciālistam pārsūtītu vēstuļu.</p>}
    </div>
  </section>;
}

function VidLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">{children}</a>;
}

function SentResult({ summary, reply, actions, onHistory }: { summary: Summary; reply: string | null; actions: ReactNode; onHistory: () => void }) {
  const context = `${summary.tema}\n${summary.teksts} ${summary.kategorija}`;
  const notice = submittedFormNotice(context);
  const form = matchStructuredForm(context);
  const wageBook = form?.subtype.includes("algas nodokļa grāmatiņas");
  const debt = /parād|parad/i.test(context);
  const customs = /muit|sūtījum|paka/i.test(context);
  return (
    <section role="status" className="mb-5 border border-border bg-card p-4">
      <CheckCircle2 className="mb-3 text-chat-primary" />
      <h3 className="text-lg font-bold text-primary">Paldies! Jūsu ziņa ir nodota speciālistam.</h3>
      {reply && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{reply}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1 rounded-md border-2 border-primary px-4 py-3">
          <p className="text-sm font-bold text-primary">Parastais atbildes termiņš</p>
          <p className="mt-1 text-lg font-bold">10 darba dienas</p>
        </div>
        <div className="min-w-[220px] flex-1 rounded-md border-2 border-primary px-4 py-3">
          <p className="text-sm font-bold text-primary">Atbildes termiņš sarežģītos gadījumos</p>
          <p className="mt-1 text-lg font-bold">1 mēnesis</p>
        </div>
      </div>
      <p className="mt-4 rounded-md border border-border bg-secondary px-4 py-3 text-sm leading-6">Ja vēlaties atsaukt savu ziņojumu, varat to izdarīt sadaļā <button type="button" className="font-bold text-primary underline" onClick={onHistory}>Sarakstes vēsture</button>.</p>
      {notice && <p className="mt-4 rounded-md border-2 border-primary bg-warning-surface px-4 py-3 text-sm font-semibold leading-6 text-primary">{notice}</p>}
      <div className="mt-5">
        <h4 className="text-sm font-bold uppercase tracking-wide text-primary">Ieteikumi</h4>
        <p className="mt-2 text-sm leading-6">Daudzas darbības varat izdarīt paši — sameklēt skaidrojumu, iesniegt veidlapu vai izgūt izziņu.</p>
        <h5 className="mb-2 mt-4 text-sm font-bold">Kā atrast informāciju</h5>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Atveriet <VidLink href="https://www.vid.gov.lv/lv">www.vid.gov.lv</VidLink> un meklētājā ierakstiet tēmu.</li>
          <li>Saziņas veidi un darba laiks ir sadaļā <VidLink href="https://www.vid.gov.lv/lv/klientu-apkalposana">Klientu apkalpošana</VidLink>.</li>
          {customs && <li>Muitas kontroles punkti un darba laiks: <VidLink href="https://www.vid.gov.lv/lv/muitas-kontroles-un-robezkontroles-punkti">Muitas kontroles un robežkontroles punkti</VidLink>.</li>}
          {debt && <li>Publiski pieejamā informācija par parādiem virs 150 euro: <VidLink href="https://www.vid.gov.lv/lv/nodoklu-paradnieki">Nodokļu parādnieki</VidLink>. Savu parādu skatiet pēc pieslēgšanās EDS.</li>}
          {wageBook && <li>Skaidrojums: <VidLink href="https://www.vid.gov.lv/lv/algas-nodokla-gramatina">Algas nodokļa grāmatiņa</VidLink>.</li>}
        </ol>
        <h5 className="mb-2 mt-4 text-sm font-bold">Kā iesniegt veidlapu</h5>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Pieslēdzieties <VidLink href="https://eds.vid.gov.lv/login/">EDS</VidLink>. Ja EDS vēl nelietojat, skatiet <VidLink href="https://eds.vid.gov.lv/helpnewuser/">kā kļūt par EDS lietotāju</VidLink>.</li>
          {form && !wageBook && <li>EDS veidlapas nosaukums: <span className="font-bold">“{form.subtype}”</span> (dokumenta veids: {form.type}).</li>}
          <li>Sadaļā <span className="font-bold">Uz sākumu</span> nospiediet <span className="font-bold">Sagatavot dokumentu</span> un pēc tam <span className="font-bold">No veidlapas</span>. Tā pati izvēle ir sadaļā <span className="font-bold">Dokumenti</span>.</li>
          <li>Atveriet veidlapu, aizpildiet laukus ar *, nospiediet <span className="font-bold">Pārbaudīt un saglabāt</span> un pēc tam <span className="font-bold">Iesniegt</span>.</li>
          <li>Statusu skatiet sadaļā <span className="font-bold">Dokumenti</span>: Gatavs iesniegšanai, Iesniegts vai Pieņemts.</li>
          <li>Sīkāk: <VidLink href="https://www.vid.gov.lv/lv/media/1103/download?attachment=">Kā veidot un iesniegt dokumentus EDS</VidLink> un <VidLink href="https://www.vid.gov.lv/lv/elektroniskas-deklaresanas-sistema">Elektroniskās deklarēšanas sistēma</VidLink>.</li>
        </ol>
        {wageBook && (
          <>
            <h5 className="mb-2 mt-4 text-sm font-bold">Algas nodokļa grāmatiņa</h5>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
              <li>Pieslēdzieties <VidLink href="https://eds.vid.gov.lv/login/">EDS</VidLink>.</li>
              <li>Atveriet sadaļu <span className="font-bold">Algas nodokļa grāmatiņa</span>.</li>
              <li>Nospiediet <span className="font-bold">Atvērt</span> un pēc tam <span className="font-bold">Saņemt algas nodokļa grāmatiņu</span>.</li>
              <li>Pēc piešķiršanas grāmatiņu apskatiet tajā pašā sadaļā. Skaidrojums: <VidLink href="https://www.vid.gov.lv/lv/algas-nodokla-gramatina">www.vid.gov.lv/lv/algas-nodokla-gramatina</VidLink>.</li>
            </ol>
          </>
        )}
        <h5 className="mb-2 mt-4 text-sm font-bold">Kā izgūt izziņu</h5>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Pieslēdzieties <VidLink href="https://eds.vid.gov.lv/login/">EDS</VidLink>.</li>
          <li>Atveriet sadaļu <span className="font-bold">Izziņas</span>.</li>
          <li>Nospiediet <span className="font-bold">Sagatavot jaunu izziņu</span> un izvēlieties vajadzīgo izziņu, piemēram, par nodokļu parādiem vai nodokļu nomaksas stāvokli.</li>
          <li>Norādiet datumu, pārbaudiet datus un nospiediet <span className="font-bold">Saglabāt izziņu</span>. PDF saglabājat ar <span className="font-bold">Lejupielādēt izziņas failu</span>.</li>
          <li>Iepriekš pieprasītās izziņas paliek sadaļas <span className="font-bold">Izziņas</span> sarakstā. Sīkāk: <VidLink href="https://www.vid.gov.lv/lv/media/1089/download?attachment=">Kā lietot EDS sadaļu “Izziņas”</VidLink>.</li>
        </ol>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
    </section>
  );
}

function DocForm({ onSent, onCancel, recipient, documentType }: { onSent: (s: Summary) => void; onCancel: () => void; recipient?: string; documentType?: string }) {
  const [type, setType] = useState(documentType ?? (recipient ? "Muitas jautājums" : ""));
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
