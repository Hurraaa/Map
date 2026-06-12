"use client";

import { useMemo, useRef, useState } from "react";
import MapCanvas from "@/components/MapCanvas";
import StorePanel from "@/components/StorePanel";
import {
  CATEGORIES,
  FLOORS,
  STORES,
  type Category,
  type FloorId,
  type Store,
} from "@/data/mall";

function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[ığüşöç]/g, (c) => ({ ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c" })[c] ?? c);
}

export default function MallApp() {
  const [floor, setFloor] = useState<FloorId>("Z");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Store | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    store: Store;
    token: number;
  } | null>(null);
  const tokenRef = useRef(0);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return STORES.filter((s) => {
      if (category && s.category !== category) return false;
      if (q && !normalize(s.name).includes(q)) return false;
      return true;
    });
  }, [query, category]);

  const isFiltering = query.trim().length > 0 || category !== null;

  const goToStore = (store: Store) => {
    setSelected(store);
    if (store.floor !== floor) setFloor(store.floor);
    // Kat değişimi görünümü sıfırladığı için fly isteğini bir frame sonra gönder
    tokenRef.current += 1;
    const token = tokenRef.current;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setFocusRequest({ store, token }))
    );
  };

  return (
    <div className="flex flex-col h-dvh bg-slate-100">
      {/* Üst bar */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-xl font-extrabold tracking-tight text-anka">
            ANKAmall
          </span>
          <span className="hidden sm:inline text-sm font-medium text-slate-400">
            Kat Planı
          </span>
        </div>
        <div className="relative flex-1 max-w-md ml-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mağaza ara…"
            className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none focus:border-anka/50 focus:ring-2 focus:ring-anka/10 transition"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
        </div>
      </header>

      {/* Kategori çipleri */}
      <div className="flex gap-2 px-4 py-2.5 bg-white border-b border-slate-200 overflow-x-auto z-10 [scrollbar-width:none]">
        <Chip
          active={category === null}
          label="Tümü"
          onClick={() => setCategory(null)}
        />
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <Chip
            key={c}
            active={category === c}
            label={CATEGORIES[c].label}
            dot={CATEGORIES[c].stroke}
            onClick={() => setCategory(category === c ? null : c)}
          />
        ))}
      </div>

      <div className="relative flex flex-1 min-h-0">
        {/* Sol panel: sonuç listesi (masaüstü) */}
        <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-slate-200 z-10">
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isFiltering ? `${results.length} sonuç` : "Tüm Mağazalar"}
          </div>
          <ResultList
            stores={results}
            selectedId={selected?.id ?? null}
            onPick={goToStore}
          />
        </aside>

        {/* Harita */}
        <main className="relative flex-1 min-w-0">
          <MapCanvas
            floor={floor}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            focusRequest={focusRequest}
          />

          {/* Kat seçici */}
          <div className="absolute top-4 right-4 flex flex-col rounded-2xl bg-white shadow-md border border-slate-200 overflow-hidden z-10">
            {FLOORS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFloor(f.id);
                  setSelected(null);
                }}
                className={`w-12 h-12 text-sm font-bold transition ${
                  floor === f.id
                    ? "bg-anka text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
                title={f.name}
              >
                {f.shortLabel}
              </button>
            ))}
          </div>

          {/* Aktif kat etiketi */}
          <div className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur px-4 py-2 text-sm font-semibold text-slate-700 shadow-md border border-slate-200 z-10">
            {FLOORS.find((f) => f.id === floor)?.name}
          </div>

          {/* Mobil: filtreli sonuç listesi haritanın üstünde */}
          {isFiltering && !selected && (
            <div className="lg:hidden absolute left-3 right-3 top-16 max-h-64 overflow-y-auto rounded-2xl bg-white shadow-xl border border-slate-200 z-10">
              <ResultList
                stores={results}
                selectedId={null}
                onPick={goToStore}
                compact
              />
            </div>
          )}

          {/* Temsili plan notu */}
          <div className="absolute bottom-4 left-4 text-[11px] text-slate-400 z-10 pointer-events-none">
            Temsili plan — gerçek kat planları entegre edilecek
          </div>

          {/* Mağaza detay paneli */}
          {selected && (
            <StorePanel store={selected} onClose={() => setSelected(null)} />
          )}
        </main>
      </div>
    </div>
  );
}

function Chip({
  active,
  label,
  dot,
  onClick,
}: {
  active: boolean;
  label: string;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition ${
        active
          ? "bg-anka text-white border-anka"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
      }`}
    >
      {dot && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: active ? "#fff" : dot }}
        />
      )}
      {label}
    </button>
  );
}

function ResultList({
  stores,
  selectedId,
  onPick,
  compact,
}: {
  stores: Store[];
  selectedId: string | null;
  onPick: (s: Store) => void;
  compact?: boolean;
}) {
  if (stores.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-slate-400">
        Sonuç bulunamadı
      </div>
    );
  }
  return (
    <ul className={`overflow-y-auto ${compact ? "" : "flex-1"} divide-y divide-slate-100`}>
      {stores.map((s) => {
        const c = CATEGORIES[s.category];
        return (
          <li key={s.id}>
            <button
              onClick={() => onPick(s)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition ${
                selectedId === s.id ? "bg-red-50" : ""
              }`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                style={{ backgroundColor: c.fill, color: c.text }}
              >
                {s.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-700">
                  {s.name}
                </span>
                <span className="block text-xs text-slate-400">{c.label}</span>
              </span>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                {s.floor}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
