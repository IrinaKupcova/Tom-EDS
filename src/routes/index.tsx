import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TomsAvatar, TomsChat, useScriptedChat } from "@/components/TomsChat";
import { publicReply, saveConversation } from "@/lib/toms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VID.gov.lv ar čatbotu Tomu — prototips" },
      { name: "description", content: "Prototips: VID virtuālais asistents Toms publiskajā lapā ar pāreju uz EDS." },
      { property: "og:title", content: "VID.gov.lv ar čatbotu Tomu — prototips" },
      { property: "og:description", content: "Toms atbild uz jautājumiem un, ja vajag identifikāciju, turpina sarunu EDS." },
    ],
  }),
  component: VidPage,
});

function VidPage() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const chat = useScriptedChat(
    [{ from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" }],
    (t) => publicReply(t),
  );

  const auth = () => {
    saveConversation(chat.messages);
    navigate({ to: "/eds", search: { no: "toms" } });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-xs">
          <span>Prototips · 1. iterācija</span>
          <Link to="/eds" className="underline">Atvērt EDS → Sarakste ar VID</Link>
        </div>
      </div>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-5">
          <div className="crest">LV</div>
          <div className="text-lg">Valsts ieņēmumu dienests</div>
          <nav className="ml-auto hidden gap-6 text-sm font-bold uppercase md:flex">
            <span>Privātpersonām</span><span>Uzņēmējiem</span><span>Muita</span><span>Par VID</span>
          </nav>
          <Link to="/eds" className="btn-vid">EDS</Link>
        </div>
      </header>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h1 className="text-3xl font-bold">Kā varam palīdzēt?</h1>
          <input className="input-vid mt-6 w-full max-w-2xl" placeholder="Meklēt vid.gov.lv…" />
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-4 px-6 py-10 md:grid-cols-3">
        {["Gada ienākumu deklarācija", "Nodokļu parādi", "Pasta sūtījumi un muita", "PVN reģistrācija", "Darba devējiem", "Klientu apkalpošana"].map((t) => (
          <div key={t} className="border border-border bg-card p-5">
            <div className="font-bold text-primary">{t}</div>
            <p className="mt-2 text-sm text-muted-foreground">Informācija, termiņi un biežāk uzdotie jautājumi.</p>
          </div>
        ))}
      </main>

      <div className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2rem)]">
        {open ? (
          <div className="border border-border bg-card shadow-[var(--shadow-panel)]">
            <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
              <TomsAvatar />
              <div className="flex-1"><div className="font-bold">Toms</div><div className="text-xs opacity-80">VID virtuālais asistents</div></div>
              <button onClick={() => setOpen(false)} aria-label="Aizvērt" className="text-xl">×</button>
            </div>
            <TomsChat
              compact
              messages={chat.messages}
              onSend={chat.send}
              onAuth={auth}
              suggestions={["Kad atmaksās manu nodokļu pārmaksu?", "Klientu apkalpošanas darba laiks", "Vai jāmaksā muita par paku?"]}
            />
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="ml-auto flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground shadow-[var(--shadow-panel)]">
            <TomsAvatar size={28} /> Jautāt Tomam
          </button>
        )}
      </div>
    </div>
  );
}
