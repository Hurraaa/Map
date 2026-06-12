"use client";

import { CATEGORIES, FLOORS, type Store } from "@/data/mall";

export default function StorePanel({
  store,
  onClose,
}: {
  store: Store;
  onClose: () => void;
}) {
  const c = CATEGORIES[store.category];
  const floorName = FLOORS.find((f) => f.id === store.floor)?.name;

  return (
    <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-80 rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-20 panel-enter">
      <div className="flex items-start gap-3 p-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold"
          style={{ backgroundColor: c.fill, color: c.text }}
        >
          {store.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-lg font-bold text-slate-800">
            {store.name}
          </h2>
          <p className="text-sm text-slate-400">
            {c.label} · {floorName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>

      {store.campaign && (
        <div className="mx-4 mb-3 rounded-2xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm font-medium text-anka">
          🏷 {store.campaign}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 pb-4 text-sm text-slate-500">
        <span>🕒 {store.hours}</span>
        <button
          disabled
          title="Yakında"
          className="ml-auto rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
        >
          Yol Tarifi (yakında)
        </button>
      </div>
    </div>
  );
}
