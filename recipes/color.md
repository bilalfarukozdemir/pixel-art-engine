# Renk ve palet tarifi

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki renk bölümünden öğrenilenlerin
kendi cümlelerimizle özeti; örnekler motorun kendi çıktısıdır.

## Temeller

- Bir renk üç ayardan oluşur: **ton (hue), doygunluk (saturation), değer (value)**.
  Gölgeyi yalnız değeri düşürerek kurma; ton ve doygunluk da değişebilir.
- Sabit bir palet kararları hızlandırır, sahneyi tutarlı tutar ve animasyonda
  aynı yüzeyin kareden kareye farklı tonlara kaymasını önler. Ton sayısı
  arttıkça animasyon zorlaşır.

## Rampa ve ton kaydırma (hue shifting)

- Rampa, bir rengin koyudan açığa sıralı tonlarıdır. İki rampa aynı koyu ya da
  aynı açık tonu paylaşabilir; bu, sahneyi birbirine bağlar.
- **Ton kaydırma:** açık tonlar sarıya, koyu tonlar mavi-mora doğru kayar.
  Sarı algıda en parlak, mor en koyu tondur; ışık-gölge farkı bu yüzden
  yalnız değer farkından daha canlı okunur.
- Motor örneği, temel `#a8805f` (ton 27°):
  - Yalnız `shade` ile koyulaştırma: en koyu `#4c3a2b`, ton yine 27°.
    Gölge, aynı rengin kirli bir hâli gibi durur.
  - `hueRamp('#a8805f')`: `#332023 #6e4841 #a8805f #d0be8a #f7f7bc`.
    Koyu uç 351°'ye (kızıl-mor), açık uç 60°'ye (sarı) kayar.
- Ne kadar kaydırılacağı bir stil kararıdır: hafif de olabilir, belirgin de.
- **Doygunluk** vurguyu yönetir. Yaygın dört tercih: her tonda aynı doygunluk /
  ışıklar canlı, gölgeler donuk / gölgeler canlı, ışıklar donuk / tek bir
  tonun öne çıkması.

## Siyahlar ve griler

- Saf siyah yerine koyu, hafif renkli bir ton kullan (koyu kahve, mor, yeşil,
  gri). Ne kadar renk verileceği estetik bir karardır.
- Griler her yere uyar. Özel ışıklı sahnelerde (gece, ateş, zehir) rengin yerine
  geçip o ışık altında değişmiş gibi görünürler.
- Tamamlayıcı iki rengin karışımı griye yaklaşır; geçişlerde işe yarar.

## Seçim ilkeleri

- Gölgeye de renk ver. Işık parlak ve doygun, gölge biraz donuk ve tonu
  kaymış: güvenli bir başlangıç.
- Rampa uzunluğu sprite boyutuna bağlı: küçük sprite'ta 2-3 tonluk tek rampa
  yeter. Bu boyutta birbirine çok yakın iki ton ayırt edilmez, katkısı olmaz.
- Soğuk tonlar (mavi, mor, turkuaz) sakin ya da hüzünlü, sıcak tonlar
  (kırmızı, turuncu, sarı) enerjik bir atmosfer kurar. Griler nötrdür.
- Okunurluk önce gelir: her karakterin bir **ana rengi** ve onunla kontrast
  yapan bir **yan rengi** olsun.
- Sınırlı palet: sprite için çoğu zaman 16 renk üst sınırdır. Renk azaltırken
  benzer rampaları birleştir, ışıkları paylaştır, görünmeyen ara tonları at.
- Sahnede renkleri yeniden kullan, ama birbirine değen farklı nesnelere aynı
  rengi verme; birbirine karışırlar.
- Zorunlu, kötü bir paletle çalışıyorsan renkleri önce algılanan parlaklığa
  (`luma`) göre sırala, rampaları o sırayla kur.

## Motorda

- `hueRamp(temel, {steps, hueShift, saturation})`: koyudan açığa rampa. Temel renk
  ortada aynen durur; luma soldan sağa artar (testle garanti).
  `saturation`: `arc` (varsayılan) | `flat` | `vividShadows` | `vividHighlights`.
- `inkOf(renk)`: saf siyah yerine kontur ve göz için koyu, renkli ton.
- `paletteOf(p)`, `quantize(p, palet)`, `nearestColor(renk, palet)`: paleti çıkar, palete indir.
- `toHsv`, `fromHsv`, `luma`, `colorDistance`, `hueToward`: ham renk araçları.
- Kontrol: `lintSprite(p, {maxColors: 16})` → `colors`, `similar`, `pureBlack` bulguları.
- Görsel: reports/pixel-logic.png ilk satır (üstte yalnız `shade`, altta `hueRamp`).
