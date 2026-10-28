import { Building2, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const customsGroups = [
  { region: "Rīga", points: ["Lidostas muitas kontroles punkts", "Rīgas brīvostas muitas kontroles punkts", "Importa muitas kontroles punkts", "Šķirotavas muitas kontroles punkts"] },
  { region: "Kurzeme", points: ["Liepājas ostas muitas kontroles punkts", "Ventspils ostas muitas kontroles punkts"] },
  { region: "Latgale", points: ["Terehovas muitas kontroles punkts", "Grebņevas muitas kontroles punkts", "Pāternieku muitas kontroles punkts", "Rēzeknes II muitas kontroles punkts", "Daugavpils preču stacijas muitas kontroles punkts", "Zilupes muitas kontroles punkts", "Kārsavas muitas kontroles punkts", "Indras muitas kontroles punkts"] },
  { region: "Zemgale un Vidzeme", points: ["Jelgavas muitas kontroles punkts", "Valmieras muitas kontroles punkts"] },
];

export function CustomsPoints({ requireAuth = false }: { requireAuth?: boolean }) {
  return (
    <section aria-label="VID muitas punkti">
      {requireAuth && <p className="mb-3 text-xs text-muted-foreground">Rakstot speciālistam vai muitas punktam, vispirms jāpieslēdzas EDS.</p>}
      <h4 className="mb-1 flex items-center gap-2 text-base font-bold text-primary"><Building2 size={19} /> Rakstīt uz muitas kontroles punktu</h4>
      <p className="mb-4 text-sm leading-6">Izvēlieties punktu no saraksta un rakstiet tam uzreiz.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {customsGroups.map(({ region, points }) => (
          <div key={region}>
            <h5 className="border-b border-border pb-2 text-sm font-bold">{region}</h5>
            <ul className="divide-y divide-border">
              {points.map((point) => <li key={point} className="flex items-center justify-between gap-2 py-2 text-sm leading-5"><span>{point}</span><Button variant="link" size="sm" asChild className="h-auto shrink-0 px-0"><Link to="/eds" search={requireAuth ? { category: "doc", point, no: "auth" } : { category: "doc", point }}>Rakstīt</Link></Button></li>)}
            </ul>
          </div>
        ))}
      </div>
      <Button variant="link" asChild className="mt-4 h-auto whitespace-normal px-0 text-left">
        <a href="https://www.vid.gov.lv/lv/muitas-kontroles-un-robezkontroles-punkti" target="_blank" rel="noopener noreferrer">Kontakti un aktuālais darba laiks VID vietnē <ExternalLink size={15} /></a>
      </Button>
    </section>
  );
}