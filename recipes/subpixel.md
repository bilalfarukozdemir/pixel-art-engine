# Subpiksel tarifi

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki subpiksel bölümünden öğrenilenlerin
kendi cümlelerimizle özeti.

Piksel en küçük birimdir; ikiye bölünemez. Subpiksel, bir pikselden küçük
hareket ya da kalınlık **yanılsamasıdır**. Durağan görselde bu AA ve çizgi
ağırlığıdır; animasyonda "subpiksel animasyon". Temeli AA'dır.

## Nerede

- Yavaşlayan ya da hızlanan ara kareler: iki kare arasındaki mesafe 1 pikselden azsa.
- Bekleme (idle) animasyonları: nefes, rüzgâr, titreme, sallanma.
- Büyük bir harekette duran parçaları canlı tutmak.
- 32x32 ve altı sprite'larda parça kaydıracak yer yokken.

## İlkeler

- Parlaklık bir pikselden komşusuna **aktarılır**, toplam aşağı yukarı aynı
  kalır: yarım piksel ilerleyen bir nokta, iki komşu pikseli ara tonda boyar.
  Oran her zaman tam %50 olmak zorunda değil.
- Ara tonları **sprite'ta zaten olan renklerden** seç; hesap yapmaya gerek yok,
  aradaki bir ton yeter. 1-2 ara ton idealdir.
- Her pikseli kaydırma; bazı parçalar sabit kalabilir. Animasyonun okunması,
  subpikselin kusursuzluğundan önemlidir.
- **Yön kuralı:** ara tonlar hareketin genel yönünü değil **şeklin kenarının
  açısını** takip eder. Yatay bir kenar dikey hareket ederken ara tonlar
  kenar boyunca yayılır.
- Bir kenar yeni bir sıraya geçerken tek piksel "sıçramasın": geçişi birkaç
  piksele yay.
- **Yüzü ve gözü subpiksellendirme**; bozulursa hemen göze batar. Göz iki konum
  arasında gidip gelsin, gövde kaysın.
- Ara kareler anahtar kareye yakın olmalı. Ekranda çok kısa kalan bir ara
  karenin tek başına tuhaf görünmesi sorun değil.
- Subpiksel hareket, gölgenin hareketi değildir; konu biçimin kendisidir.
- Abartma: her şey jöle gibi erir. Zaman alıcıdır; gerekmiyorsa yapma.
- Çizgi ağırlığı: ince çizgi açık zeminde daha açık, koyu bir şeklin içinde
  daha koyu görünür. İki ara tona bölünmüş bir piksel, çizgi ağırlığını ince ayarlar.

## Seçmeli kontur ve zemin

- Seçmeli kontur yalnız saydam zeminli katmanda anlamlıdır; nesne ortama karışır.
- Kırık kontur koyu zeminde en iyi, açık zeminde tırtıklı görünür. Zemin
  karışıksa: daha dolu kontur yap, başka kontur türü kullan ya da yalnız
  birkaç ara ton ekle.

## Motorda

- `subpixelShift(sprite, dx, dy)` → yarım piksel kaydırılmış **taslak** kare
  (dx, dy ∈ -1, 0, 1). Yöntem: 2x büyüt, 1 yüksek-çözünürlük pikseli kaydır,
  kutu filtreyle küçült, sprite'ın kendi paletine indir. Otomatik sonuç
  güvenilir değildir; **elle temizle**, özellikle yüzü.
- Kullanım: kare A, `subpixelShift(A, 0, -1)`, kare B (A'nın 1px yukarısı) →
  üç karelik yumuşak bir inip kalkma.
- `selectiveOutline(p, {light, lit, mid, dark, palette})`: zemin koyuysa `lit`'i
  düşük, açıksa yüksek tut. `palette` vermek renk sayısını sınırlar.
- Görsel: reports/pixel-logic.png sağ alt (orijinal, yarım, tam piksel).
