import { Link, useRouterState } from "@tanstack/react-router";
import { Box, FilePlus2, History, Home, MessageSquareMore, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openStartGate } from "@/components/StartGate";

export type CommunicationCategory = "chat" | "doc" | "customs" | "history";
export const choices = [
  {
    id: "chat" as const,
    title: "Sarakstīties ar VID par nodokļu jomas jautājumiem",
    desc: "Nodokļi, deklarācijas, konsultācijas un informācijas pieprasījumi",
    icon: MessageSquareMore,
    ai: true,
  },
  {
    id: "doc" as const,
    title: "Iesniegt dokumentu vai rakstīt speciālistam",
    desc: "Iesniegums, paskaidrojums, dokuments vai ziņa VID speciālistam",
    icon: FilePlus2,
    ai: false,
  },
  {
    id: "customs" as const,
    title: "Sarakstīties ar VID par muitas jomas jautājumiem",
    desc: "Pasta sūtījumi, muitas jautājumi un saziņa ar muitas punktu",
    icon: Box,
    ai: true,
  },
  {
    id: "history" as const,
    title: "Sarakstes vēsture",
    desc: "Sarunas un speciālistam pārsūtītās vēstules",
    icon: History,
    ai: false,
  },
];

export function CommunicationChoices({
  onChoose,
  publicSite = false,
}: {
  onChoose: (category: CommunicationCategory) => void;
  publicSite?: boolean;
}) {
  return (
    <>
      {[
        { label: "NODOKĻU JOMA", ids: ["chat", "doc"] },
        { label: "MUITAS JOMA", ids: publicSite ? ["customs"] : ["customs", "history"] },
      ].map((group) => (
        <section key={group.label} className="mb-4" aria-label={group.label}>
          <h3 className="mb-2 border-l-4 border-primary pl-2 text-xs font-bold tracking-wide text-primary">{group.label}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {choices.filter(({ id }) => group.ids.includes(id)).map(({ id, title, desc, icon: Icon, ai }) => (
              <Button
                key={id}
                variant="outline"
                onClick={() => onChoose(id)}
                className="communication-choice h-auto items-start justify-start whitespace-normal rounded-lg p-4 text-left shadow-none"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-chat-accent text-chat-primary">
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-5 text-primary">{title}</span>
                  <span className="mt-1 block text-xs leading-[18px] text-muted-foreground">{desc}</span>
                  {id === "chat" && <span className="mt-2 block text-xs leading-[18px] text-primary">Uz Jūsu jautājumiem atbild virtuālais asistents.</span>}
                  {id === "customs" && <span className="mt-2 block text-xs leading-[18px] text-primary">Izvēlieties saraksti ar virtuālo asistentu, speciālistu vai muitas punktu.</span>}
                  {id === "history" || id === "customs" ? null : (
                    <span className="mt-2 inline-block rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                      {ai ? "Atbilde uzreiz · 24/7" : "Atbilde līdz 10 darba dienām"}
                    </span>
                  )}
                </span>
              </Button>
            ))}
          </div>
        </section>
      ))}
      {!publicSite && <p className="mt-2 text-[10px] text-muted-foreground">
        Saziņu nodokļu un muitas jautājumos veic virtuālais asistents. Sarežģītības kritēriji vēl tiks definēti.
      </p>}
    </>
  );
}

export function ViewSwitch({ onReset }: { onReset: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="view-switch fixed bottom-3 left-3 z-40 flex items-center gap-1 rounded-full bg-switch p-1.5 text-xs text-switch-foreground shadow-[var(--shadow-panel)]">
      <span className="px-2 text-[9px] font-bold text-sidebar-muted">PROTOTIPS</span>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className={
          path === "/"
            ? "bg-card text-primary hover:bg-card"
            : "text-sidebar-muted hover:text-switch-foreground"
        }
      >
        <Link to="/">vid.gov.lv</Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className={
          path === "/eds"
            ? "bg-card text-primary hover:bg-card"
            : "text-sidebar-muted hover:text-switch-foreground"
        }
      >
        <Link to="/eds" search={{}}>
          EDS
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Sākt no jauna"
        aria-label="Atiestatīt prototipu"
        onClick={onReset}
      >
        <RotateCcw size={14} />
      </Button>
    </div>
  );
}
