// Kat planlarının statik PNG önizlemelerini üretir (tarayıcısız ortamlar için).
// Kullanım: npx tsx scripts/render-preview.ts
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  AMENITY_META,
  ATRIA,
  CATEGORIES,
  CORRIDOR,
  ENTRANCE_X,
  FLOORS,
  SHELL,
  VIEW,
  amenitiesOnFloor,
  storesOnFloor,
  type FloorId,
  type Store,
} from "../src/data/mall";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function splitLabel(name: string): string[] {
  if (name.length <= 12) return [name];
  const words = name.split(" ");
  if (words.length === 1) return [name];
  let best: string[] = [name];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best;
}

function storeSvg(store: Store, selected = false): string {
  const c = CATEGORIES[store.category];
  const { x, y, w, h } = store.shape;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const lines = splitLabel(store.name);
  const fontSize = Math.min(
    22,
    Math.max(
      11,
      Math.min(w / (Math.max(...lines.map((l) => l.length)) * 0.62), h / 3.2)
    )
  );
  const y0 = cy - ((lines.length - 1) * fontSize * 0.6) / 2 + fontSize * 0.35;
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${cx}" dy="${i === 0 ? 0 : fontSize * 1.15}">${esc(line)}</tspan>`
    )
    .join("");
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"
      fill="${c.fill}" stroke="${selected ? "#e2001a" : c.stroke}" stroke-width="${selected ? 4 : 1.5}"/>
    <text x="${cx}" y="${y0}" text-anchor="middle" font-size="${fontSize}"
      font-weight="600" fill="${c.text}">${tspans}</text>`;
}

function floorSvg(floor: FloorId): string {
  const stores = storesOnFloor(floor);
  const amenities = amenitiesOnFloor(floor);
  const showVoids = floor === "1" || floor === "2";
  const floorName = FLOORS.find((f) => f.id === floor)!.name;

  const atria = ATRIA.map((a) =>
    showVoids
      ? `<circle cx="${a.cx}" cy="${a.cy}" r="${a.r}" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="8 6"/>
         <text x="${a.cx}" y="${a.cy + a.r + 18}" text-anchor="middle" font-size="12" fill="#94a3b8">Galeri Boşluğu</text>`
      : `<circle cx="${a.cx}" cy="${a.cy}" r="${a.r}" fill="#f1f5f9"/>`
  ).join("");

  const amenitySvg = amenities
    .map(
      (a) => `
      <circle cx="${a.x}" cy="${a.y}" r="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="${a.x}" y="${a.y + 5.5}" text-anchor="middle" font-size="14" fill="#475569">${AMENITY_META[a.type].glyph}</text>`
    )
    .join("");

  const ex = ENTRANCE_X.x + ENTRANCE_X.w / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.w} ${VIEW.h}" font-family="DejaVu Sans, sans-serif">
    <rect width="${VIEW.w}" height="${VIEW.h}" fill="#f1f5f9"/>
    <text x="60" y="80" font-size="34" font-weight="800" fill="#e2001a">ANKAmall</text>
    <text x="280" y="80" font-size="26" font-weight="600" fill="#64748b">${esc(floorName)}</text>
    <rect x="${SHELL.x}" y="${SHELL.y}" width="${SHELL.w}" height="${SHELL.h}" rx="${SHELL.rx}" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
    <rect x="${CORRIDOR.x}" y="${CORRIDOR.y}" width="${CORRIDOR.w}" height="${CORRIDOR.h}" rx="36" fill="#f1f5f9"/>
    <rect x="${ENTRANCE_X.x}" y="${SHELL.y + 8}" width="${ENTRANCE_X.w}" height="${SHELL.h - 16}" rx="28" fill="#f1f5f9"/>
    ${atria}
    <text x="${ex}" y="${SHELL.y + SHELL.h + 28}" text-anchor="middle" font-size="16" font-weight="600" fill="#64748b">▲ Ana Giriş</text>
    <text x="${ex}" y="${SHELL.y - 16}" text-anchor="middle" font-size="16" font-weight="600" fill="#64748b">▼ Metro / Otopark</text>
    ${stores.map((s) => storeSvg(s)).join("")}
    ${amenitySvg}
  </svg>`;
}

mkdirSync("preview", { recursive: true });
for (const f of FLOORS) {
  const svg = floorSvg(f.id);
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 1600 },
  }).render();
  const file = `preview/kat-${f.id}.png`;
  writeFileSync(file, png.asPng());
  console.log("yazıldı:", file);
}
