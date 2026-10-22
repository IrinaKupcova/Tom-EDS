import { structuredFormNotice, wantsToWriteToSpecialist } from "@/lib/documents";

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

const PERSONAL = [
  "mans",
  "manu",
  "man ",
  "manai",
  "manā",
  "pārmaks",
  "parād",
  "atmaks",
  "deklarācij",
  "iesniegum",
  "soda",
  "nomaks",
  "kavēj",
  "mana",
];

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
  const t = text.toLowerCase() + " ";
  return PERSONAL.some((k) => t.includes(k));
}

function userContext(text: string, history: Msg[] = []) {
  const earlier = history.filter((m) => m.from === "user").map((m) => m.text);
  return (earlier.length ? earlier : [text]).filter(Boolean).join("\n");
}

function specialistFormReply(latest: string, context: string): Msg[] | null {
  if (!wantsToWriteToSpecialist(latest)) return null;
  const notice = structuredFormNotice(context);
  if (!notice) return null;
  return [{ from: "toms", text: `Saprotu, ka vēlaties šo jautājumu nodot VID speciālistam. ${notice}`, action: "notice" }];
}

export function publicReply(text: string, history: Msg[] = []): Msg[] {
  const t = text.toLowerCase();
  const context = userContext(text, history);
  if (/(apstrīd|pārsūdz|nepiekrīt|pretrun|sarežģīt|sarežģit)/.test(t)) return edsReply(context, 0, text);
  const formReply = specialistFormReply(text, context);
  if (formReply) return formReply;
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
      text: "Paldies par jautājumu! Vispārīgu informāciju varu sniegt uzreiz. Ja jautājums attiecas uz Jums personīgi (deklarācija, pārmaksa, parāds), pastāstiet sīkāk.",
    },
  ];
}

export function edsReply(text: string, _turn: number, latest = text, continuingSummary = false): Msg[] {
  const s = detectTopic(text);
  const t = latest.toLowerCase();
  // Illustrative scenarios only, not institution-approved complexity criteria.
  const complex = /(apstrīd|pārsūdz|nepiekrīt|nepiekrītu|pretrun|sarežģīt|sarežģit)/.test(t);
  const formReply = !complex && !continuingSummary ? specialistFormReply(latest, text) : null;
  if (formReply) return formReply;
  if (complex || continuingSummary) {
    const notice = continuingSummary ? null : structuredFormNotice(text);
    return [
      {
        from: "toms",
        text: continuingSummary
          ? "Papildināju jautājumu speciālistam. Pārbaudiet kopsavilkumu pirms nosūtīšanas."
          : `Uz šo jautājumu diemžēl nevaru atbildēt. Vai vēlies, lai pārsūtu Tavu jautājumu VID speciālistam, kurš sniegs atbildi likumu noteiktajos termiņos (parasti līdz 10 darba dienām, sarežģītos jautājumos - līdz vienam mēnesim)? Ir iespēja sazināties ar speciālistiem izmantojot citus kanālus: [Klientu apkalpošana](https://www.vid.gov.lv/lv/klientu-apkalposana).${notice ? `\n\n${notice}` : ""}\n\n* Iesniegumu likuma 5. panta trešā un 3.¹ daļa paredz 10 darbdienas vai sarežģītos gadījumos vienu mēnesi. Šeit pārsūtīšana tiek demonstrēta.`,
      },
      {
        from: "toms",
        text: "Pārbaudiet tēmu, adresātu un tekstu. Nosūtīšana speciālistam šeit ir tikai demonstrācija.",
        action: "summary",
        summary: s,
      },
    ];
  }
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
  const formReply = specialistFormReply(text, context);
  if (formReply) return formReply;
  if (needsIdentification(text)) return publicReply(text, history);
  return [{ from: "toms", text: "Par azartspēlēm un izlozēm aktuālo informāciju varat skatīt [VID tīmekļa vietnē](https://www.vid.gov.lv/lv). Šajā prototipā šīs jomas konsultācija tiek demonstrēta. Ja nepieciešams konkrētas situācijas izvērtējums, varat izvēlēties rakstīt VID speciālistam." }];
}

/** Scripted replies that only offer generic guidance are answered by the AI model instead. */
export const isGenericReply = (r: Msg[]) => !r.some((m) => m.action || m.from === "system");
export const toAiHistory = (msgs: Msg[]) =>
  msgs
    .filter((m) => m.from !== "system" && !m.action)
    .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));
