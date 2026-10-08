export type Msg = { from: "toms" | "user" | "system"; text: string; action?: "auth" | "summary"; summary?: Summary };
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

const PERSONAL = ["mans", "manu", "man ", "manai", "manā", "pārmaks", "parād", "atmaks", "deklarācij", "iesniegum", "soda", "nomaks", "kavēj", "mana"];

export function detectTopic(text: string): Summary {
  const t = text.toLowerCase();
  if (/(muit|sūtījum|paka|imports|ievest|deklarēt preci)/.test(t))
    return { kategorija: "Muitas jautājumi", tema: "Pasta sūtījuma muitošana", struktura: "Muitas pārvalde", teksts: text };
  if (/(pārmaks|atmaks|gada ienākumu|attaisnot)/.test(t))
    return { kategorija: "Iedzīvotāju ienākuma nodoklis", tema: "Nodokļa pārmaksas atmaksas statuss", struktura: "Nodokļu pārvalde – IIN nodaļa", teksts: text };
  if (/(parād|kavēj|nomaks|sadal|termiņ)/.test(t))
    return { kategorija: "Nodokļu parādi", tema: "Nodokļu parāda samaksas termiņa pagarinājums", struktura: "Nodokļu parādu piedziņas pārvalde", teksts: text };
  if (/(pvn|reģistr)/.test(t))
    return { kategorija: "PVN", tema: "PVN reģistrācijas jautājums", struktura: "Nodokļu pārvalde – PVN nodaļa", teksts: text };
  return { kategorija: "Vispārīgi jautājumi", tema: "Konsultācija par nodokļu jautājumu", struktura: "Konsultāciju pārvalde", teksts: text };
}

export function needsIdentification(text: string) {
  const t = text.toLowerCase() + " ";
  return PERSONAL.some((k) => t.includes(k));
}

export function publicReply(text: string): Msg[] {
  const t = text.toLowerCase();
  if (needsIdentification(text)) {
    return [
      { from: "toms", text: "Saprotu. Lai varētu apskatīt Jūsu personīgo informāciju un sagatavot iesniegumu VID, man Jūs ir jāidentificē." },
      { from: "toms", text: "Piesakieties EDS – mūsu saruna turpināsies tieši tur, un Jums nekas nav jāatkārto.", action: "auth" },
    ];
  }
  if (t.includes("darba laik") || t.includes("klientu apkalp"))
    return [{ from: "toms", text: "VID Klientu apkalpošanas centri strādā darba dienās 8:30–16:30. Konsultatīvais tālrunis: 67120000." }];
  if (t.includes("muit"))
    return [{ from: "toms", text: "Pasta sūtījumiem no trešajām valstīm jāmaksā PVN neatkarīgi no vērtības. Ja vēlaties, lai pārbaudu konkrētu sūtījumu, uzrakstiet par to sīkāk." }];
  return [{ from: "toms", text: "Paldies par jautājumu! Vispārīgu informāciju varu sniegt uzreiz. Ja jautājums attiecas uz Jums personīgi (deklarācija, pārmaksa, parāds), pastāstiet sīkāk." }];
}

export function edsReply(text: string, turn: number): Msg[] {
  const s = detectTopic(text);
  if (turn === 0) {
    return [
      { from: "toms", text: `Sapratu – jautājums par tēmu „${s.tema}”. Sagatavošu ziņu atbildīgajam VID speciālistam.` },
      { from: "toms", text: "Vai vēlaties, lai sagatavoju iesniegumu VID speciālistam? Es aizpildīšu kategoriju un tēmu Jūsu vietā.", action: "summary", summary: s },
    ];
  }
  return [{ from: "toms", text: "Pievienoju to iesniegumam. Pārbaudiet kopsavilkumu un nosūtiet.", action: "summary", summary: s }];
}
