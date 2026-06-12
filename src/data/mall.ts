// ANKAmall kat planı veri modeli.
// NOT: Geometri şu an temsilidir; gerçek kat planı görselleri (bodrumkat/zeminkat/kat1/kat2)
// erişilebilir olduğunda shape değerleri birebir güncellenecek. Mağaza listesi ANKAmall'un
// gerçek kiracı profiline yakın seçilmiştir.

export type FloorId = "B" | "Z" | "1" | "2";

export type Category =
  | "moda"
  | "ayakkabi"
  | "kozmetik"
  | "elektronik"
  | "ev"
  | "yemek"
  | "kafe"
  | "eglence"
  | "market"
  | "aksesuar"
  | "spor"
  | "cocuk";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Store {
  id: string;
  name: string;
  category: Category;
  floor: FloorId;
  shape: Rect;
  hours: string;
  campaign?: string;
}

export type AmenityType =
  | "wc"
  | "elevator"
  | "escalator"
  | "info"
  | "atm"
  | "mescit"
  | "baby";

export interface Amenity {
  id: string;
  type: AmenityType;
  floor: FloorId;
  x: number;
  y: number;
}

export interface FloorInfo {
  id: FloorId;
  name: string;
  shortLabel: string;
}

export const FLOORS: FloorInfo[] = [
  { id: "2", name: "2. Kat", shortLabel: "2" },
  { id: "1", name: "1. Kat", shortLabel: "1" },
  { id: "Z", name: "Zemin Kat", shortLabel: "Z" },
  { id: "B", name: "Bodrum Kat", shortLabel: "B" },
];

export const CATEGORIES: Record<
  Category,
  { label: string; fill: string; stroke: string; text: string }
> = {
  moda: { label: "Moda", fill: "#e0e7ff", stroke: "#818cf8", text: "#3730a3" },
  ayakkabi: { label: "Ayakkabı & Çanta", fill: "#fae8ff", stroke: "#d8b4fe", text: "#6b21a8" },
  kozmetik: { label: "Kozmetik", fill: "#fce7f3", stroke: "#f9a8d4", text: "#9d174d" },
  elektronik: { label: "Elektronik", fill: "#cffafe", stroke: "#67e8f9", text: "#155e75" },
  ev: { label: "Ev & Yaşam", fill: "#fef3c7", stroke: "#fcd34d", text: "#92400e" },
  yemek: { label: "Yeme & İçme", fill: "#ffedd5", stroke: "#fdba74", text: "#9a3412" },
  kafe: { label: "Kafe", fill: "#f1e7dc", stroke: "#d6bfa6", text: "#6f4e37" },
  eglence: { label: "Eğlence", fill: "#ede9fe", stroke: "#c4b5fd", text: "#5b21b6" },
  market: { label: "Süpermarket", fill: "#dcfce7", stroke: "#86efac", text: "#166534" },
  aksesuar: { label: "Aksesuar & Takı", fill: "#fef9c3", stroke: "#fde047", text: "#854d0e" },
  spor: { label: "Spor", fill: "#d1fae5", stroke: "#6ee7b7", text: "#065f46" },
  cocuk: { label: "Çocuk", fill: "#ffe4e6", stroke: "#fda4af", text: "#9f1239" },
};

export const AMENITY_META: Record<AmenityType, { label: string; glyph: string }> = {
  wc: { label: "Tuvaletler", glyph: "🚻" },
  elevator: { label: "Asansör", glyph: "🛗" },
  escalator: { label: "Yürüyen Merdiven", glyph: "⇅" },
  info: { label: "Danışma", glyph: "ℹ" },
  atm: { label: "ATM", glyph: "🏧" },
  mescit: { label: "Mescit", glyph: "🕌" },
  baby: { label: "Bebek Bakım Odası", glyph: "🍼" },
};

// ---- Plan geometrisi sabitleri (viewBox: 0 0 1600 1000) ----

export const VIEW = { w: 1600, h: 1000 };

export const SHELL = { x: 40, y: 130, w: 1520, h: 740, rx: 72 };

// Orta koridor bandı ve iki galeri (atrium) dairesi
export const CORRIDOR = { x: 340, y: 445, w: 920, h: 110 };
export const ATRIA = [
  { cx: 500, cy: 500, r: 52 },
  { cx: 1100, cy: 500, r: 52 },
];

// Kuzey/güney giriş koridoru (dükkân sıralarını ikiye böler)
export const ENTRANCE_X = { x: 760, w: 80 };

const NORTH = { y: 160, h: 275 };
const SOUTH = { y: 565, h: 275 };
const SEG1 = { x0: 360, x1: ENTRANCE_X.x };
const SEG2 = { x0: ENTRANCE_X.x + ENTRANCE_X.w, x1: 1240 };
const ANCHOR_L = { x: 70, y: 160, w: 250, h: 680 };
const ANCHOR_R = { x: 1280, y: 160, w: 250, h: 680 };

