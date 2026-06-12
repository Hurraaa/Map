// ANKAmall kat planı veri modeli.
// Mağaza adları ve birim numaraları, gerçek kat planı görsellerinden
// (reference/*.png) okunmuştur. Görseller düşük çözünürlüklü olduğundan
// bazı adlar/numaralar yaklaşıktır; liste tam değildir ve daha iyi kaynak
// geldikçe genişletilecektir. Geometri, gerçek planın yapısını (batı bloku,
// orta omurga, doğu bloku, A/E/F/2 kapıları) stilize ederek izler.

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
  | "cocuk"
  | "hizmet";

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
  unit?: string;
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
  { id: "B", name: "-1. Kat", shortLabel: "-1" },
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
  hizmet: { label: "Hizmet", fill: "#e2e8f0", stroke: "#94a3b8", text: "#334155" },
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

export const SHELL = { x: 80, y: 220, w: 1440, h: 560, rx: 56 };

// Orta koridor ve galeri (atrium) boşlukları
export const CORRIDOR = { x: 400, y: 460, w: 750, h: 80 };
export const ATRIA = [
  { cx: 500, cy: 500, r: 52 },
  { cx: 1100, cy: 500, r: 52 },
];

// Kuzey/güney giriş koridoru (2 Kapısı / E Kapısı hattı)
export const ENTRANCE_X = { x: 760, w: 80 };

export interface Gate {
  label: string;
  x: number;
  side: "N" | "S";
}

export const GATES: Gate[] = [
  { label: "F Kapısı", x: 255, side: "N" },
  { label: "2 Kapısı", x: 800, side: "N" },
  { label: "A Kapısı", x: 255, side: "S" },
  { label: "E Kapısı", x: 800, side: "S" },
];

// Tadilat bölgeleri ("Yenilenmeye burada devam ediyoruz!")
export const RENOVATIONS: Array<{ floor: FloorId } & Rect> = [
  { floor: "1", x: 110, y: 250, w: 645, h: 500 },
  { floor: "2", x: 110, y: 250, w: 290, h: 500 },
];

// Omurga sıraları
const NORTH = { y: 300, h: 152 };
const SOUTH = { y: 548, h: 152 };
const SEG1 = { x0: 410, x1: ENTRANCE_X.x - 5 };
const SEG2 = { x0: ENTRANCE_X.x + ENTRANCE_X.w + 5, x1: 1140 };

