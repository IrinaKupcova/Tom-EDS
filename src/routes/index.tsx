import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Accessibility,
  ArrowRight,
  ChevronDown,
  Globe,
  Mail,
  MapPin,
  Mouse,
  Phone,
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
import { publicReply, saveConversation, clearConversation } from "@/lib/toms";
import crestAsset from "@/assets/vid-crest.asset.json";
import tomsAsset from "@/assets/toms-portrait.asset.json";

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
      "Palīdzība Ukrainai",
      "EDS",
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
  const navigate = useNavigate();
  const chat = useScriptedChat(
    [{ from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" }],
    publicReply,
  );
  const choose = (category: CommunicationCategory) => {
    if (category === "doc") {
      navigate({ to: "/eds", search: { category: "doc" } });
      return;
    }
    setChatCategory(category);
    setOpen(true);
    chat.reset([
      {
        from: "toms",
        text:
          category === "customs"
            ? "Labdien! Palīdzēšu atrast atbildi uz muitas jautājumu. Par ko vēlaties jautāt?"
            : "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?",
      },
    ]);
  };
  const auth = () => {
    saveConversation(chat.messages);
    navigate({ to: "/eds", search: { no: "toms" } });
  };
  const ask = (text: string) => {
    setOpen(true);
    chat.send(text);
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid min-h-[56px] max-w-[940px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:flex sm:justify-end sm:gap-12">
          <nav className="flex min-w-0 gap-3 overflow-x-auto sm:gap-6" aria-label="VID izvēlne">
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
          <div className="flex shrink-0 items-center gap-3">
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
          <img
            src={crestAsset.url}
            className="mt-3 h-[80px] w-[80px] object-contain"
            alt="Latvijas valsts ģerbonis"
          />
          <h1 className="mt-2 text-sm font-normal">Valsts ieņēmumu dienests</h1>
        </div>
        <div className="relative mx-auto z-10 grid max-w-[920px] gap-4 px-5 md:grid-cols-3">
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
                        onClick={() => {
                          if (item === "Pasta sūtījumi") choose("customs");
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
      <section className="mx-auto max-w-[940px] px-5 pb-7 pt-9">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">Jaunumi</h2>
          <a
            href="https://www.vid.gov.lv/lv/jaunumi"
            className="flex items-center gap-2 text-sm text-primary"
          >
            Skatīt visus jaunumus <ArrowRight size={16} />
          </a>
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
              <div className="mt-6 border-t border-chat-border pt-4">
                <div className="flex items-center gap-2 text-sm font-bold text-chat-primary">
                  <TomsAvatar size={24} />
                  Toms
                </div>
                <p className="mt-2 text-xs leading-4 text-chat-primary">
                  Atbildu uzreiz. Ja jautājums ir personalizēts un nepieciešama autentifikācija —
                  saruna turpinās EDS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="fixed bottom-5 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)]">
        {open ? (
          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-panel)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-3">
                <TomsAvatar size={32} />
                <div>
                  <h2 className="text-sm font-bold">Toms</h2>
                  <p className="text-xs">VID virtuālais asistents</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Aizvērt Tomu"
              >
                <X size={18} />
              </Button>
            </div>
            <TomsChat
              compact
              messages={chat.messages}
              busy={chat.busy}
              onSend={chat.send}
              onAuth={auth}
              suggestions={
                chatCategory === "customs"
                  ? ["Pasta sūtījumi", "Vai jāmaksā muita par paku?"]
                  : [
                      "Kad atmaksās manu nodokļu pārmaksu?",
                      "Klientu apkalpošanas darba laiks",
                      "Vai jāmaksā muita par paku?",
                    ]
              }
            />
          </section>
        ) : (
          <Button
            onClick={() => setOpen(true)}
            className="relative ml-auto h-auto w-full whitespace-normal rounded-lg px-5 py-3 pr-12 text-left text-sm font-normal leading-5 shadow-[var(--shadow-panel)]"
          >
            Es esmu VID virtuālais asistents TOMS. Droši jautājiet — centīšos palīdzēt.
            <span className="toms-public-avatar absolute -bottom-3 -right-1 grid size-14 place-items-center rounded-full border border-border bg-card">
              <img src={tomsAsset.url} alt="Toms" className="size-full rounded-full object-cover" />
            </span>
          </Button>
        )}
      </div>
      <ViewSwitch
        onReset={() => {
          chat.reset([
            {
              from: "toms",
              text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?",
            },
          ]);
          clearConversation();
          setOpen(false);
        }}
      />
    </div>
  );
}
