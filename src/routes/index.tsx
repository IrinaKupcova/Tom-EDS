import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  Building2,
  ChevronDown,
  Globe,
  Mail,
  MapPin,
  Mouse,
  Phone,
  MessageSquareMore,
  FilePlus2,
  Search,
  X,
} from "lucide-react";
import { TomsAvatar, TomsChat, useScriptedChat } from "@/components/TomsChat";
import {
  CommunicationChoices,
  ViewSwitch,
  type CommunicationCategory,
} from "@/components/CommunicationChoices";
import { Button } from "@/components/ui/button";
import { gamblingReply, publicReply, saveConversation, clearConversation } from "@/lib/toms";
import vidCrest from "@/assets/vid-crest.png";
import { CustomsPoints } from "@/components/CustomsPoints";
import { askAssistant } from "@/lib/ai.functions";
import { isGenericReply, toAiHistory } from "@/lib/toms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Valsts ieņēmumu dienests — Saziņa ar VID" },
      {
        name: "description",
        content:
          "VID publiskās vietnes prototips ar virtuālo asistentu Tomu un vienkāršotām saziņas iespējām.",
      },
      { property: "og:title", content: "Valsts ieņēmumu dienests — Saziņa ar VID" },
      {
        property: "og:description",
        content:
          "Saziņa par nodokļu un muitas jautājumiem, dokumenta iesniegšana un sarunas turpināšana EDS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VidPage,
});
const groups = [
  {
    title: "Noderīgi",
    items: [
      "E-rēķini",
      "EDS",
      "Atbalsts azartspēļu spēlētājiem",
      "Pasta sūtījumi",
      "VID vēstules: jautājumi un atbildes",
      "Publiskojamā datu bāze",
      "Pakalpojumi",
    ],
  },
  {
    title: "Iedzīvotājiem",
    items: [
      "Gada ienākumu deklarācija",
      "Algas nodokļa grāmatiņa",
      "Saimnieciskās darbības veicēji",
      "Ienākuma nodoklis no kapitāla pieauguma",
      "Valsts amatpersonām",
      "Pirmie soļi nekustamā īpašuma izīrētājiem",
      "Citi noderīgi jautājumi",
    ],
  },
  {
    title: "Uzņēmējiem",
    items: [
      "Nodokļu maksātāju reitinga sistēma",
      "Pirmie soļi topošajiem uzņēmējiem",
      "Grāmatvedība un strukturētie e-rēķini",
      "Nefinanšu sektora uzraudzība",
      "Licences un atļaujas",
      "Termiņpagarinājumi un nodokļu parādi",
      "Citi noderīgi jautājumi",
    ],
  },
];
function VidPage() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatCategory, setChatCategory] = useState<CommunicationCategory>("chat");
  const [customsView, setCustomsView] = useState<"choices" | "assistant" | "points">("choices");
  const [gamblingView, setGamblingView] = useState<"choices" | "assistant">("choices");
  const navigate = useNavigate();
  const categoryRef = useRef<CommunicationCategory>("chat");
  categoryRef.current = chatCategory;
  const chat = useScriptedChat(
    [{ from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" }],
    async (text, _turn, history) => {
      if (categoryRef.current === "gambling") return gamblingReply(text, history);
      const r = publicReply(text, history);
      if (!isGenericReply(r) || /darba laik|klientu apkalp/i.test(text)) return r;
      try {
        const { text: answer } = await askAssistant({ data: { history: toAiHistory(history), domain: categoryRef.current === "customs" ? "customs" : "tax" } });
        return [{ from: "toms", text: answer }];
      } catch {
        return r;
      }
    },
  );
  const choose = (category: CommunicationCategory) => {
    if (category === "doc") {
      navigate({ to: "/eds", search: { category: "doc", no: "auth" } });
      return;
    }
    setChatCategory(category);
    setCustomsView(category === "customs" ? "assistant" : "choices");
    setGamblingView(category === "gambling" ? "assistant" : "choices");
    setOpen(true);
    chat.reset([
      {
        from: "toms",
        text:
          category === "customs"
            ? "Labdien! Palīdzēšu atrast atbildi uz muitas jautājumu. Par ko vēlaties jautāt?"
            : category === "gambling"
              ? "Labdien! Palīdzēšu atrast atbildi par azartspēlēm un izlozēm. Par ko vēlaties jautāt?"
              : "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?",
      },
    ]);
  };
  const auth = () => {
    saveConversation(chat.messages);
    navigate({ to: "/eds", search: { no: "toms" } });
  };
  const closePanel = () => {
    setOpen(false);
    setCustomsView("choices");
    setGamblingView("choices");
  };
  const ask = (text: string) => {
    setChatCategory("chat");
    setOpen(true);
    chat.send(text);
  };
  const panelTitle =
    chatCategory === "customs"
      ? "Saziņa par muitas jautājumiem"
      : chatCategory === "gambling"
        ? "Saziņa par azartspēļu un izložu jautājumiem"
        : "Saziņa ar VID par nodokļu jomas jautājumiem";
  const chatSurface = (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-card" aria-label="Toms — VID virtuālais asistents">
      <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        {chatCategory !== "customs" && chatCategory !== "gambling" && <TomsAvatar size={36} />}
        <div>
          <h3 className="text-sm font-bold">{chatCategory === "customs" || chatCategory === "gambling" ? "Virtuālais asistents" : "Toms"}</h3>
          <p className="text-xs">VID virtuālais asistents{chatCategory === "customs" ? " · muitas jautājumi" : chatCategory === "gambling" ? " · azartspēles un izlozes" : ""}</p>
        </div>
      </div>
      <TomsChat
        hideAvatar={chatCategory === "customs" || chatCategory === "gambling"}
        sidePanel
        messages={chat.messages}
        busy={chat.busy}
        onSend={chat.send}
        onAuth={auth}
        suggestions={chatCategory === "customs"
          ? ["Pasta sūtījumi", "Vai jāmaksā muita par paku?"]
          : chatCategory === "gambling"
            ? ["Azartspēļu organizēšana", "Izložu atļauja"]
            : ["Kad atmaksās manu nodokļu pārmaksu?", "Klientu apkalpošanas darba laiks", "Vai jāmaksā muita par paku?"]}
      />
    </section>
  );
  return (
    <div className="min-h-screen bg-background pt-12">
      <ViewSwitch
        onReset={() => {
          chat.reset([
            {
              from: "toms",
              text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?",
            },
          ]);
          clearConversation();
          closePanel();
        }}
      />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-[56px] max-w-[1120px] items-center gap-6 overflow-x-auto px-8 sm:gap-10 sm:px-12">
          <div className="min-w-8 flex-1" />
          <nav className="flex shrink-0 gap-5 sm:gap-8" aria-label="VID izvēlne">
            {["Par mums", "Aktualitātes", "Muita", "Nodokļi", "Kontakti"].map((t) => (
              <a
                href={t === "Kontakti" ? "#kontakti" : "#sazina"}
                key={t}
                className="flex shrink-0 items-center gap-1 py-5 text-xs text-foreground"
              >
                {t}
                <ChevronDown size={10} />
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(!searchOpen)}
              className="h-auto flex-col gap-0 px-0 py-2 text-muted-foreground"
              title="Meklēt"
            >
              <Search size={21} />
              <span className="hidden text-[9px] sm:block">Meklēt</span>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden h-auto flex-col gap-0 border-l border-border px-3 text-muted-foreground sm:flex"
            >
              <a href="https://www.vid.gov.lv/en">
                <Globe size={21} />
                <span className="text-[9px]">Language</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.documentElement.classList.toggle("large-text")}
              className="hidden h-auto flex-col gap-0 border-l border-border px-3 text-muted-foreground sm:flex"
              title="Palielināt tekstu"
            >
              <Accessibility size={21} />
              <span className="text-[9px]">Piekļūstamība</span>
            </Button>
          </div>
        </div>
        {searchOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) ask(query);
            }}
            className="mx-auto flex max-w-[940px] gap-2 px-5 pb-3"
          >
            <input
              aria-label="Meklēt vid.gov.lv"
              className="input-vid min-w-0 flex-1"
              placeholder="Meklēt vid.gov.lv…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" size="icon" aria-label="Meklēt">
              <Search />
            </Button>
          </form>
        )}
      </header>
      <section className="public-top">
        <div className="mx-auto flex flex-col items-center pb-14">
          <div className="h-[38px] w-[74px] bg-primary" />
          <div className="mt-2 h-[104px] w-[168px] overflow-hidden">
            <img
              src={vidCrest}
              className="w-[168px] max-w-none mix-blend-multiply object-cover object-top"
              style={{ height: "128px" }}
              alt="Latvijas valsts ģerbonis"
            />
          </div>
          <h1 className="mt-1 text-sm font-normal">Valsts ieņēmumu dienests</h1>
        </div>
        <div className="relative z-10 mx-auto grid max-w-[1120px] gap-5 px-8 sm:px-12 md:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.title}
              className="rounded-sm border border-border bg-card px-[30px] pb-6 pt-6 shadow-[var(--shadow-panel)]"
            >
              <h2 className="mb-5 text-base font-bold">{group.title}</h2>
              <ul className="public-links list-disc space-y-2 pl-3 text-xs leading-[19px]">
                {group.items.map((item) => (
                  <li key={item}>
                    {item === "EDS" ? (
                      <Link to="/eds" search={{}}>
                        EDS
                      </Link>
                    ) : (
                      <a
                        href="#sazina"
                        onClick={(event) => {
                          if (item === "Pasta sūtījumi") {
                            event.preventDefault();
                            choose("customs");
                          }
                          if (item === "Atbalsts azartspēļu spēlētājiem") {
                            event.preventDefault();
                            choose("gambling");
                          }
                        }}
                      >
                        {item}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="public-banner -mt-[170px] flex min-h-[242px] items-end justify-center pb-3 pt-[190px] text-primary-foreground">
          <a href="#sazina" className="flex flex-col items-center gap-2 text-[10px]">
            <Mouse size={23} strokeWidth={1} />
            Skatīt zemāk
          </a>
        </div>
      </section>
      <section className="mx-auto max-w-[1120px] px-8 pb-7 pt-9 sm:px-12">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">Jaunumi</h2>
          <span
            aria-disabled="true"
            className="flex cursor-default select-none items-center gap-2 text-sm text-muted-foreground"
          >
            Skatīt visus jaunumus <ArrowRight size={16} />
          </span>
        </div>
      </section>
      <section id="sazina" className="border-t border-border bg-secondary py-9">
        <div className="mx-auto max-w-[940px] px-5">
          <h2 className="text-center text-2xl font-bold">Saziņa ar VID</h2>
          <p className="mb-8 mt-3 text-center text-sm text-muted-foreground">
            Saņemiet atbildi uzreiz vai nosūtiet jautājumu atbildīgajam VID speciālistam.
          </p>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <CommunicationChoices onChoose={choose} publicSite />
            </div>
            <div id="kontakti">
              <h3 className="mb-3 text-sm font-bold text-primary">Kontakti</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Phone size={15} className="text-chat-primary" />
                  <a href="tel:+37167120000">+371 67120000</a>
                </li>
                <li className="flex gap-2">
                  <Mail size={15} className="text-chat-primary" />
                  <a href="mailto:vid@vid.gov.lv">vid@vid.gov.lv</a>
                </li>
                <li className="flex gap-2">
                  <MapPin size={15} className="shrink-0 text-chat-primary" />
                  Talejas iela 1, Rīga, LV-1978
                </li>
              </ul>
              <Button variant="outline" asChild className="mt-6 h-auto whitespace-normal border-primary px-4 py-3 text-primary"><a href="https://www.vid.gov.lv/lv/klientu-apkalposana"><Building2 size={18} /> Klientu apkalpošana</a></Button>
            </div>
          </div>
        </div>
      </section>
      {open && (
        <div className="fixed bottom-0 left-0 right-0 top-12 z-40 flex flex-col bg-background">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
            <h2 className="text-base font-bold text-primary">{panelTitle}</h2>
            <Button variant="outline" onClick={closePanel}><X size={16} /> Aizvērt</Button>
          </div>
          {chatCategory === "customs" && (
            <div className="flex shrink-0 flex-wrap gap-2 border-b border-border bg-card px-4 py-3 sm:px-6" role="group" aria-label="Muitas saziņas iespējas">
              <Button variant={customsView === "assistant" ? "default" : "outline"} className="h-auto whitespace-normal py-2" onClick={() => setCustomsView("assistant")}><MessageSquareMore size={17} /> Virtuālais asistents</Button>
              <Button variant="outline" className="h-auto whitespace-normal py-2" asChild><Link to="/eds" search={{ category: "doc", no: "auth" }}><FilePlus2 size={17} /> Rakstīt speciālistam</Link></Button>
              <Button variant={customsView === "points" ? "default" : "outline"} className="h-auto whitespace-normal py-2" onClick={() => setCustomsView("points")}><Building2 size={17} /> Muitas punkti</Button>
            </div>
          )}
          {chatCategory === "gambling" && (
            <div className="flex shrink-0 flex-wrap gap-2 border-b border-border bg-card px-4 py-3 sm:px-6" role="group" aria-label="Azartspēļu un izložu saziņas iespējas">
              <Button variant={gamblingView === "assistant" ? "default" : "outline"} className="h-auto whitespace-normal py-2" onClick={() => setGamblingView("assistant")}><MessageSquareMore size={17} /> Virtuālais asistents</Button>
              <Button variant="outline" className="h-auto whitespace-normal py-2" asChild><Link to="/eds" search={{ category: "gambling-doc", no: "auth" }}><FilePlus2 size={17} /> Rakstīt speciālistam</Link></Button>
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col">
            {chatCategory === "customs" && customsView === "points" ? (
              <div className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-6"><CustomsPoints requireAuth /></div>
            ) : (
              chatSurface
            )}
          </div>
        </div>
      )}
    </div>
  );
}
