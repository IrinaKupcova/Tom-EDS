import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Menu, Star } from "lucide-react";
import { TomsAvatar, TomsChat, useScriptedChat } from "@/components/TomsChat";
import { CommunicationChoices, ViewSwitch, type CommunicationCategory } from "@/components/CommunicationChoices";
import { Button } from "@/components/ui/button";
import { clearConversation, detectTopic, edsReply, loadConversation, type Summary } from "@/lib/toms";

export const Route = createFileRoute("/eds")({
  validateSearch: (s: Record<string, unknown>): { no?: string; category?: CommunicationCategory } => ({ no: typeof s.no === "string" ? s.no : undefined, category: s.category === "chat" || s.category === "doc" || s.category === "customs" ? s.category : undefined }),
  head: () => ({ meta: [
    { title: "EDS — Sarakste ar VID | Toms" },
    { name: "description", content: "EDS saziņas prototips: nodokļu un muitas jautājumi ar Tomu, dokumenta iesniegšana vai saziņa ar speciālistu." },
    { property: "og:title", content: "EDS — Sarakste ar VID | Toms" },
    { property: "og:description", content: "Vienkāršota saziņa ar VID EDS vidē." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EdsPage,
});
const MENU = ["Uz sākumu", "Dokumenti", "Atgādinājumi", "Sarakste ar VID", "Maksājumi", "Citas sistēmas", "Pārskati", "Izziņas", "E-rēķini", "Reģistri", "Iestatījumi", "Noderīgi", "Beigt darbu"];
const TABS = ["Nelasītie", "Iesūtne", "Nosūtne", "Sagatavotie", "Rakstīt jaunu vēstuli"];
const greetings = {
  chat: "Labdien! Esmu Toms. Varu uzreiz atbildēt uz vienkāršu jautājumu, izskaidrot darbības EDS vai palīdzēt noformulēt ziņu VID speciālistam. Par ko vēlaties jautāt?",
  customs: "Labdien! Palīdzēšu atrast atbildi vai nosūtīt ziņu tieši atbildīgajai muitas struktūrvienībai.",
};
function EdsPage() {
  const { no, category } = Route.useSearch();
  const [tab, setTab] = useState(TABS[4]);
  const [cat, setCat] = useState<CommunicationCategory | null>(null);
  const [sent, setSent] = useState<Summary | null>(null);
  const [outbox, setOutbox] = useState<Summary[]>([]);
  const [email, setEmail] = useState("jberzins@example.lv");
  const [editingEmail, setEditingEmail] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const requestText = useRef("");
  const topic = useRef<CommunicationCategory>("chat");
  const chat = useScriptedChat([], (text, turn) => {
    requestText.current = [requestText.current, text].filter(Boolean).join("\n");
    const combined = topic.current === "customs" ? `Muitas jautājums: ${requestText.current}` : requestText.current;
    return edsReply(combined, turn);
  });
  const choose = (c: CommunicationCategory) => {
    setTab(TABS[4]); setCat(c); setSent(null); requestText.current = ""; topic.current = c;
    chat.reset(c === "doc" ? [] : [{ from: "toms", text: greetings[c] }]);
  };
  useEffect(() => {
    if (no === "toms") {
      const previous = loadConversation();
      if (previous) {
        const lastUser = [...previous].reverse().find(m => m.from === "user")?.text ?? "";
        const c = detectTopic(lastUser).kategorija === "Muitas jautājumi" ? "customs" : "chat";
        topic.current = c; requestText.current = lastUser; setCat(c);
        chat.reset([...previous.filter(m => m.action !== "auth"), { from: "system", text: "Identifikācija demonstrēta · saruna turpinās EDS" }, ...edsReply(lastUser, 0)]);
        chat.turn.current = 1; clearConversation();
      }
    } else if (category) choose(category);
    // Search changes are entry points, not changes to the active conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no, category]);
  const reset = () => { setCat(null); setSent(null); setTab(TABS[4]); chat.reset(); clearConversation(); requestText.current = ""; };
  const submit = (s: Summary) => { setSent(s); setOutbox(rows => [...rows, s]); };
  return <div className="flex min-h-screen bg-background">
    <aside className={`${mobileMenu ? "fixed inset-y-0 left-0 z-30 block shadow-[var(--shadow-panel)]" : "hidden"} w-[181px] shrink-0 bg-sidebar md:block`}>
      <div className="flex flex-col items-center px-3 pb-4 pt-4 text-center text-sidebar-foreground">
        <div className="mb-2 grid size-9 place-items-center rounded bg-sidebar-active text-sidebar-muted"><Star size={22} fill="currentColor" /></div>
        <div className="w-full border-b border-sidebar-muted/20 pb-1 text-[11px] font-bold">Valsts ieņēmumu dienests</div>
        <div className="mt-2 text-[10px] leading-3 text-sidebar-muted">ELEKTRONISKĀS<br />DEKLARĒŠANAS SISTĒMA</div>
      </div>
      <nav aria-label="EDS izvēlne">{MENU.map(m => <div key={m} className={`eds-menu ${m === "Sarakste ar VID" ? "eds-menu-active" : ""} ${m === "Atgādinājumi" ? "!text-accent-orange" : ""}`}>
        <span>{m.toUpperCase()}</span>{m === "Dokumenti" && <span className="grid size-[19px] place-items-center rounded-full bg-destructive text-[10px] text-destructive-foreground">3</span>}{["Citas sistēmas", "Iestatījumi", "Noderīgi"].includes(m) && <ChevronRight size={12} />}
      </div>)}</nav>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex h-12 items-center gap-3 bg-primary px-[22px] text-primary-foreground"><Button size="icon-sm" variant="ghost" className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label="EDS izvēlne"><Menu /></Button><h1 className="text-sm font-bold">SARAKSTE AR VID</h1></header>
      <form onSubmit={e => { e.preventDefault(); setEditingEmail(false); }} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-[22px] py-2 sm:flex sm:gap-3">
        <label htmlFor="contact-email" className="text-sm text-muted-foreground">Jūsu saziņas e-pasts</label>
        <input id="contact-email" type="email" required value={email} readOnly={!editingEmail} onChange={e => setEmail(e.target.value)} className="input-vid order-3 h-6 w-full min-w-0 bg-chat-surface py-0 sm:order-none sm:w-[196px]" />
        <Button variant="outline" size="sm" type={editingEmail ? "submit" : "button"} onClick={() => { if (!editingEmail) setEditingEmail(true); }} className="h-6 px-3 text-primary">{editingEmail ? "Saglabāt" : "Labot"}</Button>
      </form>
      <nav aria-label="Sarakstes sadaļas" className="flex overflow-x-auto border-b border-border px-[22px]">{TABS.map(t => <Button key={t} variant="ghost" onClick={() => setTab(t)} className={`h-auto rounded-none ${tab === t ? "eds-tab-active" : "eds-tab"}`}>{t}</Button>)}</nav>
      <main className="max-w-[719px] px-[22px] pb-24 pt-7">
        {tab !== TABS[4] ? <><h2 className="mb-5 text-sm font-bold text-primary">{tab}</h2>{tab === "Nosūtne" && outbox.length ? <div className="space-y-2">{outbox.map((s, i) => <div key={i} className="border-b border-border py-3"><p className="text-sm font-bold text-primary">{s.tema}</p><p className="mt-1 text-xs text-muted-foreground">{s.struktura} · Nosūtīts prototipā</p><p className="mt-2 whitespace-pre-wrap text-sm">{s.teksts}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Nav vēstuļu.</p>}</> : <>
          <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h2 className="text-sm font-bold text-primary">Jauna sarakste</h2>{(cat || sent) && <Button variant="link" size="sm" onClick={reset} className="h-auto p-0 text-xs text-muted-foreground"><ArrowLeft size={12} />Sākt no jauna</Button>}</div>
          {sent ? <section role="status" className="border-t border-border py-5"><CheckCircle2 className="mb-3 text-chat-primary" /><h3 className="text-lg font-bold text-primary">Iesniegums sagatavots un nosūtīts prototipā</h3><p className="mt-3 text-sm">Tēma: {sent.tema}</p><p className="mt-1 text-sm">Adresāts: {sent.struktura}</p><p className="mt-3 text-xs text-muted-foreground">Šī ir demonstrācija — VID iesniegumu nesaņem.</p><Button variant="outline" className="mt-4" onClick={() => setTab("Nosūtne")}>Skatīt nosūtnē</Button></section> : cat === null ? <CommunicationChoices onChoose={choose} /> : cat === "doc" ? <DocForm onSent={submit} onCancel={reset} /> : <>
            <section className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center gap-3 border-b border-border bg-chat-header px-4 py-3"><TomsAvatar size={30} /><div><h3 className="text-sm font-bold text-primary">Toms</h3><p className="mt-0.5 text-xs text-muted-foreground"><span className="online-dot" />{cat === "customs" ? "Muitas jautājumi" : "Nodokļu jomas jautājumi"}</p></div></div>
              <TomsChat messages={chat.messages} onSend={chat.send} busy={chat.busy} onSubmitSummary={submit} suggestions={cat === "customs" ? ["Pasta sūtījumi", "Muitas jautājumi", "Rakstu uz muitas punktu"] : ["Gada ienākumu deklarācija", "Nodokļu parāds", "Darbības EDS", "Palīdzi noformulēt iesniegumu"]} />
            </section>
            <section className="mt-4 border-t border-border pt-4"><h3 className="mb-3 text-xs font-bold text-primary">Citas saziņas iespējas</h3><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" className="h-auto whitespace-normal border-primary text-primary" onClick={() => choose(cat === "customs" ? "chat" : "customs")}>{cat === "customs" ? "Rakstīt par nodokļu jautājumu" : "Rakstīt par muitas jautājumu"}</Button><Button variant="outline" size="sm" className="h-auto whitespace-normal border-primary text-primary" onClick={() => choose("doc")}>Iesniegt dokumentu vai rakstīt speciālistam</Button></div></section>
          </>}
        </>}
      </main>
    </div>
    <ViewSwitch onReset={reset} />
  </div>;
}
const formats = ["odt", "ods", "docx", "xlsx", "pdf", "jpg", "jpeg", "tif", "tiff", "png", "edoc", "asice", "heic", "xhtml", "zip"];
function DocForm({ onSent, onCancel }: { onSent: (s: Summary) => void; onCancel: () => void }) {
  const [type, setType] = useState(""); const [text, setText] = useState(""); const [error, setError] = useState("");
  return <form onSubmit={e => { e.preventDefault(); if (!type || !text.trim() || error) return; onSent({ kategorija: "Dokumenta iesniegšana", tema: type, struktura: "VID speciālists", teksts: text }); }}>
    <h3 className="text-base font-bold text-primary">Iesniegt dokumentu vai rakstīt speciālistam</h3><p className="mb-4 mt-1 text-xs text-muted-foreground">Aizpildiet paskaidrojumu un, ja nepieciešams, pievienojiet dokumentu.</p>
    <label className="mb-4 block text-sm text-primary">Dokumenta veids<span className="text-destructive">*</span><select required value={type} onChange={e => setType(e.target.value)} className="input-vid mt-1 h-9 w-full"><option value="">— izvēlieties —</option>{["Iesniegums", "Paskaidrojums", "Pilnvara", "Cits dokuments"].map(s => <option key={s}>{s}</option>)}</select></label>
    <label className="mb-5 block text-sm text-primary">Vēstules teksts / paskaidrojums<span className="text-destructive">*</span><textarea required value={text} onChange={e => setText(e.target.value)} placeholder="Aprakstiet savu jautājumu vai sniedziet paskaidrojumu" className="input-vid mt-1 h-[130px] w-full resize-y" /></label>
    <label className="block text-sm text-primary">Pielikumi<input aria-label="Pielikumi" type="file" multiple accept={formats.map(f => `.${f}`).join(",")} className="mt-1 block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border file:border-input file:bg-card file:px-3 file:py-2 file:text-sm file:text-primary" onChange={e => {
      const files = Array.from(e.target.files ?? []); const invalid = files.find(f => !formats.includes(f.name.split(".").pop()?.toLowerCase() ?? ""));
      setError(invalid ? `Neatļauts faila formāts: ${invalid.name}` : files.some(f => f.size > 20 * 1024 * 1024) ? "Viena faila izmērs nedrīkst pārsniegt 20 MB." : files.reduce((sum, f) => sum + f.size, 0) > 50 * 1024 * 1024 ? "Kopējais failu izmērs nedrīkst pārsniegt 50 MB." : "");
    }} /></label>
    <p className="mt-1 text-xs leading-4 text-muted-foreground">Atļautie failu formāti: {formats.join(", ").toUpperCase()}<br />Maksimāli pieļaujamais viena faila izmērs: 20 MB<br />Maksimāli pieļaujamais visu dokumentam pievienoto failu kopējais izmērs: 50 MB</p>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    <div className="mt-4 flex gap-3"><Button type="submit" disabled={!type || !text.trim() || !!error}>Nosūtīt</Button><Button variant="outline" type="button" onClick={onCancel}>Atcelt</Button></div>
    <p className="mt-4 rounded-md border border-accent-orange/50 bg-warning-surface px-3 py-3 text-xs text-warning-text">Šeit iesniegtie dokumenti nonāk VID informācijas sistēmās un tos manuāli apstrādā VID darbinieki.</p>
  </form>;
}
