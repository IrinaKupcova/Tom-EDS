import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { Msg, Summary } from "@/lib/toms";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import tomsAsset from "@/assets/toms-portrait.asset.json";

export function TomsAvatar({ size = 36, virtualAssistant = false }: { size?: number; virtualAssistant?: boolean }) {
  return (
    <div
      className="toms-avatar"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden
    >
      <img src={tomsAsset.url} alt="" className="size-full rounded-full object-cover" />
    </div>
  );
}

type Props = {
  messages: Msg[];
  onSend: (text: string) => void;
  onAuth?: () => void;
  onSubmitSummary?: (s: Summary) => void;
  suggestions?: string[];
  compact?: boolean;
  busy?: boolean;
  virtualAssistant?: boolean;
  hideAvatar?: boolean;
};
export function TomsChat({
  messages,
  onSend,
  onAuth,
  onSubmitSummary,
  suggestions,
  compact,
  busy = false,
  virtualAssistant = false,
  hideAvatar = false,
}: Props) {
  const [text, setText] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const send = (value: string) => {
    if (!value.trim() || busy) return;
    onSend(value.trim());
    setText("");
  };
  const first = !messages.some((m) => m.from === "user");
  return (
    <div
      className={`toms-chat flex min-h-0 flex-col ${compact ? "h-[410px]" : "h-[375px] sm:h-[375px]"}`}
    >
      <Conversation className="bg-chat-surface" aria-label={virtualAssistant ? "Saruna ar virtuālo asistentu" : "Saruna ar Tomu"}>
        <ConversationContent className="gap-3 p-4">
          {messages.map((m, i) =>
            m.from === "system" ? (
              <p key={i} className="text-center text-xs text-muted-foreground">
                {m.text}
              </p>
            ) : (
              <Message
                from={m.from === "user" ? "user" : "assistant"}
                key={i}
                className="max-w-full"
              >
                <div className={`flex items-start gap-2 ${m.from === "user" ? "justify-end" : ""}`}>
                  {m.from === "toms" && !hideAvatar && <TomsAvatar size={23} virtualAssistant={virtualAssistant} />}
                  <MessageContent className={m.from === "user" ? "bubble-user" : "bubble-toms"}>
                    <MessageResponse>{m.text}</MessageResponse>
                    {m.action === "auth" && onAuth && (
                      <Button onClick={onAuth} className="mt-2">
                        Autentificēties EDS
                      </Button>
                    )}
                    {m.action === "summary" &&
                      m.summary &&
                      onSubmitSummary &&
                      i === messages.length - 1 && (
                        <div className="mt-2 border-t border-border pt-3 text-xs">
                          <p className="mb-2 font-bold text-primary">Iesnieguma kopsavilkums</p>
                          <dl className="grid grid-cols-[85px_minmax(0,1fr)] gap-2">
                            <dt>Kategorija</dt>
                            <dd>{m.summary.kategorija}</dd>
                            <dt>Tēma</dt>
                            <dd>{m.summary.tema}</dd>
                            <dt>Adresāts</dt>
                            <dd>{m.summary.struktura}</dd>
                            <dt>Teksts</dt>
                            <dd className="whitespace-pre-wrap">{m.summary.teksts}</dd>
                          </dl>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (m.summary) onSubmitSummary(m.summary);
                              }}
                            >
                               {virtualAssistant ? "Nosūtīt speciālistam" : "Nosūtīt VID"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => textarea.current?.focus()}
                            >
                              Papildināt
                            </Button>
                          </div>
                        </div>
                      )}
                  </MessageContent>
                </div>
                {first && i === 0 && suggestions && (
                  <div className="ml-8 flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        onClick={() => send(s)}
                        className="h-auto rounded-full border-chat-primary px-3 py-1.5 text-left text-xs text-chat-primary whitespace-normal"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )}
              </Message>
            ),
          )}
          {busy && (
            <div className="flex items-center gap-2">
              {!hideAvatar && <TomsAvatar size={23} virtualAssistant={virtualAssistant} />}
              <Shimmer className="text-xs">{virtualAssistant ? "Virtuālais asistents sagatavo atbildi…" : "Toms raksta…"}</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton aria-label="Uz pēdējo ziņu" />
      </Conversation>
      <div className="border-t border-border bg-card p-3">
        <PromptInput className="toms-composer" onSubmit={({ text: value }) => send(value)}>
          <PromptInputTextarea
            ref={textarea}
            aria-label={virtualAssistant ? "Ziņa virtuālajam asistentam" : "Ziņa Tomam"}
            placeholder="Rakstiet šeit…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
            className="min-h-9 text-sm"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              aria-label="Nosūtīt ziņu"
              title="Nosūtīt ziņu"
              status={busy ? "submitted" : "ready"}
              disabled={busy || !text.trim()}
              className="size-8 shrink-0 rounded-full"
            >
              <Send size={15} />
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {virtualAssistant ? "Virtuālais asistents · atbildes un IS dati ir simulēti. Neievadiet īstus sensitīvus personas datus." : "Sarunu veic mākslīgais intelekts. Neievadiet sensitīvus personas datus."}
        </p>
      </div>
    </div>
  );
}

export function useScriptedChat(
  initial: Msg[],
  reply: (text: string, turn: number, history: Msg[]) => Msg[] | Promise<Msg[]>,
) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [busy, setBusy] = useState(false);
  const turn = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const current = useRef(messages);
  current.current = messages;
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );
  const reset = (next: Msg[] = []) => {
    if (pending.current) clearTimeout(pending.current);
    generation.current++;
    setBusy(false);
    turn.current = 0;
    setMessages(next);
  };
  const send = (text: string) => {
    if (busy) return;
    const history = [...current.current, { from: "user" as const, text }];
    setMessages(history);
    setBusy(true);
    const gen = generation.current;
    const started = Date.now();
    Promise.resolve(reply(text, turn.current++, history))
      .catch((): Msg[] => [{ from: "toms", text: "Neizdevās saņemt atbildi. Lūdzu, mēģiniet vēlreiz." }])
      .then((r) => {
        pending.current = setTimeout(() => {
          if (gen !== generation.current) return;
          setMessages((m) => [...m, ...r]);
          setBusy(false);
        }, Math.max(0, 650 - (Date.now() - started)));
      });
  };
  return { messages, setMessages, send, turn, busy, reset };
}
