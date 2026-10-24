# Anti-aliasing (AA) tarifi

Kaynak: [SOURCES.md](SOURCES.md) — Pixel Logic, Bölüm 2. Kendi cümlelerimizle özet.

AA, merdiven köşelerine ara tonda piksel koyarak kenarı yumuşatmaktır
(kanepedeki boşluğa yastık koymak gibi). Koyu ile açık alanın buluştuğu
yerde, bazen de iki gölge tonu arasında kullanılır.

## AA gerekir mi?

- Yumuşak, yuvarlak stillerde ve büyük sprite'larda gerekir; yoksa şekil kaba durur.
- Az renkli, keskin (NES benzeri ya da "pastel boya") stillerde gereksiz,
  hatta zararlı olabilir. Düşük kontrastlı renkler arasında AA'ya pek gerek yoktur.
- Çok küçük sprite'ta AA bulanıklaştırır; ama yüz/göz gibi okunurluk kritik
  yerlerde ölçülü AA netlik kazandırır.
- Artıları: küçük eğrileri yumuşatır, okunurluğu artırır, subpiksel animasyonun
  temelidir. Eksileri: abartılırsa yorucu ve bulanık; renk sayısını artırır.

## Nereye ve ne kadar

- **Dikkat çeken yerler:** yüz, göz, karakterin kendisi.
- **Küçük eğriler:** küçük eğri daha jaggy'dir, daha çok AA ister.
- **Yüksek kontrast:** iki sert rengin sınırına ara ton.
- **Çizgi ağırlığı:** AA çizgiyi kalın ya da ince gösterebilir.
- Kaç piksel: basamak uzunluğunun yaklaşık yarısı. **Az, çoktan iyidir.**
- Kaç ton: başlangıçta 1, daha yumuşak sonuç için 2. 3 ton vektör görüntüsüne kayar.
- Uzun (yataya yakın) basamak daha uzun AA ister; dik eğride daha az ton kullanılır.
- 45° çizgide AA nadirdir. Dışbükey eğride ortası açık, uçları koyu; içbükeyde tersi.
- Doğal olarak düzensiz bir kenarda: hayali düz çizgiyi düşün, önce en büyük
  boşlukları doldur. Gerekirse küçük boşluklara daha açık tonla devam et.
- Çizgi ağırlığı: koyu AA çizgiyi kalın, açık AA ince gösterir. Ağız çizgisinin
  uçları gibi yerlerde fırça darbesi hissi verir.

## Banding (kaçın)

- İki piksel sırası **aynı boyda ve yapışık** giderse (özellikle konturu birebir
  takip eden gölge/AA şeridi) eğri kaba, çizgi kalın, kontur bulanık görünür.
  Kontura paralel gölge "pillow shading" denen yastık görünümünü verir.
- Yakından fark edilmeyebilir; 1x ve 2x boyutta belirginleşir.
- Düzeltme: şeridin bir ucundan piksel sil ya da ekle, ya da AA ile kır.
  Gölge katmanını ışık yönüne kaydırmak çoğu zaman tek başına çözer.

## Motorda

- `aaEllipse(p, cx, cy, rx, ry, renk, {levels: 1|2, palette})` ve `aaPoly(...)`:
  kapsama tabanlı (alt örneklemeli) dolgu. %50'den çok kapsanan piksel düz
  renk alır. Daha az kapsanan kenar pikseli, ALTINDAKİ opak renkle karışır.
- Şeffaf piksele AA yapılmaz (arka plan bilinmez). Sprite'ın dış kenarı için
  `selectiveOutline` kullan (bkz. [subpixel.md](subpixel.md), seçmeli kontur).
- `palette` verirsen ara ton en yakın palet rengine oturur. Komşu rampa renkleri
  arasında ara ton yoksa AA görünmez olur: o durumda palet verme ya da bilerek
  yeni bir ara ton ekle.
- Kontrol: `lintSprite` → `banding` uyarısı. Örnek düzeltme: demo/pixel-logic.ts
  slime'ında ana ton katmanı ışık yönüne kaydırılarak banding giderildi.
