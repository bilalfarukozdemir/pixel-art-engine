# Renk ve palet tarifi

Kaynak: [SOURCES.md](SOURCES.md) — Pixel Logic, Bölüm 3. Kendi cümlelerimizle özet.

## Temeller

- Dijitalde renk üç kaydırıcıdır: **ton (hue), doygunluk (saturation), değer (value)**.
  Gölgelemeyi yalnız değerle (koyulaştırarak) yapma; ton ve doygunluğu da oynat.
- Palet zaman kazandırır, düzen sağlar ve animasyonda renklerin kare kare
  "yanıp sönmesini" önler. Ne kadar çok ton, o kadar zor animasyon.

## Rampa ve hue shifting

- Rampa: bir rengin koyudan açığa sıralı tonları. Rampalar renk paylaşabilir
  (iki rampanın aynı en koyu rengi kullanması uyum yaratır).
- **Hue shifting (renkli gölge):** ışık sarıya, gölge mavi-mora doğru kayar.
  Sarı gökkuşağının en parlak, mor en koyu tonudur. Yalnız koyulaştırılmış
  kahverenginin gölgesi "sıkıcı siyah"a gider; ton kaydırılınca sıcak bir kırmızıya döner.
- Kayma miktarı zevk meselesidir: hafif ya da cesur olabilir.
- **Doygunluk** ton gibi atmosfer kurmaz; vurguyu yönlendirir. Dört yaygın tercih:
  hepsi aynı doygunluk / ışıklar canlı-gölgeler donuk / gölgeler canlı-ışıklar donuk /
  tek bir tonun çok doygun olması.

## Siyahlar ve griler

- Saf siyahtan kaçın: koyu kahve, koyu mor, koyu yeşil ya da koyu gri kullan.
  Siyaha hafif renk vermek tamamen estetik bir karardır.
- Griler her yere uyar; özel ışıklı paletlerde (gece, ateş, zehir yeşili)
  rengin yerine geçip ışık altında değişmiş gibi görünür.
- İki tamamlayıcı rengin karışımı griye yakındır; geçişlerde iş görür.

## Seçim ilkeleri

- Gölgeye de renk ver, mümkünse ışığın tamamlayıcısı olsun. Işıklar parlak ve
  doygun, gölgeler biraz donuk ve tonu kaymış: güvenli bir başlangıç.
- Rampa uzunluğu sprite boyutuna bağlı: küçük sprite'ta 2-3 tonluk tek rampa
  yeter. Bu boyutta iki yakın ton ayırt edilmez, katkısı olmaz.
- Soğuk renkler (mavi, mor, turkuaz) hüzün ve soğukluk; sıcak renkler (kırmızı,
  turuncu, sarı) neşe ve sıcaklık. Griler nötrdür.
- Okunurluk birinci önceliktir: her karakterin bir **ana rengi** ve onunla
  kontrast yapan bir **yan rengi** olsun.
- Sınırlı palet: sprite'larda genelde 16 renk üst sınırdır. Renk azaltırken
  benzer rampaları birleştir, ışıkları paylaştır, görünmeyen AA tonlarını at.
- Sahnede renkleri yeniden kullan, ama birbirine değen farklı nesnelere aynı
  rengi verme; birbirine karışırlar.
- Çok kötü bir paletle çalışmak zorundaysan renkleri algılanan parlaklığa
  göre sırala, öyle kullan.

## Motorda

- `hueRamp(temel, {steps, hueShift, saturation})` → koyudan açığa rampa. Temel renk
  ortada aynen durur; luma soldan sağa artar (testle garanti).
  `saturation`: `arc` (varsayılan) | `flat` | `vividShadows` | `vividHighlights`.
- `inkOf(renk)` → saf siyah yerine kontur/göz için koyu, renkli ton.
- `paletteOf(p)`, `quantize(p, palet)`, `nearestColor(renk, palet)`: paleti çıkar, indir.
- `toHsv`, `fromHsv`, `luma`, `colorDistance`: ham renk araçları.
- Kontrol: `lintSprite(p, {maxColors: 16})` → `colors`, `similar`, `pureBlack`.
- Görsel karşılaştırma: reports/pixel-logic.png ilk satır (üstte yalnız `shade`, altta `hueRamp`).
