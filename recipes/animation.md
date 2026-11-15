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

Editörde rötuş: kod iskeleti ve varyantları üretir, son dokunuş Aseprite'ta yapılır.
Parçaları (gövde, silah, efekt) ayrı Painter'a çizip `encodeAseprite` ile katman
olarak yaz, her hareketi etiketle. Editördeki değişiklik kaynak koda geri dönmez;
kodu yeniden çalıştırmak dosyanın üstüne yazar, rötuşlu dosyayı ayrı adla sakla.

Oyun bitişinde animasyonları/efektleri temizle; simülasyon durduğunda render
canlı düşmanları yeniden oluşturmamalı. Bu kontrol tüketici oyunda yapılır.

## Animasyon ilkeleri (özet)

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki animasyon bölümünden ve klasik
animasyon ilkelerinden öğrenilenlerin kendi cümlelerimizle özeti.

- Animasyon hareketin incelenmesidir. Referansı kare kare izle, **uç pozları**
  (yön değiştirmeden hemen önceki anları) bul, ara kareleri kendin çiz, sonra stilize et.
- Güçlü ve birbirinden ayrışan anahtar kareler şarttır; fazla ara kare zayıf pozu kurtarmaz.
- Zamanlama: her kare yeni bir çizim ("birlerde") ya da her çizim iki kare
  ("ikilerde"). 60 FPS'te 1 kare ≈ 16.7 ms; 2 kare ≈ 33 ms; 3 kare = 50 ms;
  6 kare = 100 ms. İyi animasyon bu süreleri karıştırır.
- **Ezilme-esneme:** hacmi koru; boyda ezilen şey ende genişler.
- **Hazırlık:** asıl hareketin tersine kısa bir kurma. Oyunda tuşa anında tepki
  gerekiyorsa çok kısa tut ya da hiç koyma.
- **Ara poz:** A'dan B'ye düz gitmek yerine bir yay çizdir; karakter katar.
- **Yavaş giriş/çıkış:** ara kareleri anahtar kareye yakın koy. Mesafe 1
  pikselden küçükse subpiksel kullan (bkz. [subpixel.md](subpixel.md)).
- **Hareketli bekleme:** poz tutulurken küçük parçalar oynamaya devam eder.
- **Smear (hareket izi):** hızlı hareketi uzatılmış ya da çoğaltılmış bir ara
  kareyle göster; ekranda yalnız 1-3 kare kalsın.
- **Hedefi aşma:** hedefi biraz geçip geri oturma; bazen 1 piksel bile hissedilir.
- **Örtüşme ve takip:** bir parça önden gider, diğerleri gecikmeyle izler;
  hareket bitince sarkan parçalar yerine oturur.
- **Çalışma yolları:** büyük hareketi önce kaba siluetlerle planla; kareleri
  kopyalayıp kaydırarak/döndürerek yeniden kullan ama mutlaka elden geçir
  (yoksa robotik durur); gerekirse büyük çizip küçült, renk azalt, temizle.
- **Az kareli döngü:** 2 kare titreme verir; akıcı bir döngü için en az 3 kare.
  Yürüme döngüsünü ekranda ilerlerken çiz, sonra ortala.
- **Onion skin** piksel ölçeğinde yanıltabilir: ara kareyi anahtara yakın çiz.
- **Titreşen çizgi (line boil):** yaysız hareketten ya da hizasız ara tonlardan
  doğar; seçim aracıyla kaydır, gerekirse kare sayısını azalt.
- **Parallax:** yakın katman hızlı, uzak katman yavaş; gökyüzü neredeyse sabit.

Motorda: `subpixelShift` ara kare taslağı, `encodeGif` döngü önizlemesi
(bkz. demo/build-wallpaper-gif.ts). Döngü fonksiyonlarında t=0 ve t=1 aynı değeri vermeli.
