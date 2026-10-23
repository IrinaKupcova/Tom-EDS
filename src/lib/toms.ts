import { matchStructuredForm, structuredFormNotice } from "@/lib/documents";

export type Msg = {
  from: "toms" | "user" | "system";
  text: string;
  action?: "auth" | "summary" | "notice";
  summary?: Summary;
};
export type Summary = { kategorija: string; tema: string; struktura: string; teksts: string };

const STORE = "toms-conversation";
export const saveConversation = (m: Msg[]) => sessionStorage.setItem(STORE, JSON.stringify(m));
export const loadConversation = (): Msg[] | null => {
  try {
    const raw = sessionStorage.getItem(STORE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const clearConversation = () => sessionStorage.removeItem(STORE);

const PERSONAL_WORDS = ["mans", "manu", "man ", "manai", "manā", "mana"];

export function detectTopic(text: string): Summary {
  const t = text.toLowerCase();
  if (/(azart|izloz|izlož|loterij)/.test(t)) return { kategorija: "Azartspēļu un izložu jautājumi", tema: "Jautājums par azartspēlēm un izlozēm", struktura: "VID azartspēļu un izložu jomas speciālists", teksts: text };
  if (/(muit|sūtījum|paka|imports|ievest|deklarēt preci)/.test(t))
    return {
      kategorija: "Muitas jautājumi",
      tema: "Pasta sūtījuma muitošana",
      struktura: "Muitas pārvalde",
      teksts: text,
    };
  if (/(pārmaks|atmaks|gada ienākumu|attaisnot)/.test(t))
    return {
      kategorija: "Iedzīvotāju ienākuma nodoklis",
      tema: "Nodokļa pārmaksas atmaksas statuss",
      struktura: "Nodokļu pārvalde – IIN nodaļa",
      teksts: text,
    };
  if (/(parād|kavēj|nomaks|sadal|termiņ)/.test(t))
    return {
      kategorija: "Nodokļu parādi",
      tema: "Nodokļu parāda samaksas termiņa pagarinājums",
      struktura: "Nodokļu parādu piedziņas pārvalde",
      teksts: text,
    };
  if (/(pvn|reģistr)/.test(t))
    return {
      kategorija: "PVN",
      tema: "PVN reģistrācijas jautājums",
      struktura: "Nodokļu pārvalde – PVN nodaļa",
      teksts: text,
    };
  return {
    kategorija: "Vispārīgi jautājumi",
    tema: "Konsultācija par nodokļu jautājumu",
    struktura: "Konsultāciju pārvalde",
    teksts: text,
  };
}

export function needsIdentification(text: string) {
  const t = `${text.toLowerCase()} `;
  const aboutPerson = PERSONAL_WORDS.some((word) => t.includes(word)) || /(pārmaks|parād|atmaks|deklarācij|soda|nomaks|kavēj)/.test(t);
  if (!aboutPerson) return false;
  if (/(iesniegt|veidlap|kā iesniegt|kur iesniegt)/.test(t) && !/(mans|manu|manā|mana|status)/.test(t)) return false;
  return true;
}

const VID = "https://www.vid.gov.lv/lv";
const EDS_LOGIN = "https://eds.vid.gov.lv/login/";
const DOCS_GUIDE = "https://www.vid.gov.lv/lv/media/1103/download?attachment=";
const SERVICE = "https://www.vid.gov.lv/lv/klientu-apkalposana";
const CERT_GUIDE = "https://www.vid.gov.lv/lv/media/1089/download?attachment=";
const WAGE = "https://www.vid.gov.lv/lv/algas-nodokla-gramatina";
const PHONE = "[67120000](tel:+37167120000)";

function selfServiceGuide(latest: string, context: string): Msg[] | null {
  const submit = /(iesniegt|iesniegum|veidlap|izziņ|izgūt)/i.test(latest);
  const askSpecialist = /(speciālist|pārsūtīt|rakstīt\s+vid)/i.test(latest);
  const form = matchStructuredForm(context);
  if (!submit && !askSpecialist && !form) return null;
  const lines = [
    form
      ? `Šo varat izdarīt pats. EDS veidlapa: “${form.subtype}” (dokumenta veids: ${form.type}).`
      : "Šo varat izdarīt pats, bez vēstules speciālistam.",
    "Vispirms kreisajā joslā atveriet EDS sadaļu Dokumenti → Sagatavot dokumentu → No veidlapas un pārbaudiet, vai tāda veidlapa jau ir.",
    `Kur palasīt: [www.vid.gov.lv](${VID}), [kā iesniegt dokumentu EDS](${DOCS_GUIDE}), [pieslēgties EDS](${EDS_LOGIN}).`,
  ];
  if (form?.subtype.includes("algas nodokļa grāmatiņas") || /grāmatiņ|gramatin/i.test(context)) {
    lines.push(`Algas nodokļa grāmatiņu saņem sadaļā Algas nodokļa grāmatiņa, nevis ar vēstuli. [Skaidrojums](${WAGE}).`);
  }
  if (/izziņ|izgūt/i.test(context)) {
    lines.push(`Izziņu sagatavo EDS sadaļā Izziņas → Sagatavot jaunu izziņu. [Kā lietot Izziņas](${CERT_GUIDE}).`);
  }
  if (askSpecialist) {
    lines.push(`Ja veidlapas nav un vajag cilvēka atbildi, zvaniet ${PHONE} vai nododiet šo saraksti speciālistam. Saruna paliek sarakstes vēsturē 30 dienas.`);
    return [
      { from: "toms", text: lines.join("\n\n"), action: "notice" },
      { from: "toms", text: "Pārbaudiet kopsavilkumu un apstipriniet, ja vēstule jānodod speciālistam.", action: "summary", summary: detectTopic(context) },
    ];
  }
  lines.push("Ja situācija ir sarežģīta, uzrakstiet to — ieteikšu zvanīt vai nodot speciālistam.");
  return [{ from: "toms", text: lines.join("\n\n"), action: "notice" }];
}

function complexHandoff(context: string, continuingSummary: boolean): Msg[] {
  const s = detectTopic(context);
  const notice = continuingSummary ? null : structuredFormNotice(context);
  return [
    {
      from: "toms",
      text: continuingSummary
        ? "Papildināju jautājumu speciālistam. Pārbaudiet kopsavilkumu pirms nosūtīšanas."
        : `Šo nevaru pabeigt kā parastu jautājumu, jo vajag izvērtēt konkrēto situāciju.\n\nVarat zvanīt konsultatīvajam tālrunim ${PHONE} darba dienās 8:30–16:30 vai skatīt [Klientu apkalpošana](${SERVICE}).\n\nJa vēlaties, nododu šo saraksti VID speciālistam. Tā paliek sarakstes vēsturē 30 dienas. Atbilde parasti ir 10 darba dienu laikā, sarežģītos gadījumos līdz 1 mēnesim.${notice ? `\n\n${notice}` : ""}`,
    },
    {
      from: "toms",
      text: "Pārbaudiet kopsavilkumu un apstipriniet nodošanu speciālistam.",
      action: "summary",
      summary: s,
    },
  ];
}

function userContext(text: string, history: Msg[] = []) {
  const earlier = history.filter((m) => m.from === "user").map((m) => m.text);
  return (earlier.length ? earlier : [text]).filter(Boolean).join("\n");
}

export function publicReply(text: string, history: Msg[] = []): Msg[] {
  const t = text.toLowerCase();
  const context = userContext(text, history);
  if (/(apstrīd|pārsūdz|nepiekrīt|pretrun|sarežģīt|sarežģit)/.test(t)) return complexHandoff(context, false);
  const guide = selfServiceGuide(text, context);
  if (guide) return guide;
  if (needsIdentification(text)) {
    return [
      {
        from: "toms",
        text: "Lai varētu sameklēt informāciju par Jums iestādes informācijas sistēmās un atbildēt uz Jūsu jautājumu, nepieciešama identifikācija. Šajā prototipā tā un personīgo datu saņemšana tiek demonstrēta.",
      },
      {
        from: "toms",
        text: "Piesakieties EDS – mūsu saruna turpināsies tieši tur, un Jums nekas nav jāatkārto.",
        action: "auth",
      },
    ];
  }
  if (t.includes("darba laik") || t.includes("klientu apkalp"))
    return [
      {
        from: "toms",
        text: "VID Klientu apkalpošanas centri strādā darba dienās 8:30–16:30. Konsultatīvais tālrunis: 67120000.",
      },
    ];
  if (t.includes("muit"))
    return [
      {
        from: "toms",
        text: "Pasta sūtījumiem no trešajām valstīm jāmaksā PVN neatkarīgi no vērtības. Ja vēlaties, lai pārbaudu konkrētu sūtījumu, uzrakstiet par to sīkāk.",
      },
    ];
  return [
    {
      from: "toms",
      text: `Paldies. Vispārīgu informāciju varat izlasīt [www.vid.gov.lv](${VID}). Ja vēlaties iesniegt dokumentu, vispirms skatiet EDS sadaļu Dokumenti. Ja jautājums ir sarežģīts, uzrakstiet to — ieteikšu zvanīt vai nodot speciālistam.`,
    },
  ];
}

export function edsReply(text: string, _turn: number, latest = text, continuingSummary = false): Msg[] {
  const t = latest.toLowerCase();
  // Illustrative scenarios only, not institution-approved complexity criteria.
  const complex = /(apstrīd|pārsūdz|nepiekrīt|nepiekrītu|pretrun|sarežģīt|sarežģit)/.test(t);
  if (complex || continuingSummary) return complexHandoff(text, continuingSummary);
  const guide = selfServiceGuide(latest, text);
  if (guide) return guide;
  const lookup = (answer: string): Msg[] => [
    { from: "system", text: "Datu saņemšana no iestādes IS demonstrēta · izdomāti piemēra dati, nevis Jūsu faktiskā informācija" },
    { from: "toms", text: answer },
  ];
  if (/(parād|parad)/.test(t)) return lookup("**Demonstrācijas dati:** Jūsu nodokļu parāds ir **125,40 EUR**: pamatsumma 120,00 EUR un nokavējuma nauda 5,40 EUR. Informācijas avots šajā scenārijā: nodokļu uzskaites IS. Šo jautājumu virtuālais asistents atrisina uzreiz — speciālistam tas netiek nosūtīts.");
  if (/(pārmaks|atmaks)/.test(t)) return lookup("**Demonstrācijas dati:** Jūsu nodokļa pārmaksa ir **86,20 EUR**. Atmaksas statuss: apstrādē. Informācijas avots šajā scenārijā: deklarāciju un nodokļu uzskaites IS.\n\nJa pārmaksa izveidojusies pēc gada ienākumu deklarācijas iesniegšanas, tās atmaksas termiņš parasti ir līdz trim mēnešiem no deklarācijas iesniegšanas dienas. Aktuālo statusu varat redzēt EDS. Šī ir asistenta atbilde, nevis iesniegums speciālistam.");
  if (/(deklarācij|deklaracij)/.test(t)) return lookup("**Demonstrācijas dati:** Jūsu gada ienākumu deklarācija ir saņemta. Statuss: apstrādē. Informācijas avots šajā scenārijā: deklarāciju IS.\n\nBieži uzdots jautājums: deklarācijā aprēķinātās pārmaksas atmaksas termiņš parasti ir līdz trim mēnešiem no deklarācijas iesniegšanas dienas. Aktuālo statusu varat redzēt EDS. Vai vēlaties precizēt jautājumu par deklarāciju?");
  if (/(man.*(sūtījum|paka)|sūtījum.*status|paka.*status)/.test(t)) return lookup("**Demonstrācijas dati:** Jūsu pasta sūtījuma muitas deklarācija ir saņemta. Statuss: apstrādē. Informācijas avots šajā scenārijā: muitas IS. Speciālista iesaiste šim statusa pieprasījumam nav nepieciešama.");
  if (/(samaks|apmaks|maksāt|maksat|nomaks)/.test(t)) return [{ from: "toms", text: "Nodokļu maksājumus varat veikt EDS sadaļā “Maksājumi”, izvēloties attiecīgo saistību. Šajā prototipā maksājums netiek veikts. Vai vēlaties precizēt, par kuru maksājumu jautājat?" }];
  if (/(eds|darbīb)/.test(t)) return [{ from: "toms", text: "Dokumentus atradīsiet EDS sadaļā “Dokumenti”, bet saraksti — sadaļā “Sarakste ar VID”. Kuru darbību vēlaties veikt?" }];
  if (/(muit|sūtījum|paka)/.test(t)) return [{ from: "toms", text: "Varu palīdzēt ar pasta sūtījuma deklarēšanu vai muitas deklarācijas statusu. Kas tieši Jūs interesē?" }];
  return [{ from: "toms", text: "Lūdzu, precizējiet jautājumu. Varu sniegt skaidrojumu vai sameklēt informāciju par Jūsu parādu, pārmaksu vai deklarācijas statusu. Speciālista iesaiste paredzēta tikai sarežģītiem jautājumiem." }];
}

export function gamblingReply(text: string, history: Msg[]): Msg[] {
  const context = "Azartspēļu un izložu jautājums: " + history.filter((m) => m.from === "user").map((m) => m.text).join("\n");
  if (/(apstrīd|pārsūdz|nepiekrīt|pretrun|sarežģīt|sarežģit)/i.test(text) || history.some((m) => m.action === "summary")) return edsReply(context, 0, text, history.some((m) => m.action === "summary"));
  const guide = selfServiceGuide(text, context);
  if (guide) return guide;
  if (needsIdentification(text)) return publicReply(text, history);
  return [{ from: "toms", text: "Par azartspēlēm un izlozēm aktuālo informāciju varat skatīt [VID tīmekļa vietnē](https://www.vid.gov.lv/lv). Šajā prototipā šīs jomas konsultācija tiek demonstrēta. Ja nepieciešams konkrētas situācijas izvērtējums, varat izvēlēties rakstīt VID speciālistam." }];
}

/** Scripted replies that only offer generic guidance are answered by the AI model instead. */
export const isGenericReply = (r: Msg[]) => !r.some((m) => m.action || m.from === "system");
export const toAiHistory = (msgs: Msg[]) =>
  msgs
    .filter((m) => m.from !== "system" && !m.action)
    .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));
