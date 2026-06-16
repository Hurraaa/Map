// ANKAmall yol tarifi (wayfinding) altyapısı.
// Koridor merkez hatlarından örneklenmiş düğümlerden bir graf kurar; mağaza
// kapılarını ve kapıları (giriş) en yakın koridor düğümüne bağlar; katlar arası
// geçişi yürüyen merdiven/asansör düğümleriyle modeller ve Dijkstra ile en kısa
// yolu bulur.

import {
  AMENITIES,
  AMENITY_META,
  GATES,
  STORES,
  type AmenityType,
  type FloorId,
  type Store,
} from "./mall";

export interface RNode {
  id: string;
  floor: FloorId;
  x: number;
  y: number;
  kind: "corridor" | "transport" | "store" | "gate";
  transport?: AmenityType;
}

interface Edge {
  to: string;
  w: number;
  transfer?: { type: AmenityType; from: FloorId; to: FloorId; dir: "up" | "down" };
}

export interface Transfer {
  type: AmenityType;
  floor: FloorId;
  toFloor: FloorId;
  dir: "up" | "down";
  x: number;
  y: number;
}

export interface RouteResult {
  nodes: RNode[];
  distance: number;
  meters: number;
  floors: FloorId[];
  steps: string[];
  transfers: Transfer[];
}

// Koridor geometrisi (mall.ts ile uyumlu)
const CY = 500; // yatay koridor merkez Y
const CX = 800; // dikey koridor merkez X
const H_RANGE: [number, number] = [400, 1150];
const V_RANGE: [number, number] = [280, 720];
const STEP = 25;
const LINK = 36; // koridor düğümü komşuluk eşiği
const TRANSFER_W = 150; // kat değişimi cezası (mesafe birimi)
const UNIT_TO_M = 0.14; // ~ piksel→metre ölçeği (tahmini)

const FLOOR_ORDER: FloorId[] = ["B", "Z", "1", "2"];

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ---- Graf (modül yüklenince bir kez kurulur) ----

const nodes = new Map<string, RNode>();
const adj = new Map<string, Edge[]>();

function addNode(n: RNode) {
  nodes.set(n.id, n);
  if (!adj.has(n.id)) adj.set(n.id, []);
}

function addEdge(a: string, b: string, w: number, transfer?: Edge["transfer"]) {
  adj.get(a)!.push({ to: b, w, transfer });
  adj.get(b)!.push({ to: a, w, transfer });
}

