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
  GATES,
  SHELL,
  VIEW,
  amenitiesOnFloor,
  renovationsOnFloor,
  storesOnFloor,
  type FloorId,
  type Store,
} from "../src/data/mall";
import { findRoute, type RouteResult } from "../src/data/routing";

// Demo rota: F Kapısı → Sephora (Zemin → 1. Kat geçişli)
const DEMO = findRoute({ kind: "gate", label: "F Kapısı" }, "1-sephora");

function routeOverlay(floor: FloorId, route: RouteResult | null): string {
  if (!route) return "";
  const segs: string[] = [];
  let cur: string[] = [];
  for (const n of route.nodes) {
    if (n.floor === floor) cur.push(`${n.x},${n.y}`);
    else if (cur.length) {
      segs.push(cur.join(" "));
      cur = [];
    }
  }
  if (cur.length) segs.push(cur.join(" "));

  const lines = segs
    .map(
      (pts) => `
      <polyline points="${pts}" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${pts}" fill="none" stroke="#e2001a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 14"/>`
    )
    .join("");

  const transfers = route.transfers
    .filter((t) => t.floor === floor)
    .map(
      (t) => `<circle cx="${t.x}" cy="${t.y}" r="17" fill="#e2001a" stroke="#fff" stroke-width="2.5"/>
        <text x="${t.x}" y="${t.y + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">${t.dir === "up" ? "▲" : "▼"}</text>`
    )
    .join("");

  const first = route.nodes[0];
  const last = route.nodes[route.nodes.length - 1];
  const pin = (x: number, y: number, color: string, label: string) =>
    `<circle cx="${x}" cy="${y}" r="13" fill="#fff" stroke="${color}" stroke-width="4"/>
     <circle cx="${x}" cy="${y}" r="5" fill="${color}"/>
     <text x="${x}" y="${y - 22}" text-anchor="middle" font-size="14" font-weight="700" fill="${color}">${label}</text>`;
  const start = first.floor === floor ? pin(first.x, first.y, "#16a34a", "Başlangıç") : "";
  const end = last.floor === floor ? pin(last.x, last.y, "#e2001a", "Varış") : "";

  return lines + transfers + start + end;
}

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
      9,
      Math.min(w / (Math.max(...lines.map((l) => l.length)) * 0.74), h / 3.2)
    )
  );
  const y0 = cy - ((lines.length - 1) * fontSize * 0.6) / 2 + fontSize * 0.35;
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${cx}" dy="${i === 0 ? 0 : fontSize * 1.15}">${esc(line)}</tspan>`
    )
    .join("");
  const badge =
    store.unit && h >= 70 && w >= 55
      ? `<rect x="${x + 6}" y="${y + 6}" width="${14 + store.unit.length * 7}" height="17" rx="8.5" fill="#ffffff" opacity="0.9"/>
         <text x="${x + 13 + (store.unit.length * 7) / 2}" y="${y + 18.5}" text-anchor="middle" font-size="11" font-weight="700" fill="#64748b">${esc(store.unit)}</text>`
      : "";
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"
      fill="${c.fill}" stroke="${selected ? "#e2001a" : c.stroke}" stroke-width="${selected ? 4 : 1.5}"/>
    <text x="${cx}" y="${y0}" text-anchor="middle" font-size="${fontSize}"
      font-weight="600" fill="${c.text}">${tspans}</text>${badge}`;
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

  const gates = GATES.map((g) => {
    const y = g.side === "S" ? SHELL.y + SHELL.h + 30 : SHELL.y - 14;
    const arrow = g.side === "S" ? "▲" : "▼";
    return `<text x="${g.x}" y="${y}" text-anchor="middle" font-size="16" font-weight="600" fill="#64748b">${arrow} ${esc(g.label)}</text>`;
  }).join("");

  const renovations = renovationsOnFloor(floor)
    .map(
      (r) => `
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="24"
        fill="#fafaf9" stroke="#d6d3d1" stroke-width="2" stroke-dasharray="10 8"/>
      <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 - 10}" text-anchor="middle" font-size="20" font-style="italic" font-weight="600" fill="#f97316">Yenilenmeye burada</text>
      <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 16}" text-anchor="middle" font-size="20" font-style="italic" font-weight="600" fill="#f97316">devam ediyoruz!</text>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.w} ${VIEW.h}" font-family="DejaVu Sans, sans-serif">
    <rect width="${VIEW.w}" height="${VIEW.h}" fill="#f1f5f9"/>
    <text x="60" y="120" font-size="34" font-weight="800" fill="#e2001a">ANKAmall</text>
    <text x="280" y="120" font-size="26" font-weight="600" fill="#64748b">${esc(floorName)}</text>
    <rect x="${SHELL.x}" y="${SHELL.y}" width="${SHELL.w}" height="${SHELL.h}" rx="${SHELL.rx}" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
    <rect x="${CORRIDOR.x}" y="${CORRIDOR.y}" width="${CORRIDOR.w}" height="${CORRIDOR.h}" rx="36" fill="#f1f5f9"/>
    <rect x="${ENTRANCE_X.x}" y="${SHELL.y + 8}" width="${ENTRANCE_X.w}" height="${SHELL.h - 16}" rx="28" fill="#f1f5f9"/>
    ${atria}
    ${gates}
    ${renovations}
    ${stores.map((s) => storeSvg(s)).join("")}
    ${amenitySvg}
    ${routeOverlay(floor, DEMO)}
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
