import type { Msg, Summary } from "@/lib/toms";

export const correspondenceKey = "vid-eds-correspondence-v1";
export const specialistDraftKey = "vid-eds-specialist-draft";
/** Čata sarunas un nosūtītās vēstules prototipā paliek 30 dienas. Ieraksti bez datuma netiek izmesti. */
export const chatRetentionMs = 30 * 24 * 60 * 60 * 1000;
/** Nosūtītu ziņojumu var atcelt vienu dienu. Bez datuma atcelšana netiek piedāvāta. */
export const cancelWindowMs = 24 * 60 * 60 * 1000;

export type StoredConversation = {
  id: string;
  category: "chat" | "customs" | "gambling";
  messages: Msg[];
  date?: string | undefined;
  cancelled?: boolean | undefined;
  cancelReason?: string | undefined;
  cancelNote?: string | undefined;
};

export function canCancelMessage(date?: string | undefined) {
  if (!date || Number.isNaN(Date.parse(date))) return false;
  return Date.now() - Date.parse(date) < cancelWindowMs;
}

export function keptByRetention(date?: string | undefined) {
  if (!date || Number.isNaN(Date.parse(date))) return true;
  return Date.now() - Date.parse(date) < chatRetentionMs;
}

type Store = { conversations: StoredConversation[]; outbox: Array<{ id?: string; date?: string | undefined }> };

function readStore(): Store {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(correspondenceKey) || "{}");
    return {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      outbox: Array.isArray(parsed.outbox) ? parsed.outbox : [],
    };
  } catch {
    return { conversations: [], outbox: [] };
  }
}

export function upsertChatThread(row: StoredConversation) {
  const store = readStore();
  const existing = store.conversations.find((item) => item.id === row.id);
  const next: StoredConversation = {
    ...row,
    date: existing?.date ?? row.date ?? new Date().toISOString(),
    cancelled: existing?.cancelled === true,
    cancelReason: existing?.cancelReason,
    cancelNote: existing?.cancelNote,
  };
  store.conversations = existing
    ? store.conversations.map((item) => (item.id === row.id ? next : item))
    : [...store.conversations, next];
  sessionStorage.setItem(
    correspondenceKey,
    JSON.stringify({
      conversations: store.conversations.filter((item) => keptByRetention(item.date)),
      outbox: store.outbox.filter((item) => keptByRetention(item.date)),
    }),
  );
}

export function saveSpecialistDraft(summary: Summary) {
  sessionStorage.setItem(specialistDraftKey, JSON.stringify(summary));
}

