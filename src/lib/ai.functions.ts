import { createServerFn } from "@tanstack/react-start";
import { complexTopicTitles, isGenericReply, toAiHistory, uncertainHandoff, type Msg } from "@/lib/toms";

type Turn = { role: "user" | "assistant"; content: string };

const INSTRUCTIONS = `Tu esi VID (Valsts ieņēmumu dienests, Latvija) virtuālais asistents. Atbildi latviski, īsi (līdz ~120 vārdiem) un runā ar lietotāju tieši.
Meklē aktuālu informāciju internetā, priekšroku dodot vid.gov.lv un likumi.lv, un norādi avotu saiti.
Ja tēma ir tāda, par kuru klienti bieži jautā vienu un to pašu (piem., gada ienākumu deklarācijas pārmaksas atmaksas termiņš, PVN pasta sūtījumiem no trešajām valstīm, deklarēšanas termiņi), pievieno atsevišķu rindkopu "**Bieži jautā:**" ar šo informāciju.
Nekad neizdomā konkrētas personas datus, parādus, pārmaksas vai deklarācijas statusu. Ja jautājums ir par personas datiem, saki, ka tie pieejami pēc EDS pieslēgšanās, un neizdomā skaitļus.
Parastu vēstuli (kā iesniegt, kur izlasīt, kā rīkoties) atbildi pats un iedod saites uz vid.gov.lv vai EDS. Vispirms ved uz pašapkalpošanos: EDS kreisā josla Dokumenti → Sagatavot dokumentu → No veidlapas. Neiesaki vēstuli speciālistam, ja darbību var izdarīt ar veidlapu vai izziņu.
Sarežģītību izvērtē tu pats. Klienta vārds “sarežģīts” nav kritērijs. Sarežģītās tēmas: ${complexTopicTitles.join("; ")}.
Ja vari dot viennozīmīgu atbildi, atbildi pats. Ja viennozīmīgas atbildes nav, atbildes pirmajā rindā ieraksti tieši NAV_VIENNOZIMIGAS un pēc tam vienu teikumu, kāpēc.
Ja jautājums ir ārpus pašreizējās jomas, pieklājīgi novirzi atpakaļ uz to.`;

export type AssistantDomain = "tax" | "customs" | "gambling";

export async function completeUnclearReply(scripted: Msg[], history: Msg[], domain: AssistantDomain): Promise<Msg[]> {
  if (!isGenericReply(scripted)) return scripted;
  try {
    const { text } = await askAssistant({ data: { history: toAiHistory(history), domain } });
    const usable = usableAssistantAnswer(text);
    if (usable && !/NAV_VIENNOZIMIGAS/i.test(usable)) return [{ from: "toms", text: usable }];
  } catch {
    /* The scripted handoff stays available when the model cannot be reached. */
  }
  return uncertainHandoff(history);
}

export function usableAssistantAnswer(text: string) {
  const answer = text.trim();
  if (!answer || /nav pieejams|neizdevās|pārāk daudz|kredīti ir beigušies|konfigurācijas/i.test(answer)) return null;
  return answer;
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: { history: Turn[]; domain: AssistantDomain }) => ({
    domain: d.domain === "customs" ? "customs" : d.domain === "gambling" ? "gambling" : "tax",
    history: (Array.isArray(d.history) ? d.history : []).slice(-12).map((t) => ({
      role: t.role === "assistant" ? "assistant" : "user",
      content: String(t.content).slice(0, 4000),
    })) as Turn[],
  }))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { text: "Asistents pašlaik nav pieejams (konfigurācijas kļūda)." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        tools: [{ type: "web_search" }],
        instructions: `${INSTRUCTIONS}\nPašreizējā joma: ${data.domain === "customs" ? "muita" : data.domain === "gambling" ? "azartspēles un izlozes" : "nodokļi"}.`,
        input: data.history,
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) return { text: "Pārāk daudz pieprasījumu. Lūdzu, mēģiniet pēc brīža." };
      if (res.status === 402) return { text: "Asistenta MI kredīti ir beigušies." };
      return { text: "Neizdevās saņemt atbildi. Lūdzu, mēģiniet vēlreiz." };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(line.slice(5));
          if (ev.type === "response.output_text.delta") text += ev.delta;
        } catch {
          /* partial */
        }
      }
    }
    return { text: text.replace(/\?utm_source=openai/g, "") || "Neizdevās sagatavot atbildi." };
  });