const DEFAULT_HOURS = "10:00 – 22:00";

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ığüşöç]/g, (c) => ({ ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type RowItem = [name: string, category: Category, weight: number, campaign?: string];

function row(
  floor: FloorId,
  x0: number,
  x1: number,
  y: number,
  h: number,
  items: RowItem[]
): Store[] {
  const gap = 8;
  const totalW = x1 - x0 - gap * (items.length - 1);
  const sum = items.reduce((acc, [, , w]) => acc + w, 0);
  let x = x0;
  return items.map(([name, category, weight, campaign]) => {
    const w = (totalW * weight) / sum;
    const store: Store = {
      id: `${floor}-${slug(name)}`,
      name,
      category,
      floor,
      shape: { x, y, w, h },
      hours: DEFAULT_HOURS,
      ...(campaign ? { campaign } : {}),
    };
    x += w + gap;
    return store;
  });
}

function anchor(
  floor: FloorId,
  side: "L" | "R",
  name: string,
  category: Category,
  campaign?: string
): Store {
  const r = side === "L" ? ANCHOR_L : ANCHOR_R;
  return {
    id: `${floor}-${slug(name)}`,
    name,
    category,
    floor,
    shape: { ...r },
    hours: DEFAULT_HOURS,
    ...(campaign ? { campaign } : {}),
  };
}

// ---- Mağazalar ----

const bodrum: Store[] = [
  anchor("B", "L", "Migros", "market", "Money kart ile %10 puan"),
  anchor("B", "R", "Decathlon", "spor"),
  ...row("B", SEG1.x0, SEG1.x1, NORTH.y, NORTH.h, [
    ["Teknosa", "elektronik", 1.6, "Sepette %15 indirim"],
    ["D&R", "elektronik", 1.2],
    ["Watsons", "kozmetik", 1],
    ["Gratis", "kozmetik", 1],
  ]),
  ...row("B", SEG2.x0, SEG2.x1, NORTH.y, NORTH.h, [
    ["English Home", "ev", 1.2],
    ["Madame Coco", "ev", 1],
    ["Karaca", "ev", 1.1],
    ["Tchibo", "kafe", 0.9],
  ]),
  ...row("B", SEG1.x0, SEG1.x1, SOUTH.y, SOUTH.h, [
    ["FLO", "ayakkabi", 1.5],
    ["Deichmann", "ayakkabi", 1.1],
    ["Penti", "moda", 1],
  ]),
  ...row("B", SEG2.x0, SEG2.x1, SOUTH.y, SOUTH.h, [
    ["Koton", "moda", 1.5, "2 al 1 öde"],
    ["DeFacto", "moda", 1.2],
    ["Mudo", "moda", 1],
  ]),
];

const zemin: Store[] = [
  anchor("Z", "L", "Boyner", "moda", "Sezon sonu %50'ye varan indirim"),
  anchor("Z", "R", "LC Waikiki", "moda"),
  ...row("Z", SEG1.x0, SEG1.x1, NORTH.y, NORTH.h, [
    ["Zara", "moda", 2],
    ["Sephora", "kozmetik", 1.1],
    ["MAC", "kozmetik", 0.8],
    ["Yves Rocher", "kozmetik", 0.8],
  ]),
  ...row("Z", SEG2.x0, SEG2.x1, NORTH.y, NORTH.h, [
    ["Pandora", "aksesuar", 1],
    ["Swarovski", "aksesuar", 1],
    ["Saat&Saat", "aksesuar", 1],
    ["Atasun Optik", "aksesuar", 1],
  ]),
  ...row("Z", SEG1.x0, SEG1.x1, SOUTH.y, SOUTH.h, [
    ["H&M", "moda", 1.8, "Yeni sezon geldi"],
    ["Mavi", "moda", 1.1],
    ["Levi's", "moda", 1],
  ]),
  ...row("Z", SEG2.x0, SEG2.x1, SOUTH.y, SOUTH.h, [
    ["Tommy Hilfiger", "moda", 1.1],
    ["Lacoste", "moda", 1],
    ["Vakko", "moda", 1],
    ["İpekyol", "moda", 1],
  ]),
];

const kat1: Store[] = [
  anchor("1", "L", "Marks & Spencer", "moda"),
  anchor("1", "R", "Mango", "moda"),
  ...row("1", SEG1.x0, SEG1.x1, NORTH.y, NORTH.h, [
    ["Pull&Bear", "moda", 1.2],
    ["Bershka", "moda", 1.2],
    ["Stradivarius", "moda", 1],
    ["Oysho", "moda", 0.9],
  ]),
  ...row("1", SEG2.x0, SEG2.x1, NORTH.y, NORTH.h, [
    ["Twist", "moda", 1],
    ["Network", "moda", 1],
    ["Damat Tween", "moda", 1],
    ["Kiğılı", "moda", 1],
  ]),
  ...row("1", SEG1.x0, SEG1.x1, SOUTH.y, SOUTH.h, [
    ["Nike", "spor", 1.5, "Outlet köşesi açıldı"],
    ["adidas", "spor", 1.2],
    ["Skechers", "ayakkabi", 1],
  ]),
  ...row("1", SEG2.x0, SEG2.x1, SOUTH.y, SOUTH.h, [
    ["Columbia", "spor", 1],
    ["Colin's", "moda", 1],
    ["Toyzz Shop", "cocuk", 1.2, "Oyuncaklarda %25 indirim"],
    ["B&G Store", "cocuk", 0.9],
  ]),
];

const kat2: Store[] = [
  anchor("2", "L", "Cinemaximum", "eglence", "Salı günleri 2 bilet 1 fiyatına"),
  anchor("2", "R", "Fundalya Eğlence Merkezi", "eglence"),
  ...row("2", SEG1.x0, SEG1.x1, NORTH.y, NORTH.h, [
    ["Burger King", "yemek", 1.1],
    ["McDonald's", "yemek", 1.1],
    ["KFC", "yemek", 1],
    ["Popeyes", "yemek", 1],
  ]),
  ...row("2", SEG2.x0, SEG2.x1, NORTH.y, NORTH.h, [
    ["Sbarro", "yemek", 1],
    ["Tavuk Dünyası", "yemek", 1.1],
    ["Köfteci Ramiz", "yemek", 1.1],
    ["Mado", "kafe", 1],
  ]),
  ...row("2", SEG1.x0, SEG1.x1, SOUTH.y, SOUTH.h, [
    ["Starbucks", "kafe", 1.4],
    ["Kahve Dünyası", "kafe", 1.1],
    ["Espressolab", "kafe", 1],
  ]),
  ...row("2", SEG2.x0, SEG2.x1, SOUTH.y, SOUTH.h, [
    ["Özsüt", "kafe", 1],
    ["Big Chefs", "yemek", 1.3],
    ["Happy Moon's", "yemek", 1.2],
  ]),
];

export const STORES: Store[] = [...bodrum, ...zemin, ...kat1, ...kat2];

// ---- Olanaklar (katlara göre) ----

export const AMENITIES: Amenity[] = [
  // Bodrum
  { id: "B-wc", type: "wc", floor: "B", x: 700, y: 500 },
  { id: "B-esc-1", type: "escalator", floor: "B", x: 500, y: 500 },
  { id: "B-esc-2", type: "escalator", floor: "B", x: 1100, y: 500 },
  { id: "B-elev", type: "elevator", floor: "B", x: 900, y: 500 },
  { id: "B-atm", type: "atm", floor: "B", x: 380, y: 500 },
  { id: "B-mescit", type: "mescit", floor: "B", x: 1220, y: 500 },
  // Zemin
  { id: "Z-info", type: "info", floor: "Z", x: 800, y: 500 },
  { id: "Z-wc", type: "wc", floor: "Z", x: 700, y: 500 },
  { id: "Z-esc-1", type: "escalator", floor: "Z", x: 500, y: 500 },
  { id: "Z-esc-2", type: "escalator", floor: "Z", x: 1100, y: 500 },
  { id: "Z-elev", type: "elevator", floor: "Z", x: 900, y: 500 },
  { id: "Z-atm", type: "atm", floor: "Z", x: 380, y: 500 },
  // Kat 1
  { id: "1-wc", type: "wc", floor: "1", x: 700, y: 500 },
  { id: "1-esc-1", type: "escalator", floor: "1", x: 500, y: 500 },
  { id: "1-esc-2", type: "escalator", floor: "1", x: 1100, y: 500 },
  { id: "1-elev", type: "elevator", floor: "1", x: 900, y: 500 },
  { id: "1-baby", type: "baby", floor: "1", x: 1220, y: 500 },
  // Kat 2
  { id: "2-wc", type: "wc", floor: "2", x: 700, y: 500 },
  { id: "2-esc-1", type: "escalator", floor: "2", x: 500, y: 500 },
  { id: "2-esc-2", type: "escalator", floor: "2", x: 1100, y: 500 },
  { id: "2-elev", type: "elevator", floor: "2", x: 900, y: 500 },
  { id: "2-baby", type: "baby", floor: "2", x: 380, y: 500 },
];

export function storesOnFloor(floor: FloorId): Store[] {
  return STORES.filter((s) => s.floor === floor);
}

export function amenitiesOnFloor(floor: FloorId): Amenity[] {
  return AMENITIES.filter((a) => a.floor === floor);
}
