# Subpiksel tarifi

Kaynak: [SOURCES.md](SOURCES.md) — Pixel Logic, Bölüm 8. Kendi cümlelerimizle özet.

Piksel en küçük birimdir; ikiye bölünemez. Subpiksel, bir pikselden küçük
hareket ya da kalınlık **yanılsamasıdır**. Durağan görselde buna AA ve çizgi
ağırlığı denir; animasyonda "subpiksel animasyon". Temeli AA'dır.

## Nerede

- Yavaşlayan/hızlanan ara kareler (ease): kare aralığı 1 pikselden azsa.
- Bekleme (idle) animasyonları, nefes, rüzgâr, titreme, gülme, sendeleme.
- Büyük harekette duran parçaları canlı tutmak.
- 32x32 ve altı sprite'larda parça kaydıracak yer yokken.

## İlkeler

- **Su bardağı benzetmesi:** bir pikselin parlaklığı komşusuna "dökülür"; toplam
  aynı kalır. Yarım piksel ilerleyen nokta iki pikseli yarı tonda boyar.
  Her zaman tam %50 olmak zorunda değil.
- Ara tonları **sprite'ta zaten olan renklerden** seç; matematik yapma, aradaki
  bir ton yeter. 1-2 AA tonu idealdir.
- Her pikseli kaydırma; bazı parçalar sabit kalabilir. Animasyon ve okunurluk,
  subpikselden önemlidir.
- **Yön kuralı:** subpiksel, animasyonun genel yönünü değil **şeklin açısını**
  takip eder. Yatay bir kıvrım yukarı-aşağı hareket ederken sağa-sola kayar.
- Şekil yeni sıraya geçerken tek piksel "fırlamasın": en az 2-3 piksellik geçiş yap.
- **Yüzü/gözü subpiksellendirme**; bozulursa hemen göze batar. Göz iki konum
  arasında gidip gelsin, gövde kaysın.
- Ara kareler anahtar kareye **yakın** olmalı (favor). Ekranda kısa kalan ara
  karenin tuhaf görünmesi sorun değil.
- Subpiksel ≠ hareket eden gölge. Konu harekettir, ışık değil.
- Abartma: jöle gibi erir. Zaman alıcıdır; gerekmiyorsa yapma.
- Çizgi ağırlığı: ince çizgi açık zeminde daha açık görünür, koyu şekil içinde tersi.
  İkiye bölünmüş piksel (split pixel) çizgi ağırlığını ince ayarlar.

## Seçmeli kontur ve zemin

- Seçmeli kontur yalnız saydam zeminli katmanda anlamlıdır; nesne ortama karışır.
- Kırık kontur koyu zeminde en iyi, açık zeminde jaggy görünür. Zemin karışıksa:
  daha dolu kontur yap, başka kontur türü kullan ya da yalnız AA ipuçları ekle.

## Motorda

- `subpixelShift(sprite, dx, dy)` → yarım piksel kaydırılmış **taslak** kare
  (dx, dy ∈ -1, 0, 1). Yöntem: 2x büyüt, 1 yüksek piksel kaydır, kutu filtreyle
  küçült, sprite'ın kendi paletine indir. Kitap da bu yöntemi "hızlı ama güvenilmez"
  sayar: sonucu **elle temizle**, özellikle yüzü.
- Kullanım: kare A, `subpixelShift(A, 0, -1)`, kare B (A'nın 1px yukarısı) → 3 karelik yumuşak bob.
- `selectiveOutline(p, {light, lit, mid, dark, palette})`: zemin koyuysa `lit`'i
  düşük, açıksa yüksek tut.
- Görsel: reports/pixel-logic.png sağ alt (orijinal, yarım, tam piksel).
