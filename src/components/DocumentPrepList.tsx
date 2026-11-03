import { useMemo, useState } from "react";
import { documentPrepGroups } from "@/lib/documents";

const tabs = ["Mans saraksts", "Pēc dokumentu grupas", "Visi dokumenti"] as const;

export function DocumentPrepList({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Mans saraksts");
  const rows = useMemo(() => {
    const fragment = query.trim().toLocaleLowerCase("lv");
    return documentPrepGroups.filter((name) => name.toLocaleLowerCase("lv").includes(fragment));
  }, [query]);

  return (
    <div className="fixed bottom-0 left-0 right-0 top-12 z-[45] overflow-auto bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <button type="button" onClick={onBack} className="rounded-md border border-primary px-3 py-2 text-sm text-primary">Atpakaļ</button>
      </div>
      <h2 className="bg-primary px-4 py-3 text-lg font-bold uppercase tracking-wide text-primary-foreground">Sagatavot dokumentu</h2>
      <div className="px-4 py-4">
        <input
          className="input-vid h-9 w-full"
          placeholder="Atlasīt pēc nosaukuma fragmenta"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Atlasīt pēc nosaukuma fragmenta"
        />
        <div className="mt-4 flex flex-wrap border-b border-border" role="tablist" aria-label="Dokumentu saraksts">
          {tabs.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={tab === name
                ? "-mb-px border border-b-background bg-card px-3 py-2 text-sm font-bold text-primary underline"
                : "px-3 py-2 text-sm text-primary underline"}
            >
              {name}
            </button>
          ))}
        </div>
        <ul className="border-t border-border">
          {rows.map((name) => (
            <li key={name} className="border-b border-border hover:bg-secondary">
              <span className="block px-2 py-2.5 text-sm text-primary underline">{name}</span>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nav dokumentu ar šādu nosaukuma fragmentu.</p>}
      </div>
    </div>
  );
}