export function loadSpecialistDraft(): Summary | null {
  try {
    const raw = sessionStorage.getItem(specialistDraftKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.teksts === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSpecialistDraft() {
  sessionStorage.removeItem(specialistDraftKey);
}

export function clearChatHistory() {
  const store = readStore();
  sessionStorage.setItem(correspondenceKey, JSON.stringify({ conversations: [], outbox: store.outbox }));
}

const demoSeedKey = "vid-eds-demo-seeded-v1";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function asTranscript(messages: Msg[]) {
  return messages
    .filter((message) => message.from !== "system")
    .map((message) => `${message.from === "user" ? "Klients" : "Toms"}: ${message.text}`)
    .join("\n\n");
}

/** Ilustratīvi paraugi. Datumi ir relatīvi pret atvēršanas brīdi, lai atcelšanas logs būtu redzams. */
export function demoCorrespondence() {
  const dispute: Msg[] = [
    { from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" },
    { from: "user", text: "Nepiekrītu nodokļu aprēķinam un gribu to pārsūdzēt." },
    { from: "toms", text: "Diemžēl nevaru atbildēt uz šo jautājumu. Piedāvāju sazināties ar speciālistu. Ja vēlaties, varu pārsūtīt jautājumu VID speciālistam." },
    { from: "user", text: "Jā, pārsūtīt VID speciālistam." },
    { from: "toms", text: "Paldies, jautājumu pārsūtīju speciālistam." },
  ];
  const customs: Msg[] = [
    { from: "toms", text: "Labdien! Palīdzēšu atrast atbildi uz muitas jautājumu." },
    { from: "user", text: "Muitas lēmumā prece ir klasificēta nepareizi. Lūdzu izvērtēt." },
    { from: "toms", text: "Diemžēl nevaru atbildēt uz šo jautājumu. Piedāvāju sazināties ar speciālistu. Ja vēlaties, varu pārsūtīt jautājumu VID speciālistam." },
    { from: "user", text: "Jā, pārsūtiet visu saraksti." },
    { from: "toms", text: "Paldies, jautājumu pārsūtīju speciālistam." },
  ];
  const refund: Msg[] = [
    { from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" },
    { from: "user", text: "Kad atmaksā nodokļu pārmaksu pēc gada deklarācijas?" },
    { from: "toms", text: "Pēc gada ienākumu deklarācijas pārmaksu parasti atmaksā trīs mēnešu laikā. Statusu skatiet EDS. Šī ir vispārīga atbilde, nevis jūsu personas dati." },
  ];
  const hours: Msg[] = [
    { from: "toms", text: "Labdien! Esmu Toms, VID virtuālais asistents. Kā varu palīdzēt?" },
    { from: "user", text: "Kāds ir klientu apkalpošanas darba laiks?" },
    { from: "toms", text: "VID Klientu apkalpošanas centri strādā darba dienās 8:30–16:30. Konsultatīvais tālrunis: 67120000." },
  ];
  return {
    conversations: [
      { id: "demo-chat-dispute", category: "chat" as const, messages: dispute, date: hoursAgo(2), demo: true },
      { id: "demo-chat-customs", category: "customs" as const, messages: customs, date: hoursAgo(24 * 12), demo: true },
      { id: "demo-chat-refund", category: "chat" as const, messages: refund, date: hoursAgo(24 * 3), demo: true },
      { id: "demo-chat-hours", category: "chat" as const, messages: hours, date: hoursAgo(24 * 5), demo: true },
    ],
    outbox: [
      {
        id: "demo-letter-recent",
        kategorija: "Nodokļu jautājumi",
        tema: "Lēmuma, aprēķina vai soda apstrīdēšana",
        struktura: "VID speciālists",
        teksts: asTranscript(dispute),
        date: hoursAgo(2),
        origin: "assistant" as const,
        demo: true,
      },
      {
        id: "demo-letter-customs",
        kategorija: "Muitas jautājumi",
        tema: "Muitas lēmuma vai preču klasifikācijas strīds",
        struktura: "Muitas pārvalde",
        teksts: asTranscript(customs),
        date: hoursAgo(24 * 12),
        origin: "assistant" as const,
        demo: true,
      },
      {
        id: "demo-letter-client-eds",
        kategorija: "Dokumenta iesniegšana",
        tema: "Jautājums — Jautājums par EDS lietošanu",
        struktura: "VID speciālists",
        teksts: "Nevaru atrast, kur EDS iesniegt gada ienākumu deklarāciju. Lūdzu, paskaidrojiet soļus.",
        date: hoursAgo(24 * 6),
        origin: "client" as const,
        demo: true,
      },
      {
        id: "demo-letter-client-service",
        kategorija: "Dokumenta iesniegšana",
        tema: "Sūdzība — Sūdzība par klientu apkalpošanu",
        struktura: "VID speciālists",
        teksts: "Konsultācijā pa tālruni nesaņēmu atbildi par deklarācijas termiņu. Lūdzu saziņu no speciālista.",
        date: hoursAgo(24 * 15),
        origin: "client" as const,
        demo: true,
      },
    ],
  };
}

/** Pievieno paraugus vienu reizi. Pēc dzēšanas tos neatjauno. */
export function ensureDemoHistory() {
  if (sessionStorage.getItem(demoSeedKey)) return readStore();
  const store = readStore();
  const demo = demoCorrespondence();
  const knownChats = new Set(store.conversations.map((item) => item.id));
  const knownLetters = new Set(store.outbox.map((item) => (typeof item.id === "string" ? item.id : "")));
  const next = {
    conversations: [...demo.conversations.filter((item) => !knownChats.has(item.id)), ...store.conversations],
    outbox: [...demo.outbox.filter((item) => !knownLetters.has(item.id)), ...store.outbox],
  };
  sessionStorage.setItem(correspondenceKey, JSON.stringify(next));
  sessionStorage.setItem(demoSeedKey, "1");
  return next;
}
