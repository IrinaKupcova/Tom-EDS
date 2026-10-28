import { Link, useRouterState } from "@tanstack/react-router";
import { Box, Building2, Dices, FilePlus2, History, MessageSquareMore, RotateCcw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CommunicationCategory = "chat" | "doc" | "customs" | "history" | "gambling" | "gambling-doc" | "tax-menu" | "customs-menu" | "gambling-menu";
export type CommunicationDomain = "tax" | "customs" | "gambling";

const domains: { id: CommunicationDomain; title: string; icon: LucideIcon }[] = [
  { id: "tax", title: "Nodokļu joma", icon: MessageSquareMore },
  { id: "customs", title: "Muitas joma", icon: Box },
  { id: "gambling", title: "Azartspēļu un izložu joma", icon: Dices },
];

function ChoiceTile({ title, desc, icon: Icon, note, onClick }: { title: string; desc?: string; icon: LucideIcon; note?: string; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} className="communication-choice h-auto items-start justify-start whitespace-normal rounded-lg p-4 text-left shadow-none">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-chat-accent text-chat-primary"><Icon size={20} /></span>
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-5 text-primary">{title}</span>
        {desc && <span className="mt-1 block text-xs leading-[18px] text-muted-foreground">{desc}</span>}
        {note && <span className="mt-2 inline-block rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">{note}</span>}
      </span>
    </Button>
  );
}

export function CommunicationChoices({
  onOpenDomain,
  onHistory,
  publicSite = false,
}: {
  onOpenDomain: (domain: CommunicationDomain) => void;
  onHistory?: () => void;
  publicSite?: boolean;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {domains.map((domain) => (
          <ChoiceTile key={domain.id} title={domain.title} icon={domain.icon} onClick={() => onOpenDomain(domain.id)} />
        ))}
      </div>
      {!publicSite && onHistory && (
        <div className="mt-3">
          <ChoiceTile title="Sarakstes vēsture" icon={History} desc="Šeit ir nelasītās, saņemtās, nosūtītās un sagatavotās ziņas, kā arī sarunas ar asistentu." onClick={onHistory} />
        </div>
      )}
      {!publicSite && <p className="mt-2 text-[10px] text-muted-foreground">
        Saziņu nodokļu un muitas jautājumos veic virtuālais asistents. Sarežģītības kritēriji vēl tiks definēti.
      </p>}
    </>
  );
}

export function DomainActions({
  domain,
  onAssistant,
  onSpecialist,
  onPoints,
}: {
  domain: CommunicationDomain;
  onAssistant: () => void;
  onSpecialist: () => void;
  onPoints?: () => void;
}) {
  const title = domains.find((item) => item.id === domain)?.title;
  return (
    <div>
      <h3 className="mb-4 text-base font-bold text-primary">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceTile title="Sarakstīties ar virtuālo asistentu" icon={MessageSquareMore} note="Atbilde uzreiz · 24/7" onClick={onAssistant} />
        <ChoiceTile title="Rakstīt VID speciālistam" icon={FilePlus2} note="Atbilde līdz 10 darba dienām, sarežģītos gadījumos - līdz vienam mēnesim*" onClick={onSpecialist} />
      </div>
      {domain === "customs" && onPoints && (
        <Button variant="outline" onClick={onPoints} className="mt-3 h-auto whitespace-normal border-primary text-primary"><Building2 size={18} /> Rakstīt uz muitas kontroles punktu</Button>
      )}
      <ResponseTimeNote />
    </div>
  );
}

export function ResponseTimeNote() {
  return <p className="mt-3 text-xs leading-5 text-muted-foreground">* <a href="https://likumi.lv/ta/id/164501-iesniegumu-likums#p5" target="_blank" rel="noreferrer" className="text-primary underline">Iesniegumu likuma 5. panta trešā un 3.¹ daļa</a>: atbilde parasti sniedzama 10 darbdienu laikā; ja nepieciešama papildu informācija, sadarbība ar citām iestādēm vai apjomīga analīze — viena mēneša laikā. Citām iesniegumu kategorijām var būt cita likumā noteikta kārtība.</p>;
}

export function ViewSwitch({ onReset }: { onReset: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="view-switch fixed inset-x-0 top-0 z-50 flex h-12 flex-nowrap items-center justify-center gap-1 overflow-x-auto border-b-4 border-chat-primary bg-switch px-3 text-sm text-switch-foreground shadow-[var(--shadow-panel)]">
      <span className="px-2 text-sm font-bold">Skata izvēle</span>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className={
          path === "/"
            ? "bg-card font-bold text-primary hover:bg-card"
            : "text-switch-foreground hover:bg-white/10 hover:text-switch-foreground"
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
            ? "bg-card font-bold text-primary hover:bg-card"
            : "text-switch-foreground hover:bg-white/10 hover:text-switch-foreground"
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
        className="text-switch-foreground hover:bg-white/10 hover:text-switch-foreground"
      >
        <RotateCcw size={14} />
      </Button>
    </div>
  );
}
