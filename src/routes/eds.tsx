import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TomsAvatar, TomsChat, useScriptedChat } from "@/components/TomsChat";
import { clearConversation, edsReply, loadConversation, type Summary } from "@/lib/toms";

export const Route = createFileRoute("/eds")({
  validateSearch: (s: Record<string, unknown>): { no?: string | undefined } => ({ no: typeof s["no"] === "string" ? (s["no"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "EDS Sarakste ar VID — jaunā pieeja (prototips)" },
      { name: "description", content: "Prototips: vienkāršotas pamatkategorijas un čatbots Toms EDS sadaļā Sarakste ar VID." },
      { property: "og:title", content: "EDS Sarakste ar VID — jaunā pieeja" },
      { property: "og:description", content: "Klients izvēlas pamatkategoriju, Toms pats nosaka tēmu un adresātu." },
    ],
  }),
  component: EdsPage,
});

type Cat = "chat" | "doc" | "customs" | "status" | null;
const CATS: { id: Exclude<Cat, null>; title: string; desc: string; ai: boolean }[] = [
  { id: "chat", title: "Sarakstīties ar VID", desc: "Uzdodiet jautājumu – Toms noteiks tēmu un nodos speciālistam.", ai: true },
  { id: "doc", title: "Iesniegt dokumentu", desc: "Pievienojiet dokumentu vai pielikumus. Bez MI.", ai: false },
  { id: "customs", title: "Par muitas jautājumiem", desc: "Sūtījumi, imports, eksports, muitas deklarācijas.", ai: true },
  { id: "status", title: "Mani iesniegumi", desc: "Sekot iesnieguma statusam un atbildēm.", ai: false },
];
const MENU = ["Uz sākumu", "Dokumenti", "Atgādinājumi", "Sarakste ar VID", "Maksājumi", "Citas sistēmas", "Pārskati", "Izziņas", "E-rēķini", "Reģistri", "Iestatījumi", "Noderīgi", "Beigt darbu"];

