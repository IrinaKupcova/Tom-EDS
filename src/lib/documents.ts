/** Viena dokumentu apakšveidu kataloga vieta. Strukturētās veidlapas ir ilustratīvas, nevis ražošanas klasifikators. */
export const documentSubtypes: Record<string, string[]> = {
  "Jautājums": [
    "Jautājums par deklarācijas iesniegšanu",
    "Jautājums par nodokļa aprēķinu",
    "Jautājums par maksājumu",
    "Jautājums par EDS lietošanu",
    "Jautājums par termiņu",
    "Cits jautājums",
  ],
  "Pieteikums": [
    "Pieteikums konsultācijai",
    "Pieteikums klātienes apmeklējumam",
    "Pieteikums pakalpojuma saņemšanai",
    "Cits pieteikums",
  ],
  "Iesniegums": ["Iesniegums par nodokļu atmaksu", "Iesniegums par nodokļu parāda samaksas termiņa pagarinājumu", "Iesniegums par nodokļu maksājumu sadalīšanu termiņos", "Iesniegums par nodokļu aprēķina pārskatīšanu", "Iesniegums par algas nodokļa grāmatiņas piešķiršanu", "Cits iesniegums"],
  "Sūdzība": [
    "Sūdzība par VID pieņemtu lēmumu",
    "Sūdzība par VID darbinieka rīcību",
    "Sūdzība par klientu apkalpošanu",
    "Sūdzība par EDS darbību",
    "Cita sūdzība",
  ],
  "Ierosinājums": [
    "Ierosinājums VID pakalpojuma uzlabošanai",
    "Ierosinājums par EDS",
    "Ierosinājums par klientu apkalpošanu",
    "Cits ierosinājums",
  ],
  "Paskaidrojums": [
    "Paskaidrojums par deklarācijas datiem",
    "Paskaidrojums par ienākumiem",
    "Paskaidrojums par nodokļu maksājumiem",
    "Paskaidrojums par darījuma būtību",
    "Paskaidrojums par naudas līdzekļu izcelsmi",
    "Paskaidrojums par PVN darījumiem",
    "Cits paskaidrojums",
  ],
  "Pilnvara": ["Pilnvara pārstāvībai VID", "Pilnvara deklarāciju iesniegšanai", "Pilnvara muitas formalitāšu kārtošanai", "Pilnvaras atsaukums", "Cita pilnvara"],
  "Muitas jautājums": [
    "Par pasta sūtījuma muitošanu",
    "Par muitas deklarācijas precizēšanu",
    "Par muitas maksājumu atmaksu",
    "Par preču klasifikāciju",
    "Par preču izcelsmi",
    "Par importa PVN un muitas nodokli",
    "Cits muitas jautājums",
  ],
  "Azartspēļu un izložu jautājums": [
    "Par azartspēļu organizēšanas licenci",
    "Par interaktīvo azartspēļu organizēšanu",
    "Par azartspēļu automātiem",
    "Par izložu atļauju",
    "Par azartspēļu nodokli",
    "Par pašatteikumu no azartspēlēm",
    "Cits azartspēļu vai izložu jautājums",
  ],
  "Cits dokuments": ["Papildu informācija iepriekšējai vēstulei", "Apliecinoši dokumenti", "Cits dokuments vai ziņa speciālistam"],
};

const WHERE =
  "To var atrast EDS sadaļā “Dokumenti” → “Sagatavot dokumentu” → “No veidlapas”, meklējot veidlapu pēc nosaukuma.";

/** Norāde pie sarakstes ar speciālistu: strukturētās veidlapas ir kreisajā joslā. */
export const specialistDocumentsNotice =
  "Daudzas strukturētās veidlapas iesniedzamajiem dokumentiem ir kreisajā pusē sadaļā DOKUMENTI.";

type StructuredForm = { type: string; subtype: string; test: (text: string) => boolean };

const has = (text: string, pattern: RegExp) => pattern.test(text);

