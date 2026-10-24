# Temizlik (clean-up) tarifi

Kaynak: [SOURCES.md](SOURCES.md) — Pixel Logic, Bölüm 7. Kendi cümlelerimizle özet.

Temizlik, "bitti" dedikten sonraki son rötuşlardır. Her aşamada yapılabilir;
çoğu değişiklik geri bildirim ya da öz-eleştiriyle sonda gelir.

## Süreç

- Yollar farklı olabilir (şekil → düzelt → bitir ya da çizgi → renk → bitir)
  ama sıra genelde **düz renk → gölge → detay**. Son sürüm ilk eskizden çok
  farklı olabilir; bu normal.
- Alan dar ise çizgiye güvenme; açık-koyu şekillerle çalış. Çizgi en çok
  geometrik yapı kurarken işe yarar.
- Bir bölgeyi (örn. palto) bitirip stili ve ışığı orada kur, sonra diğerlerine geç.
- Işık kaynağını en baştan belirle.

## Neye bakılır (kontrol listesi değil, örnek)

- **Silüet:** daha geniş, daha net, daha karakterli duruş.
- **Renkler:** daha belirgin ışık ve gölge, daha canlı tonlar.
- **Piksel şekilleri (kümeler):** aynı renkli pikseller şekil oluşturur. Temiz
  kümeler en çok bilgiyi taşır; gürültülü kümeler (rastgele tek pikseller) dokuyu
  inandırıcılıktan çıkarır. AA şekli biraz düzeltir ama çizim becerisinin yerini tutmaz.
- **Işık:** gölgeler ışık yönüne uymalı. Nesne başka parçaya gölge düşürebilir.
  Kontur da gölgelenebilir.
- **Okunurluk:** tek piksel bile göz bebeğini küçük ya da büyük gösterir.

## Teknikler

- **Birden fazla sürüm yap**, başkalarına seçtir. Yalnızsan ara ver, taze gözle seç.
- **Seçim aracı:** baştan çizmek yerine parçaları taşı. Oran ve perspektif
  hataları en sonda bile düzelir.
- **Ölçekleme/döndürme:** küçültülmüş sprite bir mozaik olur; onu taban alıp
  önemli çizgi ve detayları yeniden çiz (göz damlası + kalem). Büyükten küçüğe
  gitmek tersinden kolaydır. Döndürülen parçalar için de aynı yöntem.
- **Netlik:** çizgiye değil ışık-gölgeye yaslan; birkaç parlak ışık ekle;
  öne çıkması gereken yerlere daha koyu çizgi koy.
- **Diğer ayarlar:** kontrast (ton, doygunluk, değer), teğetler (animasyonda
  göz ardı edilebilir), model sayfasına sadakat, oran, perspektif (nesneleri yan yana koyup karşılaştır).

## Motorda

- `lintSprite(p)` + `formatLint` temizliğin otomatik ilk turudur: `nub`, `double`,
  `jaggy`, `banding`, `stray`, `colors`, `similar`, `pureBlack`.
  Sezgiseldir, hakem değildir: **her bulguya görüntüde bak**.
- `markIssues(p, rapor)` → sorunları renkle işaretlenmiş kopya; büyütüp kaydet.
- Ölçekleme sonrası: `quantize(p, paletteOf(orijinal))` ile renkleri geri topla,
  sonra lint + elle düzeltme.
- Birden fazla sürüm: aynı fonksiyonu farklı parametrelerle çağırıp yan yana
  kaydet (bkz. demo/pixel-logic.ts) ve kullanıcıya seçtir.
