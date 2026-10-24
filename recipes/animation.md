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
