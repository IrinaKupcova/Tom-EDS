import { Link, useRouterState } from "@tanstack/react-router";
import { Box, FilePlus2, MessageSquareMore, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TomsAvatar } from "@/components/TomsChat";

export type CommunicationCategory = "chat" | "doc" | "customs";
export const choices = [
  { id: "chat" as const, title: "Sarakstīties ar VID par nodokļu jomas jautājumiem", desc: "Nodokļi, deklarācijas, konsultācijas un informācijas pieprasījumi", icon: MessageSquareMore, ai: true },
  { id: "doc" as const, title: "Iesniegt dokumentu vai rakstīt speciālistam", desc: "Iesniegums, paskaidrojums, dokuments vai ziņa VID speciālistam", icon: FilePlus2, ai: false },
  { id: "customs" as const, title: "Sarakstīties ar VID par muitas jomas jautājumiem", desc: "Pasta sūtījumi, muitas jautājumi un saziņa ar muitas punktu", icon: Box, ai: true },
];

export function CommunicationChoices({ onChoose, publicSite = false }: { onChoose: (category: CommunicationCategory) => void; publicSite?: boolean }) {
  return <>
    <div className="toms-introduction mb-4 flex items-center gap-3 rounded-lg border border-chat-border bg-chat-header p-4">
      <TomsAvatar />
      <div className="min-w-0 text-sm"><div className="font-bold text-primary">Toms — VID virtuālais asistents</div>
        {!publicSite && <div className="mt-1 text-xs text-muted-foreground"><span className="online-dot" /> Tiešsaistē · atbildu uzreiz</div>}
        <p className="mt-1 leading-5 text-muted-foreground">{publicSite ? "Atbildu uz jautājumiem, sniedzu instrukcijas un palīdzu sagatavot ziņu VID speciālistam." : "Varu atbildēt uz jautājumu, izskaidrot darbības EDS vai palīdzēt sagatavot ziņu VID speciālistam."}</p>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {choices.map(({ id, title, desc, icon: Icon, ai }) => <Button key={id} variant="outline" onClick={() => onChoose(id)} className="communication-choice h-auto items-start justify-start whitespace-normal rounded-lg p-4 text-left shadow-none">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-chat-accent text-chat-primary"><Icon size={20} /></span>
        <span className="min-w-0"><span className="block text-sm font-bold leading-5 text-primary">{title}</span>
          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${ai ? "bg-chat-accent text-chat-primary" : "bg-secondary text-muted-foreground"}`}>{ai ? "Toms palīdz" : "Manuāla apstrāde"}</span>
          <span className="mt-1 block text-xs leading-[18px] text-muted-foreground">{desc}</span>
          <span className="mt-2 block text-[11px] text-primary">{ai ? "Saziņa uzreiz · 24/7" : "Atbilde 1–10 darba dienās"}</span>
        </span>
      </Button>)}
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground">Kategorijās “Toms palīdz” saziņu veic mākslīgais intelekts.</p>
  </>;
}

export function ViewSwitch({ onReset }: { onReset: () => void }) {
  const path = useRouterState({ select: s => s.location.pathname });
  return <div className="view-switch fixed bottom-3 left-3 z-40 flex items-center gap-1 rounded-full bg-switch p-1.5 text-xs text-switch-foreground shadow-[var(--shadow-panel)]">
    <span className="px-2 text-[9px] font-bold text-sidebar-muted">PROTOTIPS</span>
    <Button variant="ghost" size="sm" asChild className={path === "/" ? "bg-card text-primary hover:bg-card" : "text-sidebar-muted hover:text-switch-foreground"}><Link to="/">vid.gov.lv</Link></Button>
    <Button variant="ghost" size="sm" asChild className={path === "/eds" ? "bg-card text-primary hover:bg-card" : "text-sidebar-muted hover:text-switch-foreground"}><Link to="/eds" search={{}}>EDS</Link></Button>
    <Button variant="ghost" size="icon-sm" title="Sākt no jauna" aria-label="Atiestatīt prototipu" onClick={onReset}><RotateCcw size={14} /></Button>
  </div>;
}