/** Konkrētas darbības, kurām katalogā ir strukturēta iesniegšanas veidlapa. Vispārīgi “citi” veidi šeit nav. */
const structuredForms: StructuredForm[] = [
  { type: "Iesniegums", subtype: "Iesniegums par algas nodokļa grāmatiņas piešķiršanu", test: (t) => has(t, /grāmatiņ|gramatin/) },
  { type: "Sūdzība", subtype: "Sūdzība par VID pieņemtu lēmumu", test: (t) => has(t, /sūdzīb|sudzib/) && has(t, /lēmum|lemum/) },
  { type: "Sūdzība", subtype: "Sūdzība par VID darbinieka rīcību", test: (t) => has(t, /sūdzīb|sudzib/) && has(t, /darbiniek/) },
  { type: "Sūdzība", subtype: "Sūdzība par EDS darbību", test: (t) => has(t, /sūdzīb|sudzib/) && has(t, /\beds\b/) },
  { type: "Sūdzība", subtype: "Sūdzība par klientu apkalpošanu", test: (t) => has(t, /sūdzīb|sudzib/) && has(t, /apkalpo/) },
  { type: "Ierosinājums", subtype: "Ierosinājums par EDS", test: (t) => has(t, /ierosin/) && has(t, /\beds\b/) },
  { type: "Ierosinājums", subtype: "Ierosinājums par klientu apkalpošanu", test: (t) => has(t, /ierosin/) && has(t, /apkalpo/) },
  { type: "Ierosinājums", subtype: "Ierosinājums VID pakalpojuma uzlabošanai", test: (t) => has(t, /ierosin/) },
  { type: "Muitas jautājums", subtype: "Par preču klasifikāciju", test: (t) => has(t, /klasifik/) && has(t, /muit|prec/) },
  { type: "Muitas jautājums", subtype: "Par preču izcelsmi", test: (t) => has(t, /izcelsm/) && has(t, /muit|prec/) },
  { type: "Paskaidrojums", subtype: "Paskaidrojums par naudas līdzekļu izcelsmi", test: (t) => has(t, /paskaidroj/) && has(t, /izcelsm/) },
  { type: "Azartspēļu un izložu jautājums", subtype: "Par pašatteikumu no azartspēlēm", test: (t) => has(t, /pašatteik|pasatteik/) },
  { type: "Muitas jautājums", subtype: "Par muitas deklarācijas precizēšanu", test: (t) => has(t, /muit/) && has(t, /preciz/) },
  { type: "Muitas jautājums", subtype: "Par muitas maksājumu atmaksu", test: (t) => has(t, /muit/) && has(t, /atmaks/) },
  { type: "Muitas jautājums", subtype: "Par pasta sūtījuma muitošanu", test: (t) => has(t, /pasta|paka|sūtījum|sutijum/) && has(t, /muit|deklar/) },
  { type: "Pilnvara", subtype: "Pilnvara muitas formalitāšu kārtošanai", test: (t) => has(t, /pilnvar/) && has(t, /muit/) },
  { type: "Azartspēļu un izložu jautājums", subtype: "Par azartspēļu organizēšanas licenci", test: (t) => has(t, /azart/) && has(t, /licenc|organiz/) },
  { type: "Azartspēļu un izložu jautājums", subtype: "Par izložu atļauju", test: (t) => has(t, /izlož|izloz|loterij/) && has(t, /atļauj|atlauj/) },
  { type: "Azartspēļu un izložu jautājums", subtype: "Par azartspēļu nodokli", test: (t) => has(t, /azart/) && has(t, /nodok/) },
  { type: "Iesniegums", subtype: "Iesniegums par nodokļu parāda samaksas termiņa pagarinājumu", test: (t) => has(t, /parād|parad/) && has(t, /pagarin/) },
  { type: "Iesniegums", subtype: "Iesniegums par nodokļu maksājumu sadalīšanu termiņos", test: (t) => has(t, /sadal/) && has(t, /maksāj|maksaj|termiņ|termin/) },
  { type: "Iesniegums", subtype: "Iesniegums par nodokļu aprēķina pārskatīšanu", test: (t) => !has(t, /azart|muit|izlož|izloz/) && (has(t, /pārskat|parskat/) || (has(t, /nepiekrīt|nepiekrit/) && has(t, /aprēķin|aprekin/))) },
  { type: "Iesniegums", subtype: "Iesniegums par nodokļu atmaksu", test: (t) => has(t, /atmaks|pārmaks|parmaks/) && !has(t, /muit|azart/) },
  { type: "Paskaidrojums", subtype: "Paskaidrojums par deklarācijas datiem", test: (t) => has(t, /paskaidroj/) && has(t, /deklar/) && !has(t, /muit/) },
  { type: "Paskaidrojums", subtype: "Paskaidrojums par ienākumiem", test: (t) => has(t, /paskaidroj/) && has(t, /ienāk|ienak/) },
  { type: "Paskaidrojums", subtype: "Paskaidrojums par nodokļu maksājumiem", test: (t) => has(t, /paskaidroj/) && has(t, /maksāj|maksaj/) },
  { type: "Pilnvara", subtype: "Pilnvaras atsaukums", test: (t) => has(t, /pilnvar/) && has(t, /atsauk/) },
  { type: "Pilnvara", subtype: "Pilnvara pārstāvībai VID", test: (t) => has(t, /pilnvar/) },
];

