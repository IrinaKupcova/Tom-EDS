/** Viena dokumentu apakšveidu kataloga vieta. Strukturētās veidlapas ir ilustratīvas, nevis ražošanas klasifikators. */
export const documentSubtypes: Record<string, string[]> = {
  "Iesniegums": ["Iesniegums par nodokļu atmaksu", "Iesniegums par nodokļu parāda samaksas termiņa pagarinājumu", "Iesniegums par nodokļu maksājumu sadalīšanu termiņos", "Iesniegums par nodokļu aprēķina pārskatīšanu", "Iesniegums par algas nodokļa grāmatiņas piešķiršanu", "Cits iesniegums"],
  "Paskaidrojums": ["Paskaidrojums par deklarācijas datiem", "Paskaidrojums par ienākumiem", "Paskaidrojums par nodokļu maksājumiem", "Cits paskaidrojums"],
  "Pilnvara": ["Pilnvara pārstāvībai VID", "Pilnvara muitas formalitāšu kārtošanai", "Pilnvaras atsaukums", "Cita pilnvara"],
  "Muitas jautājums": ["Par pasta sūtījuma muitošanu", "Par muitas deklarācijas precizēšanu", "Par muitas maksājumu atmaksu", "Cits muitas jautājums"],
  "Azartspēļu un izložu jautājums": ["Par azartspēļu organizēšanas licenci", "Par izložu atļauju", "Par azartspēļu nodokli", "Cits azartspēļu vai izložu jautājums"],
  "Cits dokuments": ["Papildu informācija iepriekšējai vēstulei", "Apliecinoši dokumenti", "Cits dokuments vai ziņa speciālistam"],
};

const WHERE =
  "To var atvērt EDS sadaļā “Sarakste ar VID” → “Rakstīt jaunu vēstuli” → “Iesniegt dokumentu vai rakstīt speciālistam”.";

type StructuredForm = { type: string; subtype: string; test: (text: string) => boolean };

const has = (text: string, pattern: RegExp) => pattern.test(text);

/** Konkrētas darbības, kurām katalogā ir strukturēta iesniegšanas veidlapa. Vispārīgi “citi” veidi šeit nav. */
const structuredForms: StructuredForm[] = [
  { type: "Iesniegums", subtype: "Iesniegums par algas nodokļa grāmatiņas piešķiršanu", test: (t) => has(t, /grāmatiņ|gramatin/) },
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
  return `Vēršam uzmanību, ka šādam pakalpojumam ir veidlapa EDS: “${form.subtype}”. ${WHERE}`;
}
