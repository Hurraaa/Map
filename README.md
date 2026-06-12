# ANKAmall İnteraktif Kat Planı

ANKAmall için interaktif AVM haritası prototipi. `ankamall-web` ile aynı stack:
**Next.js 16 + Tailwind v4 + TypeScript** — beğenildiğinde komponentler doğrudan
oraya taşınabilir.

## Çalıştırma

```bash
npm install
npm run dev   # http://localhost:3000
```

## Özellikler

- 🗺 **4 kat**: Bodrum, Zemin, 1. Kat, 2. Kat — sağdaki kat seçiciyle geçiş
- 🔍 **Arama + kategori filtresi** — sonuca tıklayınca harita o mağazaya "uçar"
  (gerekirse katı da değiştirir)
- 🏬 **Mağaza detay paneli** — kategori, kat, çalışma saati, kampanya
- 🤏 **Pan / zoom** — fare tekerleği, sürükleme, çift tık, mobilde pinch
- 🚻 Olanak ikonları: WC, asansör, yürüyen merdiven, danışma, ATM, mescit, bebek bakım
- 📱 Mobil uyumlu (alt panel + üstte sonuç listesi)

## Mimari

| Dosya | Görev |
|---|---|
| `src/data/mall.ts` | Tüm veri: katlar, kategoriler, mağazalar (geometri dahil), olanaklar |
| `src/components/MapCanvas.tsx` | SVG harita motoru: pan/zoom/pinch, fly-to animasyonu, mağaza şekilleri |
| `src/components/MallApp.tsx` | Uygulama kabuğu: arama, filtre çipleri, kat seçici, sonuç listesi |
| `src/components/StorePanel.tsx` | Mağaza detay kartı |
| `scripts/render-preview.ts` | Tarayıcısız statik PNG önizleme üretir (`npx tsx scripts/render-preview.ts`) |

## Gerçek kat planlarını entegre etme

Şu anki geometri **temsilidir**. Gerçek planları işlemek için:

1. Gerçek kat planı görsellerini (`bodrumkat.png`, `zeminkat.png`, `kat1.png`,
   `kat2.png`) bu repoya `reference/` klasörüne ekleyin **veya** ortamın ağ izin
   listesine kaynak alan adını ekleyin.
2. Her mağazanın `shape` değeri (`src/data/mall.ts`) gerçek plandaki konuma göre
   güncellenir; gerekirse `Rect` yerine serbest `polygon` desteği eklenir.

## Yol haritası (faz 2)

- A→B rota çizimi (koridor graf modeli üzerinde en kısa yol)
- Katlar arası rota (asansör/yürüyen merdiven düğümleri)
- Kiosk modu ("Buradasınız" sabit nokta)
- Mağaza logoları ve derin bağlantılar (`/magaza/[slug]`)