function EdsPage() {
  const { no } = Route.useSearch();
  const [tab, setTab] = useState("Jauns iesniegums");
  const [cat, setCat] = useState<Cat>(null);
  const [sent, setSent] = useState<Summary | null>(null);
  const chat = useScriptedChat([], edsReply);

  useEffect(() => {
    if (no === "toms") {
      const prev = loadConversation();
      if (prev) {
        const lastUser = [...prev].reverse().find((m) => m.from === "user")?.text ?? "";
        chat.setMessages([
          ...prev.filter((m) => m.action !== "auth"),
          { from: "system", text: "Klients autentificējies EDS · saruna turpinās" },
        ]);
        setCat("chat");
        setTimeout(() => {
          chat.setMessages((m) => [...m, ...edsReply(lastUser, chat.turn.current++)]);
        }, 900);
        clearConversation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no]);

  const choose = (c: Exclude<Cat, null>) => {
    setCat(c);
    setSent(null);
    if (c === "chat") chat.setMessages([{ from: "toms", text: "Labdien, Irina! Aprakstiet savu jautājumu brīvā formā – kategoriju un tēmu noteikšu es." }]);
    if (c === "customs") chat.setMessages([{ from: "toms", text: "Labdien! Pastāstiet par savu muitas jautājumu – piemēram, sūtījumu, importu vai deklarāciju." }]);
    chat.turn.current = 0;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[240px] shrink-0 border-r border-border bg-card md:block">
        <div className="flex flex-col items-center gap-2 py-6 text-sm">
          <div className="crest">LV</div>Valsts ieņēmumu dienests
        </div>
        <div className="bg-secondary px-6 py-5 text-center text-xs uppercase leading-5 text-secondary-foreground">Elektroniskās deklarēšanas sistēma</div>
        <nav className="py-2">
          {MENU.map((m) => (
            <div key={m} className={`eds-menu ${m === "Sarakste ar VID" ? "eds-menu-active" : ""} ${m === "Atgādinājumi" ? "text-accent-orange" : ""}`}>
              {m.toUpperCase()}
              {m === "Dokumenti" && <span className="badge-count">3</span>}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <div className="bg-primary px-6 py-4 text-xl text-primary-foreground">SARAKSTE AR VID</div>
        <div className="space-y-5 p-6">
          <div className="flex items-center gap-3 text-sm">
            <span>Jūsu saziņas e-pasts</span>
            <span className="input-vid w-60 bg-muted">pliada@inbox.lv</span>
            <button className="btn-vid-outline">Labot</button>
            <Link to="/" className="ml-auto text-xs underline text-primary">← Uz vid.gov.lv (Toms)</Link>
          </div>

          <div className="flex border-b border-border text-sm">
            {["Nelasītie", "Iesūtne", "Nosūtne", "Sagatavotie", "Jauns iesniegums"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={tab === t ? "eds-tab-active" : "eds-tab"}>{t}</button>
            ))}
          </div>

          {tab !== "Jauns iesniegums" ? (
            <p className="text-sm text-muted-foreground">Sadaļa „{tab}” prototipā nav mainīta.</p>
          ) : sent ? (
            <div className="border border-border bg-card p-6">
              <div className="text-lg font-bold text-primary">Iesniegums nosūtīts</div>
              <p className="mt-2 text-sm">Reģ. nr. VID-2026-104582 · {sent.struktura}</p>
              <p className="text-sm">Tēma: {sent.tema}</p>
              <p className="mt-2 text-sm text-muted-foreground">Atbildi saņemsiet sadaļā „Iesūtne” un uz e-pastu pliada@inbox.lv.</p>
              <button className="btn-vid mt-4" onClick={() => { setCat(null); setSent(null); }}>Jauns iesniegums</button>
            </div>
          ) : (
            <>
              <div>
                <div className="mb-3 text-sm font-bold">Ko vēlaties darīt?</div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {CATS.map((c) => (
                    <button key={c.id} onClick={() => choose(c.id)} className={`cat-card ${cat === c.id ? "cat-card-active" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-primary">{c.title}</span>
                        {c.ai && <span className="tag-ai">Toms</span>}
                      </div>
                      <span className="mt-2 block text-xs text-muted-foreground">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(cat === "chat" || cat === "customs") && (
                <div className="border border-border">
                  <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                    <TomsAvatar />
                    <div><div className="font-bold">Toms</div><div className="text-xs text-muted-foreground">Nosaka tēmu un adresātu · iesniegumu nosūta VID speciālistam</div></div>
                  </div>
                  <TomsChat
                    messages={chat.messages}
                    onSend={chat.send}
                    onSubmitSummary={setSent}
                    suggestions={cat === "customs" ? ["Mana paka no Ķīnas aizturēta muitā"] : ["Vēlos sadalīt nodokļu parādu termiņos", "Kad atmaksās manu pārmaksu?"]}
                  />
                </div>
              )}

              {cat === "doc" && <DocForm onSent={() => setSent({ kategorija: "Dokumenta iesniegšana", tema: "Dokuments", struktura: "Dokumentu pārvaldības nodaļa", teksts: "" })} />}

              {cat === "status" && (
                <table className="w-full border border-border bg-card text-sm">
                  <thead className="bg-muted text-left"><tr><th className="p-2">Datums</th><th className="p-2">Tēma</th><th className="p-2">Statuss</th></tr></thead>
                  <tbody>
                    <tr className="border-t border-border"><td className="p-2">12.09.2026</td><td className="p-2">Nodokļa pārmaksas atmaksa</td><td className="p-2">Izskatīšanā</td></tr>
                    <tr className="border-t border-border"><td className="p-2">02.08.2026</td><td className="p-2">Pasta sūtījuma muitošana</td><td className="p-2">Atbildēts</td></tr>
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DocForm({ onSent }: { onSent: () => void }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm">Dokumenta veids<span className="text-destructive">*</span>
        <select className="input-vid mt-1 w-full"><option>Iesniegums</option><option>Paskaidrojums</option><option>Pilnvara</option><option>Cits dokuments</option></select>
      </label>
      <label className="block text-sm">Īss apraksts
        <input className="input-vid mt-1 w-full" />
      </label>
      <label className="block text-sm">Pielikumi<span className="text-destructive">*</span>
        <input type="file" className="input-vid mt-1 block w-96" />
      </label>
      <p className="text-xs leading-5">Atļautie failu formāti: ODT, ODS, DOCX, XLSX, PDF, JPG, JPEG, TIF, TIFF, PNG, EDOC, ASICE, HEIC, XHTML, ZIP<br />Maksimāli pieļaujamais viena faila izmērs: 20 MB</p>
      <div className="flex gap-2"><button className="btn-vid" onClick={onSent}>Nosūtīt</button><button className="btn-vid-outline">Atcelt</button></div>
    </div>
  );
}