function nearestCorridor(floor: FloorId, p: { x: number; y: number }): RNode | null {
  let best: RNode | null = null;
  let bestD = Infinity;
  for (const n of nodes.values()) {
    if (n.kind !== "corridor" || n.floor !== floor) continue;
    const d = dist(n, p);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

function buildGraph() {
  // 1) Koridor düğümleri (her kat)
  for (const floor of FLOOR_ORDER) {
    for (let x = H_RANGE[0]; x <= H_RANGE[1]; x += STEP) {
      addNode({ id: `c:${floor}:h${x}`, floor, x, y: CY, kind: "corridor" });
    }
    for (let y = V_RANGE[0]; y <= V_RANGE[1]; y += STEP) {
      addNode({ id: `c:${floor}:v${y}`, floor, x: CX, y, kind: "corridor" });
    }
  }
  // Aynı kattaki koridor düğümlerini eşik mesafede bağla
  const corridor = [...nodes.values()].filter((n) => n.kind === "corridor");
  for (let i = 0; i < corridor.length; i++) {
    for (let j = i + 1; j < corridor.length; j++) {
      const a = corridor[i];
      const b = corridor[j];
      if (a.floor !== b.floor) continue;
      const d = dist(a, b);
      if (d <= LINK) addEdge(a.id, b.id, d);
    }
  }

  // 2) Ulaşım düğümleri (yürüyen merdiven / asansör)
  for (const a of AMENITIES) {
    if (a.type !== "escalator" && a.type !== "elevator") continue;
    const node: RNode = {
      id: `t:${a.id}`,
      floor: a.floor,
      x: a.x,
      y: a.y,
      kind: "transport",
      transport: a.type,
    };
    addNode(node);
    const c = nearestCorridor(a.floor, node);
    if (c) addEdge(node.id, c.id, dist(node, c));
  }
  // Komşu katların aynı konumdaki ulaşım düğümlerini bağla
  const transport = [...nodes.values()].filter((n) => n.kind === "transport");
  for (let fi = 0; fi < FLOOR_ORDER.length - 1; fi++) {
    const lo = FLOOR_ORDER[fi];
    const hi = FLOOR_ORDER[fi + 1];
    for (const a of transport) {
      if (a.floor !== lo) continue;
      for (const b of transport) {
        if (b.floor !== hi) continue;
        if (a.transport !== b.transport) continue;
        if (Math.abs(a.x - b.x) > 6 || Math.abs(a.y - b.y) > 6) continue;
        addEdge(a.id, b.id, TRANSFER_W, { type: a.transport!, from: lo, to: hi, dir: "up" });
      }
    }
  }

  // 3) Mağaza kapıları
  for (const s of STORES) {
    const p = doorPoint(s);
    const node: RNode = { id: `s:${s.id}`, floor: s.floor, x: p.x, y: p.y, kind: "store" };
    addNode(node);
    const c = nearestCorridor(s.floor, node);
    if (c) addEdge(node.id, c.id, dist(node, c));
  }

  // 4) Kapı (giriş) düğümleri — zemin kat
  for (const g of GATES) {
    const p = { x: g.x, y: CY };
    const node: RNode = { id: `g:${g.label}`, floor: "Z", x: g.x, y: g.side === "N" ? 230 : 770, kind: "gate" };
    addNode(node);
    const c = nearestCorridor("Z", p);
    if (c) addEdge(node.id, c.id, dist(node, c) + 40);
  }
}

function doorPoint(s: Store): { x: number; y: number } {
  const cx = s.shape.x + s.shape.w / 2;
  const cy = s.shape.y + s.shape.h / 2;
  if (cy < CY - 10) return { x: cx, y: s.shape.y + s.shape.h }; // kuzey → alt kenar
  if (cy > CY + 10) return { x: cx, y: s.shape.y }; // güney → üst kenar
  return cx < CX
    ? { x: s.shape.x + s.shape.w, y: cy } // batı bloku → sağ kenar
    : { x: s.shape.x, y: cy }; // doğu bloku → sol kenar
}

buildGraph();

// ---- Dijkstra ----

function dijkstra(startId: string, goalId: string): RNode[] | null {
  const distMap = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  distMap.set(startId, 0);
  // Basit öncelik kuyruğu (düğüm sayısı küçük olduğundan yeterli)
  const pq: Array<{ id: string; d: number }> = [{ id: startId, d: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { id } = pq.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    if (id === goalId) break;
    for (const e of adj.get(id) ?? []) {
      if (visited.has(e.to)) continue;
      const nd = (distMap.get(id) ?? Infinity) + e.w;
      if (nd < (distMap.get(e.to) ?? Infinity)) {
        distMap.set(e.to, nd);
        prev.set(e.to, id);
        pq.push({ id: e.to, d: nd });
      }
    }
  }

  if (!prev.has(goalId) && startId !== goalId) return null;
  const path: RNode[] = [];
  let cur: string | undefined = goalId;
  while (cur) {
    path.unshift(nodes.get(cur)!);
    cur = prev.get(cur);
  }
  return path;
}

export type OriginRef =
  | { kind: "gate"; label: string }
  | { kind: "store"; id: string };

function originNodeId(o: OriginRef): string {
  return o.kind === "gate" ? `g:${o.label}` : `s:${o.id}`;
}

export function findRoute(origin: OriginRef, destStoreId: string): RouteResult | null {
  const startId = originNodeId(origin);
  const goalId = `s:${destStoreId}`;
  if (!nodes.has(startId) || !nodes.has(goalId)) return null;
  const path = dijkstra(startId, goalId);
  if (!path || path.length < 2) return null;

  let distance = 0;
  for (let i = 1; i < path.length; i++) distance += dist(path[i - 1], path[i]);

  // Kat sırası
  const floors: FloorId[] = [];
  for (const n of path) if (floors[floors.length - 1] !== n.floor) floors.push(n.floor);

  // Geçişler
  const transfers: Transfer[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (a.floor !== b.floor) {
      const dir =
        FLOOR_ORDER.indexOf(b.floor) > FLOOR_ORDER.indexOf(a.floor) ? "up" : "down";
      transfers.push({
        type: a.transport ?? "escalator",
        floor: a.floor,
        toFloor: b.floor,
        dir,
        x: a.x,
        y: a.y,
      });
    }
  }

  const steps = buildSteps(origin, destStoreId, transfers);

  return {
    nodes: path,
    distance,
    meters: Math.max(5, Math.round((distance * UNIT_TO_M) / 5) * 5),
    floors,
    steps,
    transfers,
  };
}

function floorName(f: FloorId): string {
  return f === "B" ? "-1. Kat" : f === "Z" ? "Zemin Kat" : `${f}. Kat`;
}

function buildSteps(origin: OriginRef, destStoreId: string, transfers: Transfer[]): string[] {
  const steps: string[] = [];
  if (origin.kind === "gate") {
    steps.push(`${origin.label}'ndan girin`);
  } else {
    const s = STORES.find((x) => x.id === origin.id);
    steps.push(`${s?.name ?? "Başlangıç"} önünden hareket edin`);
  }
  steps.push("Orta koridordan ilerleyin");
  for (const t of transfers) {
    const v = AMENITY_META[t.type].label.toLocaleLowerCase("tr");
    steps.push(
      `${v} ile ${floorName(t.toFloor)}'a ${t.dir === "up" ? "çıkın" : "inin"}`
    );
  }
  const dest = STORES.find((x) => x.id === destStoreId);
  if (dest) {
    steps.push(
      `${dest.name}${dest.unit ? ` (No ${dest.unit})` : ""} — vardınız 🎯`
    );
  }
  return steps;
}

// Başlangıç seçenekleri (kapılar + tüm mağazalar)
export interface OriginOption {
  ref: OriginRef;
  label: string;
  sub: string;
}

export function originOptions(): OriginOption[] {
  const gateOpts: OriginOption[] = GATES.map((g) => ({
    ref: { kind: "gate", label: g.label },
    label: g.label,
    sub: "Giriş",
  }));
  const storeOpts: OriginOption[] = STORES.map((s) => ({
    ref: { kind: "store", id: s.id },
    label: s.name,
    sub: `${floorName(s.floor)}${s.unit ? ` · No ${s.unit}` : ""}`,
  }));
  return [...gateOpts, ...storeOpts];
}
