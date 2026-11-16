# Temizlik (clean-up) tarifi

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki temizlik bölümünden öğrenilenlerin
kendi cümlelerimizle özeti.

Temizlik, "bitti" dedikten sonraki son rötuşlardır. Her aşamada yapılabilir;
çoğu değişiklik geri bildirimle ya da taze bir gözle sonda gelir.

## Süreç

- Yol kişiden kişiye değişir ama sıra genelde **düz renk → gölge → ayrıntı**dır.
  Son sürüm ilk eskizden çok farklı olabilir; bu normal.
- Alan darsa çizgiye güvenme; açık-koyu şekillerle çalış. Çizgi en çok
  geometrik yapı kurarken işe yarar.
- Bir bölgeyi bitirip stili ve ışığı orada kur, sonra diğerlerine geç.
- Işık yönünü en baştan belirle.

## Neye bakılır

- **Silüet:** daha geniş, daha net, daha karakterli duruş.
- **Renkler:** daha belirgin ışık ve gölge, daha canlı tonlar.
- **Piksel kümeleri:** aynı renkli pikseller bir şekil oluşturur. Temiz kümeler
  bilgiyi taşır; rastgele tek pikseller dokuyu gürültüye çevirir. Ara tonlar
  şekli biraz düzeltir ama çizimin yerini tutmaz.
- **Işık:** gölgeler ışık yönüne uymalı. Bir parça diğerine gölge düşürebilir.
  Kontur da gölgelenebilir.
- **Okunurluk:** tek piksel bile göz bebeğini küçük ya da büyük gösterir.

## Teknikler

- **Birden fazla sürüm yap**, başkalarına seçtir. Yalnızsan ara ver, sonra seç.
- **Seçim aracı:** baştan çizmek yerine parçaları taşı. Oran ve perspektif
  hataları en sonda bile düzelir.
- **Ölçekleme ve döndürme:** küçültülen sprite bir mozaiğe döner; onu taban
  alıp önemli çizgileri ve ayrıntıları yeniden çiz. Büyükten küçüğe gitmek
  tersinden kolaydır. Döndürülen parçalarda da aynı yöntem.
- **Netlik:** çizgiye değil ışık-gölgeye yaslan; birkaç parlak ışık ekle; öne
  çıkması gereken yerlere daha koyu çizgi koy.
- **Diğer ayarlar:** kontrast (ton, doygunluk, değer), teğetler, model
  sayfasına sadakat, oran, perspektif (nesneleri yan yana koyup karşılaştır).

## Motorda

- `lintSprite(p)` + `formatLint` temizliğin otomatik ilk turudur: `nub`, `double`,
  `jaggy`, `banding`, `stray`, `colors`, `similar`, `pureBlack`.
  Sezgiseldir, hakem değildir: **her bulguya görüntüde bak**.
- `markIssues(p, rapor)` → sorunları renkle işaretlenmiş kopya; büyütüp kaydet.
- Ölçekleme ya da döndürme sonrası: `quantize(p, paletteOf(orijinal))` ile
  renkleri geri topla, sonra lint ve elle düzeltme.
- Birden fazla sürüm: aynı fonksiyonu farklı parametrelerle çağırıp yan yana
  kaydet ve kullanıcıya seçtir (bkz. demo/pixel-logic.ts).
