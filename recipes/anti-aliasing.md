# Anti-aliasing (AA) tarifi

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki AA bölümünden öğrenilenlerin
kendi cümlelerimizle özeti; örnekler motorun kendi çıktısıdır.

AA, bir kenarın basamak köşelerine ara tonda piksel koyarak kenarı
yumuşatmaktır. Genelde koyu ile açık alanın buluştuğu yerde, bazen iki gölge
tonu arasında kullanılır. Bu motorda AA **açıkça çağrılan bir yardımcıdır**
ve opak, sınırlı sayıda (1-2) ara ton üretir; alfa karışımı ya da bulanıklık yoktur.

## AA gerekir mi?

- Yumuşak, yuvarlak stillerde ve büyük sprite'larda gerekir; yoksa şekil kaba durur.
- Az renkli, sert kenarlı stillerde gereksiz, hatta zararlı olabilir. Düşük
  kontrastlı renkler arasında AA'ya pek gerek yoktur.
- Çok küçük sprite'ta AA bulanıklaştırır; ama yüz ve göz gibi okunurluğun
  kritik olduğu yerlerde ölçülü AA netlik kazandırır.
- Artıları: küçük eğrileri yumuşatır, okunurluğu artırır, subpiksel hareketin
  temelidir. Eksileri: abartılırsa yorucu ve bulanık; renk sayısını artırır.

## Nereye ve ne kadar

- **Dikkat çeken yerler:** yüz, göz, karakterin kendisi.
- **Küçük eğriler:** eğri küçüldükçe basamak belirginleşir, daha çok AA ister.
- **Yüksek kontrast:** iki sert rengin sınırına ara ton.
- **Çizgi ağırlığı:** koyu ara ton çizgiyi kalın, açık ara ton ince gösterir.
- Miktar: ara ton, basamağın uzunluğunu geçmesin; çoğu zaman yarısı yeter.
  **Eksik AA, fazla AA'dan iyidir.**
- Ton sayısı: başlangıçta 1, daha yumuşak sonuç için 2. Daha fazlası vektör
  görüntüsüne kayar.
- Yataya yakın uzun basamak daha uzun AA ister; dik eğride daha az ton kullanılır.
- 45° çizgi zaten düzgündür, AA nadiren gerekir. Dışbükey ve içbükey eğrilerde
  ara tonların açıklığı ters yönde değişir: hangi taraf boşlukta kalıyorsa onu doldur.
- Doğal olarak düzensiz bir kenarda ideal düz kenarı düşün, önce en çok açıkta
  kalan basamağı doldur; gerekirse küçük boşluklara daha açık tonla devam et.

## Banding (kaçın)

- İki piksel sırası **aynı boyda ve yapışık** giderse (özellikle konturu birebir
  takip eden gölge ya da AA şeridi) eğri kaba, çizgi kalın, kontur bulanık görünür.
  Konturu takip eden gölge, nesneyi yastık gibi şişkin gösterir.
- Yakından fark edilmeyebilir; 1x ve 2x boyutta belirginleşir.
- Düzeltme: şeridin bir ucundan piksel sil ya da ekle, ya da AA ile kır.
  Gölge katmanını ışık yönüne kaydırmak çoğu zaman tek başına çözer.

## Motorda

- `aaEllipse(p, cx, cy, rx, ry, renk, {levels: 1|2, palette})` ve `aaPoly(...)`:
  kapsama tabanlı dolgu. %50'den çok kapsanan piksel düz renk alır; daha az
  kapsanan kenar pikseli, ALTINDAKİ opak renkle 1-2 ara tona karışır.
- Şeffaf piksele AA yapılmaz (arka plan bilinmez). Sprite'ın dış kenarı için
  `selectiveOutline` kullan (bkz. [subpixel.md](subpixel.md), seçmeli kontur).
- `palette` verirsen ara ton en yakın palet rengine oturur. Komşu rampa renkleri
  arasında ara ton yoksa AA görünmez olur; o durumda palet verme ya da bilerek
  yeni bir ara ton ekle.
- Elips kuralı burada da geçerli: yarıçapı .5 eksik ver (bkz. [line-art.md](line-art.md)).
- Kontrol: `lintSprite` → `banding`. Örnek: demo/pixel-logic.ts slime'ında ana
  ton katmanı ışık yönüne kaydırılarak banding giderildi.
