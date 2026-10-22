import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import crestAsset from "@/assets/vid-crest.asset.json";

const START_KEY = "vid-start-view-v1";
const SHOW_EVENT = "vid-start-gate";

/** Atver sākuma skatu, lai atkārtoti izvēlētos EDS vai VID tīmekļa vietni. */
export function openStartGate() {
  try {
    sessionStorage.removeItem(START_KEY);
  } catch {
    /* sessionStorage var būt nepieejams */
  }
  window.dispatchEvent(new Event(SHOW_EVENT));
}

export function StartGate() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(SHOW_EVENT, show);
    return () => window.removeEventListener(SHOW_EVENT, show);
  }, []);

  if (!open) return null;

  const choose = (view: "vid" | "eds") => {
    try {
      sessionStorage.setItem(START_KEY, view);
    } catch {
      /* sessionStorage var būt nepieejams */
    }
    setOpen(false);
    if (view === "eds") navigate({ to: "/eds", search: {} });
    else navigate({ to: "/" });
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-secondary px-5 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-gate-title"
    >
      <div className="w-full max-w-[560px] rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-panel)] sm:p-8">
        <div className="flex flex-col items-center text-center">
          <img
            src={crestAsset.url}
            alt="Latvijas valsts ģerbonis"
            className="h-[64px] w-[64px] object-contain"
          />
          <h1 id="start-gate-title" className="mt-3 text-xl font-bold text-primary">
            Kādu skatu izvēlies?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Izvēlies, kuru VID vidi vēlies apskatīt šajā prototipā.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={() => choose("vid")}
            className="h-auto items-start justify-start whitespace-normal rounded-lg p-4 text-left shadow-none"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-chat-accent text-chat-primary">
              <Globe size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-5 text-primary">
                VID tīmekļa vietne
              </span>
              <span className="mt-1 block text-xs leading-[18px] text-muted-foreground">
                www.vid.gov.lv — saziņa bez pieslēgšanās
              </span>
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => choose("eds")}
            className="h-auto items-start justify-start whitespace-normal rounded-lg p-4 text-left shadow-none"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-chat-accent text-chat-primary">
              <Inbox size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-5 text-primary">EDS</span>
              <span className="mt-1 block text-xs leading-[18px] text-muted-foreground">
                Elektroniskā deklarēšanas sistēma — ar pieslēgšanos
              </span>
            </span>
          </Button>
        </div>
        <p className="mt-5 text-center text-[10px] text-muted-foreground">
          Skatu varēs pārslēgt arī lapas augšpusē.
        </p>
      </div>
    </div>
  );
}
