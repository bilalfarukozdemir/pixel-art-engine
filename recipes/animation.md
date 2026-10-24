# Karakter ve hareket tarifi

## Telefon maliyeti — gerçek tüketici dersi

Statik gölgeleri her kare geometriyle çizme; aynı atlas'ta küçük sprite olarak
sakla. Bayrak gibi tekrar eden efektlerde az sayıda hazır kareyi değerlendir.
Değişmeyen UI'a her frame yazma; depth/z-index'i yalnız değişince güncelle.
Bu her motorda aynı kazancı garanti etmez; hedef telefonda A/B ölçümü gerekir.
Tower Defense / Phaser 4: 300 düşmanda geometri gölgeleri ~19 FPS, sprite düşman
gölgeleri ~46 FPS; tüm gölgeler+bayrak kareleri+UI/depth tekrar azaltması birlikte
~115–120 FPS. Son grubun katkıları tek tek ölçülmedi. HTML HUD gizlemek çözmedi.
(Telefonda ölçüm, 13 Eylül 2026.)
Masaüstü test hedef cihazın kanıtı değildir; ortalama FPS yanında >25/>100 ms
kareleri ve ısınmış cihazı kontrol et. Çizim tekniği ile sanat tasarımı ayrı sorunlar.

1. Karakteri native boyutta tanınır kıl: baş/gövde/ayak silueti önce.
2. Tek pozda gölge/ana/ışık tonlarını sabitle; rastgele her kare yeniden boyama.
3. Aynı tuval ve aynı ayak pivot'u kullan. Önce 6 karede küçük adım değişimi.
4. Gövde salınımı 0–1 pikselden başlasın. Büyük bob zıplama gibi görünür.
5. Döngüyü en az iki tur izle. frame 0 ve son pozun birleşimi sıçramamalı.
6. Sahne hareketiyle sprite kare değişimini ayır. Tam piksele yuvarlanan konum
   ile keskin sprite dokusu aynı karar değildir; hareket yumuşak olabilir.

Bayrak: direk sabit, kumaşın uç kısmı sinüsle daha fazla oynar.
Çalı: pivot kökte, birkaç derece yavaş salınım; gölge sabit.
Döngü zamanı normalize ise sin(2πt*n), n tam sayı seç.
RNG: sabit zemin ve hareketli parçalar ayrı kaynak. Math.random yok.

Oyun bitişinde animasyonları/efektleri temizle; simülasyon durduğunda render
canlı düşmanları yeniden oluşturmamalı. Bu kontrol tüketici oyunda yapılır.

## Animasyon ilkeleri (Pixel Logic, Bölüm 9 — özet)

Kaynak: [SOURCES.md](SOURCES.md). Kendi cümlelerimizle özet; ayrıntı için
animasyonun klasik kaynaklarına da bak (12 animasyon ilkesi).

- Animasyon hareketin incelemesidir. Referansı kare kare izle, **uç pozları**
  (yön değiştirmeden hemen önceki kareler) bul, ara kareleri kendin çiz, sonra stilize et.
- Güçlü, birbirinden ayrışan anahtar kareler şart. Fazla ara kare zayıf pozu kurtarmaz.
- Zamanlama: "birlerde" her kare yeni çizim, "ikilerde" her çizim 2 kare.
  60 FPS'te 1 kare ≈ 16 ms, 2 kare ≈ 33 ms, 3 kare = 50 ms, 4 kare ≈ 67 ms,
  5 kare ≈ 83 ms, 6 kare = 100 ms. Gerçek animasyon bu süreleri karıştırır.
- **Ezilme-esneme:** hacmi koru; boyda ezilen şey ende genişler.
- **Hazırlık (anticipation):** asıl hareketin tersine kısa bir kurma. Oyunda
  tuşa basınca anında tepki gerekiyorsa çok kısa tut ya da hiç koyma.
- **Ara poz (breakdown):** A'dan B'ye düz gitmek yerine yay çizdir; karakter katar.
- **Yavaş giriş/çıkış (ease):** ara kareler anahtara yakın. Mesafe 1 pikselden
  küçükse subpiksel kullan (bkz. [subpixel.md](subpixel.md)).
- **Hareketli bekleme:** poz tutulurken küçük parçalar oynamaya devam eder; kare maliyeti yüksek.
- **Smear:** hareket bulanıklığını taklit eden uzatılmış ya da çoğaltılmış ara kare;
  ekranda çok kısa kalmalı (~50 ms).
- **Overshoot:** hedefi aşıp geri oturma; bazen 1 piksel bile yeter, "hissedilir".
- **Örtüşme ve takip (overlap / follow-through):** bir parça önden gider, diğerleri
  gecikmeli takip eder (sürüklenme). Hareket bitince sarkan parçalar oturur.
  Piksel ölçeğinde: "gecikmeli pikseller" bir iki kare sonra yetişir.
- **Dört yöntem:** silüet animasyonu (büyük hareketi blob'larla planla), kare
  geri dönüşümü (kopyala, kaydır, döndür, eğ; ama mutlaka elden geçir yoksa
  robotik durur), geleneksel çizimden başla (büyük çiz, küçült, renk azalt, temizle),
  doğrudan çizgiyle animasyon.
- **Sınırlı kare:** 2 kare titreme verir; döngü için en az 3 kare (daire üzerinde
  konumlar). Yürüme döngüsünü yerinde değil ekranda ilerleterek çiz, sonra ortala.
- **Onion skin** piksel ara karede yanıltabilir: ara kareyi anahtara yakın çiz.
- **Line boil (titreşen çizgi):** yanlış kareyi favorlamaktan, yaysız hareketten,
  hizasız subpikselden doğar. Seçim aracıyla kaydır, sınırlı animasyon kullan.
- **Parallax:** yakın katman hızlı, uzak katman yavaş; gökyüzü neredeyse sabit.

Motorda: `subpixelShift` ara kare taslağı, `encodeGif` döngü önizlemesi
(bkz. demo/build-wallpaper-gif.ts). Döngü fonksiyonlarında t=0 ve t=1 aynı değeri vermeli.
