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

- 🗺 **4 kat**: -1, Zemin, 1. Kat, 2. Kat — sağdaki kat seçiciyle geçiş
- 🔍 **Arama + kategori filtresi** — sonuca tıklayınca harita o mağazaya "uçar"
  (gerekirse katı da değiştirir)
- 🧭 **Yol tarifi (wayfinding)** — herhangi iki nokta (giriş veya mağaza) arası
  en kısa yol; katlar arası geçişte yürüyen merdiven/asansör kullanır, rotayı
  harita üzerine animasyonlu çizer ve adım adım yön tarifi verir
- 🏬 **Mağaza detay paneli** — kategori, kat, birim no, çalışma saati, kampanya
- 🤏 **Pan / zoom** — fare tekerleği, sürükleme, çift tık, mobilde pinch
- 🚻 Olanak ikonları: WC, asansör, yürüyen merdiven, danışma, ATM, mescit, bebek bakım
- 📱 Mobil uyumlu (alt panel + üstte sonuç listesi)

## Mimari

| Dosya | Görev |
|---|---|
| `src/data/mall.ts` | Tüm veri: katlar, kategoriler, mağazalar (geometri dahil), olanaklar, kapılar |
| `src/data/routing.ts` | Koridor graf modeli + Dijkstra ile en kısa yol; katlar arası geçiş |
| `src/components/MapCanvas.tsx` | SVG harita motoru: pan/zoom/pinch, fly-to, mağaza şekilleri, rota katmanı |
| `src/components/MallApp.tsx` | Uygulama kabuğu: arama, filtre, kat seçici, yol tarifi çubuğu |
| `src/components/SearchSelect.tsx` | Aranabilir açılır seçici (yol tarifi nereden/nereye) |
| `src/components/StorePanel.tsx` | Mağaza detay kartı (+ Yol Tarifi butonu) |
| `scripts/render-preview.ts` | Tarayıcısız statik PNG önizleme üretir (`npx tsx scripts/render-preview.ts`) |

## Yol tarifi nasıl çalışır?

`routing.ts` her katın koridor merkez hatlarını ~25 piksel aralıkla düğümlere
böler, komşu düğümleri birbirine bağlar. Mağaza "kapıları" ve giriş kapıları en
yakın koridor düğümüne eklenir. Yürüyen merdiven/asansör düğümleri komşu katlara
bir geçiş cezasıyla bağlanır. Dijkstra en kısa yolu bulur; sonuç, aktif kata
düşen parçalar halinde haritaya çizilir, kat değişimleri işaretlenir.

## Gerçek kat planlarını entegre etme

Şu anki geometri **temsilidir**. Gerçek planları işlemek için:

1. Gerçek kat planı görsellerini (`bodrumkat.png`, `zeminkat.png`, `kat1.png`,
   `kat2.png`) bu repoya `reference/` klasörüne ekleyin **veya** ortamın ağ izin
   listesine kaynak alan adını ekleyin.
2. Her mağazanın `shape` değeri (`src/data/mall.ts`) gerçek plandaki konuma göre
   güncellenir; gerekirse `Rect` yerine serbest `polygon` desteği eklenir.

## Yol haritası (sonraki adımlar)

- ✅ ~~A→B rota çizimi (koridor graf modeli üzerinde en kısa yol)~~
- ✅ ~~Katlar arası rota (asansör/yürüyen merdiven düğümleri)~~
- Kiosk modu ("Buradasınız" sabit nokta) ve QR ile mobile aktarma
- Mağaza logoları ve derin bağlantılar (`/magaza/[slug]`)
- Engelsiz rota seçeneği (sadece asansör)
- Eksik mağazaların tamamlanması (yüksek çözünürlüklü/güncel plan ile)
