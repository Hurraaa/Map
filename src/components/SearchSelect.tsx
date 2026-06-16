"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface SelectOption<T> {
  value: T;
  label: string;
  sub?: string;
}

function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[ığüşöç]/g, (c) => ({ ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c" })[c] ?? c);
}

interface Props<T> {
  options: SelectOption<T>[];
  value: SelectOption<T> | null;
  onChange: (opt: SelectOption<T>) => void;
  placeholder: string;
  accent?: string;
}

export default function SearchSelect<T>({
  options,
  value,
  onChange,
  placeholder,
  accent = "#e2001a",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const list = q
      ? options.filter((o) => normalize(o.label).includes(q))
      : options;
    return list.slice(0, 40);
  }, [options, query]);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
        }}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-slate-300 transition"
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
        <span className={`flex-1 truncate ${value ? "text-slate-700" : "text-slate-400"}`}>
          {value ? value.label : placeholder}
        </span>
        <span className="shrink-0 text-slate-300">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-slate-300"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-center text-sm text-slate-400">
                Sonuç yok
              </li>
            )}
            {filtered.map((o, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className="truncate text-sm font-medium text-slate-700">
                    {o.label}
                  </span>
                  {o.sub && (
                    <span className="shrink-0 text-xs text-slate-400">{o.sub}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
