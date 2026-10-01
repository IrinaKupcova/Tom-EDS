import { useEffect, useRef, useState } from "react";
import type { Msg, Summary } from "@/lib/toms";

export function TomsAvatar({ size = 36 }: { size?: number }) {
  return (
    <div className="toms-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      T
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
};

export function TomsChat({ messages, onSend, onAuth, onSubmitSummary, suggestions, compact }: Props) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const prev = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prev.current && messages[messages.length - 1].from === "user") setTyping(true);
    else setTyping(false);
    prev.current = messages.length;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const send = (v: string) => {
    if (!v.trim()) return;
    onSend(v.trim());
    setText("");
  };

  return (
    <div className={`flex flex-col ${compact ? "h-[420px]" : "h-[480px]"}`}>
      <div className="flex-1 space-y-3 overflow-y-auto bg-muted p-4">
        {messages.map((m, i) =>
          m.from === "system" ? (
            <div key={i} className="mx-auto w-fit rounded bg-secondary px-3 py-1 text-xs text-secondary-foreground">{m.text}</div>
          ) : (
            <div key={i} className={`flex gap-2 ${m.from === "user" ? "justify-end" : ""}`}>
              {m.from === "toms" && <TomsAvatar size={28} />}
              <div className={m.from === "user" ? "bubble-user" : "bubble-toms"}>
                <p>{m.text}</p>
                {m.action === "auth" && onAuth && (
                  <button onClick={onAuth} className="btn-vid mt-3 w-full">Autentificēties EDS</button>
                )}
                {m.action === "summary" && m.summary && onSubmitSummary && i === messages.length - 1 && (
                  <div className="mt-3 border border-border bg-card p-3 text-sm">
                    <div className="mb-2 font-bold text-primary">Iesnieguma kopsavilkums</div>
                    <dl className="grid grid-cols-[110px_1fr] gap-y-1">
                      <dt className="text-muted-foreground">Kategorija</dt><dd>{m.summary.kategorija}</dd>
                      <dt className="text-muted-foreground">Tēma</dt><dd>{m.summary.tema}</dd>
                      <dt className="text-muted-foreground">Adresāts</dt><dd>{m.summary.struktura}</dd>
                    </dl>
                    <p className="mt-2 text-xs text-muted-foreground">Toms aizpildīja automātiski – nekas nav jāizvēlas.</p>
                    <div className="mt-3 flex gap-2">
                      <button className="btn-vid" onClick={() => onSubmitSummary(m.summary!)}>Nosūtīt VID</button>
                      <button className="btn-vid-outline" onClick={() => send("Vēlos papildināt")}>Papildināt</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="flex gap-2"><TomsAvatar size={28} /><div className="bubble-toms text-muted-foreground">Toms raksta…</div></div>
        )}
        <div ref={endRef} />
      </div>
      {suggestions && messages.filter((m) => m.from === "user").length === 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-card px-3 pt-3">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="chip">{s}</button>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2 border-t border-border bg-card p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Uzrakstiet savu jautājumu…" className="input-vid flex-1" />
        <button className="btn-vid">Sūtīt</button>
      </form>
    </div>
  );
}

export function useScriptedChat(initial: Msg[], reply: (text: string, turn: number) => Msg[]) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const turn = useRef(0);
  const send = (text: string) => {
    setMessages((m) => [...m, { from: "user", text }]);
    const r = reply(text, turn.current++);
    setTimeout(() => setMessages((m) => [...m, ...r]), 900);
  };
  return { messages, setMessages, send, turn };
}