const DEFAULT_HOURS = "10:00 – 22:00";

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ığüşöç]/g, (c) => ({ ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function store(
  floor: FloorId,
  name: string,
  category: Category,
  shape: Rect,
  unit?: string,
  extra?: Partial<Store>
): Store {
  return {
    id: `${floor}-${slug(name)}`,
    name,
    category,
    floor,
    shape,
    hours: DEFAULT_HOURS,
    ...(unit ? { unit } : {}),
    ...extra,
  };
}

type RowItem = [name: string, category: Category, unit: string, weight?: number];

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
  const sum = items.reduce((acc, item) => acc + (item[3] ?? 1), 0);
  let x = x0;
  return items.map(([name, category, unit, weight]) => {
    const w = (totalW * (weight ?? 1)) / sum;
    const s = store(floor, name, category, { x, y, w, h }, unit);
    x += w + gap;
    return s;
  });
}

// ---- -1. Kat: ev, elektronik, çocuk ----

const bodrum: Store[] = [
  store("B", "Enza Home", "ev", { x: 110, y: 250, w: 290, h: 230 }, "60"),
  store("B", "Yatsan", "ev", { x: 110, y: 500, w: 135, h: 250 }, "55"),
  store("B", "Bosch", "ev", { x: 255, y: 500, w: 145, h: 250 }, "61"),
  ...row("B", SEG1.x0, SEG1.x1, NORTH.y, NORTH.h, [
    ["Madame Coco", "ev", "4"],
    ["Siemens", "ev", "7"],
    ["Arçelik", "ev", "8"],
    ["Tefal", "ev", "9"],
  ]),
  ...row("B", SEG2.x0, SEG2.x1, NORTH.y, NORTH.h, [
    ["Linens", "ev", "11"],
    ["Chicco", "cocuk", "14"],
    ["Mothercare", "cocuk", "17"],
    ["KRC", "ev", "18"],
  ]),
  ...row("B", SEG1.x0, SEG1.x1, SOUTH.y, SOUTH.h, [
    ["Favori", "aksesuar", "22"],
    ["Tchibo", "kafe", "24"],
    ["Office 1", "ev", "27"],
    ["Turkcell", "elektronik", "28"],
  ]),
  ...row("B", SEG2.x0, SEG2.x1, SOUTH.y, SOUTH.h, [
    ["Hisar", "ev", "29"],
    ["Joker Maxitoys", "cocuk", "30"],
    ["Vodafone", "elektronik", "31"],
  ]),
  store("B", "Teknosa", "elektronik", { x: 1150, y: 250, w: 340, h: 230 }, "34", {
    campaign: "Sepette %15 indirim",
  }),
  store("B", "Gold", "elektronik", { x: 1150, y: 500, w: 104, h: 118 }, "37"),
  store("B", "English Home", "ev", { x: 1264, y: 500, w: 104, h: 118 }, "40"),
  store("B", "THY", "hizmet", { x: 1378, y: 500, w: 112, h: 118 }, "41"),
  store("B", "Toyzz Shop", "cocuk", { x: 1150, y: 630, w: 104, h: 120 }, "43", {
    campaign: "Oyuncaklarda %25 indirim",
  }),
  store("B", "Samsung", "elektronik", { x: 1264, y: 630, w: 104, h: 120 }, "44"),
  store("B", "Avea", "elektronik", { x: 1378, y: 630, w: 112, h: 120 }, "50"),
  // Kiosklar
  store("B", "Baloncu", "cocuk", { x: 560, y: 470, w: 60, h: 60 }, "K1"),
  store("B", "Cook Shop", "ev", { x: 632, y: 470, w: 60, h: 60 }, "K3"),
];

// ---- Zemin Kat: hipermarket, yapı market, moda ----

const zemin: Store[] = [
  store("Z", "5M Migros", "market", { x: 110, y: 250, w: 290, h: 250 }, "70", {
    campaign: "Money kart ile %10 puan",
  }),
  store("Z", "Boyner", "moda", { x: 110, y: 520, w: 290, h: 230 }, "124", {
    campaign: "Sezon sonu %50'ye varan indirim",
  }),
  ...row("Z", SEG1.x0, SEG1.x1, NORTH.y, NORTH.h, [
    ["Polo Garage", "moda", "71"],
    ["Opmar Optik", "aksesuar", "72"],
    ["Tekin Acar", "kozmetik", "74"],
    ["Altınbaş", "aksesuar", "80"],
    ["Atasay", "aksesuar", "83"],
  ]),
  ...row("Z", SEG2.x0, SEG2.x1, NORTH.y, NORTH.h, [
    ["Seçil", "moda", "87"],
    ["Cacharel", "moda", "88"],
    ["Desa", "ayakkabi", "89"],
    ["Kip", "moda", "90"],
    ["Sarar", "moda", "95"],
  ]),
  ...row("Z", SEG1.x0, SEG1.x1, SOUTH.y, SOUTH.h, [
    ["İpekyol", "moda", "102"],
    ["Ramsey", "moda", "103"],
    ["Steve Madden", "ayakkabi", "104"],
    ["Tüzün", "moda", "108"],
    ["Ets Tur", "hizmet", "109"],
  ]),
  ...row("Z", SEG2.x0, SEG2.x1, SOUTH.y, SOUTH.h, [
    ["Love My Body", "kozmetik", "113"],
    ["Ekol", "moda", "114"],
    ["ADL", "moda", "116"],
    ["Abdullah Kiğılı", "moda", "117"],
    ["Charles & Keith", "ayakkabi", "119"],
  ]),
  store("Z", "Koçtaş", "ev", { x: 1150, y: 250, w: 340, h: 240 }, "97", {
    campaign: "Bahçe ürünlerinde %20 indirim",
  }),
  store("Z", "Swarovski", "aksesuar", { x: 1150, y: 520, w: 165, h: 110 }, "123"),
  store("Z", "Mudo", "moda", { x: 1325, y: 520, w: 165, h: 110 }, "126"),
  store("Z", "Samsonite", "ayakkabi", { x: 1150, y: 640, w: 165, h: 110 }, "129"),
  store("Z", "YKM Sport", "spor", { x: 1325, y: 640, w: 165, h: 110 }, "132"),
  // Kiosk
  store("Z", "Flormar", "kozmetik", { x: 560, y: 470, w: 60, h: 60 }, "K11"),
];

// ---- 1. Kat: moda + food court + spor salonu (batı tarafı tadilatta) ----

const kat1: Store[] = [
  ...row("1", SEG2.x0, SEG2.x1, NORTH.y, NORTH.h, [
    ["Atasun Optik", "aksesuar", "137"],
    ["Derimod", "ayakkabi", "138"],
    ["Swatch", "aksesuar", "142"],
    ["The Body Shop", "kozmetik", "143"],
    ["Sephora", "kozmetik", "145"],
    ["Accessorize", "aksesuar", "146"],
  ]),
  ...row("1", SEG2.x0, SEG2.x1, SOUTH.y, SOUTH.h, [
    ["Shoes Center", "ayakkabi", "147"],
    ["Mavi Jeans", "moda", "151"],
    ["Colin's", "moda", "152"],
    ["Koton", "moda", "155", 1.1],
    ["Marks & Spencer", "moda", "159", 1.3],
  ]),
  store("1", "Food Court", "yemek", { x: 1150, y: 250, w: 340, h: 240 }, "148"),
  store("1", "MacFit", "spor", { x: 1150, y: 520, w: 340, h: 230 }, "150", {
    campaign: "Yıllık üyelikte 2 ay hediye",
  }),
  // Kiosk
  store("1", "Şahmeran Aksesuar", "aksesuar", { x: 856, y: 470, w: 60, h: 60 }, "K15"),
];

// ---- 2. Kat: genç moda & spor + sinema + elektronik ----

const kat2: Store[] = [
  store("2", "Cinemaximum", "eglence", { x: 410, y: 548, w: 345, h: 202 }, "211", {
    campaign: "Salı günleri 2 bilet 1 fiyatına",
    hours: "10:00 – 24:00",
  }),
  ...row("2", SEG1.x0, SEG1.x1, NORTH.y, NORTH.h, [
    ["Sportpoint", "spor", "177"],
    ["Billabong", "moda", "178"],
    ["Hummel", "spor", "179"],
    ["Vero Moda", "moda", "180"],
  ]),
  ...row("2", SEG2.x0, SEG2.x1, NORTH.y, NORTH.h, [
    ["Jack & Jones", "moda", "181"],
    ["Puma", "spor", "185"],
    ["Forever New", "moda", "186"],
  ]),
  ...row("2", SEG2.x0, SEG2.x1, SOUTH.y, SOUTH.h, [
    ["Stradivarius", "moda", "195"],
    ["Tally Weijl", "moda", "196"],
    ["Pull and Bear", "moda", "197"],
    ["Nike", "spor", "200"],
    ["Levi's & Dockers", "moda", "201"],
    ["Loft", "moda", "202"],
  ]),
  store("2", "Electro World", "elektronik", { x: 1150, y: 250, w: 340, h: 230 }, "190"),
  store("2", "FLO", "ayakkabi", { x: 1150, y: 500, w: 165, h: 250 }, "191"),
  store("2", "GS Store", "spor", { x: 1325, y: 500, w: 165, h: 250 }, "192"),
  // Kiosk
  store("2", "Tobacco Shop", "hizmet", { x: 856, y: 470, w: 60, h: 60 }, "K19"),
];

export const STORES: Store[] = [...bodrum, ...zemin, ...kat1, ...kat2];

// ---- Olanaklar (katlara göre) ----

export const AMENITIES: Amenity[] = [
  // -1. Kat
  { id: "B-wc", type: "wc", floor: "B", x: 712, y: 500 },
  { id: "B-esc-1", type: "escalator", floor: "B", x: 500, y: 500 },
  { id: "B-esc-2", type: "escalator", floor: "B", x: 1100, y: 500 },
  { id: "B-elev", type: "elevator", floor: "B", x: 940, y: 500 },
  { id: "B-atm", type: "atm", floor: "B", x: 430, y: 500 },
  { id: "B-mescit", type: "mescit", floor: "B", x: 1010, y: 500 },
  // Zemin
  { id: "Z-info", type: "info", floor: "Z", x: 800, y: 500 },
  { id: "Z-wc", type: "wc", floor: "Z", x: 660, y: 500 },
  { id: "Z-esc-1", type: "escalator", floor: "Z", x: 500, y: 500 },
  { id: "Z-esc-2", type: "escalator", floor: "Z", x: 1100, y: 500 },
  { id: "Z-elev", type: "elevator", floor: "Z", x: 940, y: 500 },
  { id: "Z-atm", type: "atm", floor: "Z", x: 430, y: 500 },
  // 1. Kat
  { id: "1-wc", type: "wc", floor: "1", x: 990, y: 500 },
  { id: "1-esc", type: "escalator", floor: "1", x: 1100, y: 500 },
  { id: "1-elev", type: "elevator", floor: "1", x: 940, y: 500 },
  { id: "1-baby", type: "baby", floor: "1", x: 1040, y: 500 },
  // 2. Kat
  { id: "2-wc", type: "wc", floor: "2", x: 990, y: 500 },
  { id: "2-esc-1", type: "escalator", floor: "2", x: 500, y: 500 },
  { id: "2-esc-2", type: "escalator", floor: "2", x: 1100, y: 500 },
  { id: "2-elev", type: "elevator", floor: "2", x: 940, y: 500 },
];

export function storesOnFloor(floor: FloorId): Store[] {
  return STORES.filter((s) => s.floor === floor);
}

export function amenitiesOnFloor(floor: FloorId): Amenity[] {
  return AMENITIES.filter((a) => a.floor === floor);
}

export function renovationsOnFloor(floor: FloorId) {
  return RENOVATIONS.filter((r) => r.floor === floor);
}