/** Vēstules formai. Šeit nav iesnieguma, pilnvaras un pieteikuma, ne arī apakštēmu, kuras EDS jau piedāvā kā strukturētu dokumentu. */
export function letterThemeOptions(): Record<string, string[]> {
  const structured = new Set(structuredForms.map((item) => item.subtype));
  const omittedTypes = new Set(["Iesniegums", "Pilnvara", "Pieteikums"]);
  const keptTypes = new Set(["Jautājums", "Paskaidrojums", "Sūdzība", "Ierosinājums"]);
  return Object.fromEntries(
    Object.entries(documentSubtypes).flatMap(([type, subtypes]) => {
      if (omittedTypes.has(type)) return [];
      const next = keptTypes.has(type) && type !== "Paskaidrojums" ? subtypes : subtypes.filter((subtype) => !structured.has(subtype));
      return next.length ? [[type, next]] : [];
    }),
  );
}

export function wantsToWriteToSpecialist(latest: string) {
  return /(speciālist|iesniegt|iesniegum|veidlap|nosūtīt|pārsūtīt|rakstīt\s+vid)/i.test(latest);
}

export function matchStructuredForm(context: string): { type: string; subtype: string } | null {
  const text = context.toLowerCase();
  const form = structuredForms.find((item) => item.test(text) || text.includes(item.subtype.toLowerCase()));
  return form ? { type: form.type, subtype: form.subtype } : null;
}

/** Atpazīst darbību uzkrātajā tekstā. Ja tai ir strukturēta veidlapa, atgriež paziņojumu, kur to atvērt. */
export function structuredFormNotice(context: string): string | null {
  const form = matchStructuredForm(context);
  if (!form) return null;
  return `Šai darbībai ir strukturēta iesniegšanas veidlapa “${form.subtype}” (dokumenta veids: ${form.type}). ${WHERE}`;
}

/** Īsāks paziņojums pēc vēstules nosūtīšanas. */
export function submittedFormNotice(context: string): string | null {
  const form = matchStructuredForm(context);
  if (!form) return null;
  if (form.subtype.includes("algas nodokļa grāmatiņas")) {
    return "Vēršam uzmanību, ka šo pakalpojumu varat izdarīt paši EDS sadaļā “Algas nodokļa grāmatiņa”.";
  }
  return `Vēršam uzmanību, ka šādam pakalpojumam ir veidlapa EDS: “${form.subtype}”. ${WHERE}`;
}
