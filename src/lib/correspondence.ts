import type { Msg, Summary } from "@/lib/toms";

export const correspondenceKey = "vid-eds-correspondence-v1";
export const specialistDraftKey = "vid-eds-specialist-draft";
/** Čata sarunas un nosūtītās vēstules prototipā paliek 30 dienas. Ieraksti bez datuma netiek izmesti. */
export const chatRetentionMs = 30 * 24 * 60 * 60 * 1000;

export type StoredConversation = {
  id: string;
  category: "chat" | "customs" | "gambling";
  messages: Msg[];
  date?: string | undefined;
  cancelled?: boolean | undefined;
};

export function keptByRetention(date?: string | undefined) {
  if (!date || Number.isNaN(Date.parse(date))) return true;
  return Date.now() - Date.parse(date) < chatRetentionMs;
}

type Store = { conversations: StoredConversation[]; outbox: Array<{ date?: string | undefined }> };

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
