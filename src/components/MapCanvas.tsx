"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AMENITY_META,
  ATRIA,
  CATEGORIES,
  CORRIDOR,
  ENTRANCE_X,
  SHELL,
  VIEW,
  amenitiesOnFloor,
  storesOnFloor,
  type FloorId,
  type Store,
} from "@/data/mall";

interface Transform {
  x: number;
  y: number;
  k: number;
}

const MIN_K = 0.7;
const MAX_K = 6;
const IDENTITY: Transform = { x: 0, y: 0, k: 1 };

interface MapCanvasProps {
  floor: FloorId;
  selectedId: string | null;
  onSelect: (store: Store | null) => void;
  /** Değiştiğinde haritayı bu mağazaya uçurur (arama sonucundan seçim vb.) */
  focusRequest: { store: Store; token: number } | null;
}

export default function MapCanvas({
  floor,
  selectedId,
  onSelect,
  focusRequest,
}: MapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragState = useRef<{ moved: boolean }>({ moved: false });
  const flyAnim = useRef<number | null>(null);

  const stores = useMemo(() => storesOnFloor(floor), [floor]);
  const amenities = useMemo(() => amenitiesOnFloor(floor), [floor]);

  // İstemci koordinatını SVG kullanıcı koordinatına çevirir
  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const stopFly = useCallback(() => {
    if (flyAnim.current !== null) {
      cancelAnimationFrame(flyAnim.current);
      flyAnim.current = null;
    }
  }, []);

  const flyTo = useCallback(
    (target: Transform, duration = 450) => {
      stopFly();
      const from = { ...transformRef.current };
      const start = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const e = ease(t);
        setTransform({
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          k: from.k + (target.k - from.k) * e,
        });
        if (t < 1) flyAnim.current = requestAnimationFrame(step);
        else flyAnim.current = null;
      };
      flyAnim.current = requestAnimationFrame(step);
    },
    [stopFly]
  );

  // Arama/listeden seçim → mağazaya uç
  useEffect(() => {
    if (!focusRequest) return;
    const { shape } = focusRequest.store;
    const cx = shape.x + shape.w / 2;
    const cy = shape.y + shape.h / 2;
    const k = Math.min(
      2.2,
      Math.max(1.4, 420 / Math.max(shape.w, shape.h))
    );
    flyTo({
      k,
      x: VIEW.w / 2 - cx * k,
      y: VIEW.h / 2 - cy * k,
    });
  }, [focusRequest, flyTo]);

  // Kat değişince görünümü sıfırla
  useEffect(() => {
    setTransform(IDENTITY);
    stopFly();
  }, [floor, stopFly]);

  const zoomAt = useCallback(
    (px: number, py: number, factor: number) => {
      stopFly();
      setTransform((t) => {
        const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor));
        const ratio = k / t.k;
        return {
          k,
          x: px - (px - t.x) * ratio,
          y: py - (py - t.y) * ratio,
        };
      });
    },
    [stopFly]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const p = toSvgPoint(e.clientX, e.clientY);
      zoomAt(p.x, p.y, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    },
    [toSvgPoint, zoomAt]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      stopFly();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const p = toSvgPoint(e.clientX, e.clientY);
      pointers.current.set(e.pointerId, p);
      dragState.current.moved = false;
    },
    [stopFly, toSvgPoint]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      const p = toSvgPoint(e.clientX, e.clientY);

      if (pointers.current.size === 1) {
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        if (Math.abs(dx) + Math.abs(dy) > 1.5) dragState.current.moved = true;
        setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
        pointers.current.set(e.pointerId, p);
      } else if (pointers.current.size === 2) {
        // İki parmak: pinch zoom
        const entries = [...pointers.current.entries()];
        const other = entries.find(([id]) => id !== e.pointerId)![1];
        const distPrev = Math.hypot(prev.x - other.x, prev.y - other.y);
        const distNow = Math.hypot(p.x - other.x, p.y - other.y);
        if (distPrev > 0) {
          const mid = { x: (p.x + other.x) / 2, y: (p.y + other.y) / 2 };
          zoomAt(mid.x, mid.y, distNow / distPrev);
        }
        dragState.current.moved = true;
        pointers.current.set(e.pointerId, p);
      }
    },
    [toSvgPoint, zoomAt]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  }, []);

  const onBackgroundClick = useCallback(() => {
    if (!dragState.current.moved) onSelect(null);
  }, [onSelect]);

  const handleStoreClick = useCallback(
    (store: Store) => {
      if (dragState.current.moved) return;
      onSelect(store);
      const cx = store.shape.x + store.shape.w / 2;
      const cy = store.shape.y + store.shape.h / 2;
      const k = Math.max(transformRef.current.k, 1.6);
      flyTo({ k, x: VIEW.w / 2 - cx * k, y: VIEW.h / 2 - cy * k });
    },
    [flyTo, onSelect]
  );

  const zoomButtons = (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
      {[
        { label: "+", action: () => zoomAt(VIEW.w / 2, VIEW.h / 2, 1.4) },
        { label: "−", action: () => zoomAt(VIEW.w / 2, VIEW.h / 2, 1 / 1.4) },
        { label: "⌂", action: () => flyTo(IDENTITY) },
      ].map(({ label, action }) => (
        <button
          key={label}
          onClick={action}
          className="w-10 h-10 rounded-xl bg-white shadow-md border border-slate-200 text-slate-600 text-lg font-semibold hover:bg-slate-50 active:scale-95 transition"
          aria-label={label === "⌂" ? "Görünümü sıfırla" : label === "+" ? "Yakınlaştır" : "Uzaklaştır"}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const showVoids = floor === "1" || floor === "2";

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 touch-none select-none">
      {zoomButtons}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="w-full h-full"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          const p = toSvgPoint(e.clientX, e.clientY);
          zoomAt(p.x, p.y, 1.6);
        }}
      >
        <defs>
          <filter id="shellShadow" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="18"
              floodColor="#0f172a"
              floodOpacity="0.12"
            />
          </filter>
          <filter id="storeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="10"
              floodColor="#e2001a"
              floodOpacity="0.55"
            />
          </filter>
        </defs>

        {/* Arka plan tıklaması seçimi temizler */}
        <rect
          x="0"
          y="0"
          width={VIEW.w}
          height={VIEW.h}
          fill="transparent"
          onClick={onBackgroundClick}
        />

        <g
          transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}
        >
          <g key={floor} className="floor-enter">
            {/* Bina kabuğu */}
            <rect
              {...SHELL}
              width={SHELL.w}
              height={SHELL.h}
              rx={SHELL.rx}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="3"
              filter="url(#shellShadow)"
              onClick={onBackgroundClick}
            />

            {/* Koridor + giriş koridoru */}
            <rect
              x={CORRIDOR.x}
              y={CORRIDOR.y}
              width={CORRIDOR.w}
              height={CORRIDOR.h}
              rx={36}
              fill="#f1f5f9"
            />
            <rect
              x={ENTRANCE_X.x}
              y={SHELL.y + 8}
              width={ENTRANCE_X.w}
              height={SHELL.h - 16}
              rx={28}
              fill="#f1f5f9"
            />

            {/* Galeri boşlukları / atriumlar */}
            {ATRIA.map((a, i) =>
              showVoids ? (
                <g key={i}>
                  <circle
                    cx={a.cx}
                    cy={a.cy}
                    r={a.r}
                    fill="#e2e8f0"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                  />
                  <text
                    x={a.cx}
                    y={a.cy + a.r + 18}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#94a3b8"
                    className="pointer-events-none"
                  >
                    Galeri Boşluğu
                  </text>
                </g>
              ) : (
                <circle key={i} cx={a.cx} cy={a.cy} r={a.r} fill="#f1f5f9" />
              )
            )}

            {/* Girişler */}
            <EntranceLabel x={ENTRANCE_X.x + ENTRANCE_X.w / 2} y={SHELL.y + SHELL.h + 28} label="Ana Giriş" dir="up" />
            <EntranceLabel x={ENTRANCE_X.x + ENTRANCE_X.w / 2} y={SHELL.y - 16} label="Metro / Otopark" dir="down" />

            {/* Mağazalar */}
            {stores.map((store) => (
              <StoreShape
                key={store.id}
                store={store}
                selected={store.id === selectedId}
                zoom={transform.k}
                onClick={() => handleStoreClick(store)}
              />
            ))}

            {/* Olanak ikonları */}
            {amenities.map((a) => (
              <g key={a.id} className="pointer-events-none">
                <circle
                  cx={a.x}
                  cy={a.y}
                  r="16"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                <text
                  x={a.x}
                  y={a.y + 5.5}
                  textAnchor="middle"
                  fontSize={a.type === "info" ? "15" : "14"}
                  fontWeight={a.type === "info" ? 700 : 400}
                  fill="#475569"
                >
                  {AMENITY_META[a.type].glyph}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}

function EntranceLabel({
  x,
  y,
  label,
  dir,
}: {
  x: number;
  y: number;
  label: string;
  dir: "up" | "down";
}) {
  return (
    <g className="pointer-events-none">
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize="16"
        fontWeight={600}
        fill="#64748b"
      >
        {dir === "up" ? "▲ " : "▼ "}
        {label}
      </text>
    </g>
  );
}

function StoreShape({
  store,
  selected,
  zoom,
  onClick,
}: {
  store: Store;
  selected: boolean;
  zoom: number;
  onClick: () => void;
}) {
  const c = CATEGORIES[store.category];
  const { x, y, w, h } = store.shape;
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Mağaza adını kutuya sığacak şekilde böl (en fazla 2 satır)
  const lines = useMemo(() => splitLabel(store.name), [store.name]);
  const fontSize = Math.min(
    22,
    Math.max(11, Math.min(w / (Math.max(...lines.map((l) => l.length)) * 0.62), h / 3.2))
  );
  const showLabel = fontSize * zoom >= 7;

  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
      role="button"
      aria-label={store.name}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill={c.fill}
        stroke={selected ? "#e2001a" : c.stroke}
        strokeWidth={selected ? 4 : 1.5}
        filter={selected ? "url(#storeGlow)" : undefined}
        className="transition-[stroke,fill] duration-150 hover:brightness-[0.97]"
      />
      {showLabel && (
        <text
          x={cx}
          y={cy - ((lines.length - 1) * fontSize * 0.6) / 2 + fontSize * 0.35}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight={600}
          fill={c.text}
          className="pointer-events-none"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={cx} dy={i === 0 ? 0 : fontSize * 1.15}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}

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
