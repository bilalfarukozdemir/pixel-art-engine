# Okunurluk tarifi

Kaynak: [SOURCES.md](SOURCES.md) — Pixel Logic, Bölüm 4. Kendi cümlelerimizle özet.

Okunurluk = izleyicinin neyi çizdiğini ilk bakışta anlaması.

## Boyut

- Küçük sprite'ta ifade aktarmak zordur. Büyük sprite temiz çizgi ve sağlam
  çizim ister, küçük sprite tanınır özellik ister.
- Boyutu seçmek için şunu sor: görünmesi gereken **en küçük parça** ne?
  Eller hareket edecek mi? Ağız konuşacak mı? Kılıçtaki taş görünecek mi?
  O parçanın okunabildiği en küçük tuval, doğru tuvaldir.
- Küçük sprite daha akıcı animasyon ve daha kolay kostüm değişimi sağlar.
  Çok büyüyünce piksel sanattan "çizimin küçültülmüş hâli"ne kayar.
- Her detayı sığdırmaya çalışma. Karakteri benzersiz yapan şeyi seç, gerisinden
  vazgeç: az çoktur.
- Tek bir piksel yorumu değiştirebilir (yarasa ↔ başka bir şey). Emin değilsen
  birkaç sürüm yap, ne olduğunu söylemeden başkasına sor.

## Semboller

- **Eller:** çizgiyle değil şekille başla. Önce eldiven gibi çiz, sonra detay.
  İşaret parmağı ve başparmak eli tanımlar. Yer yoksa 3 parmak + başparmak.
  Parmakları renk/parlaklık farkıyla ayır. Zorlanırsan büyük çizip küçült, referans al.
- **Gözler:** izleyici önce gözü arar; yüzleri cilala. Göze yer yoksa yüzdeki
  gölgeyle göz bölgesini ima et. Gözlükte ya gözü ya çerçevenin üstünü göster.
  Tek bir beyaz parıltı pikseli ifadeyi değiştirir; gerekirse ince AA.

## Tasarım

- **Oranlar:** büyük kafa duygu ve kimliği öne çıkarır; gerçekçi oran beden
  diline dayanır. Oran sprite'ın işlevine göre seçilir (diyalog, harita, savaş).
- **Silüet:** tek renk hâlinde de baş, uzuvlar ve eylem okunmalı. Parçalar üst
  üste biniyorsa renk kontrastıyla ayır.
- **Renk tasarımı:** 2-3 ana renk. Yanlış renk yanlış okunur (turuncu burun gaga sanılır).
- **Işık ve gölge:** kontur yer kaplar; onun yerine en koyu tonla siluet ve
  derinlik, en açık tonla kritik kenarları göster.
- **Boşluk ve teğetler (tangent):** iki öğe birbirine değerse okunmaz. Ağzın
  üstünde ve altında boşluk olmalı. İç çizgileri kaldırmak ya da parçaları
  bir piksel kaydırmak yer açar.
- **Sprite ve arka plan:** oyunda sprite arka plandan her zaman ayrılmalı:
  kontur ekle, arka planın rengini yumuşat, arka planı daha az odakta tut.
- AA ölçülü kullanılırsa okunurluğu artırır. Dither küçük sprite'ta işe yaramaz,
  pürüzlü gösterir.

## Kontrol

- Her zaman **1x boyutta** önizle (bu motorda native PNG'yi aç).
- Bulanıklaştırarak bak: bulanıkken kötü görünüyorsa pikselde düzelt; banding de böyle ortaya çıkar.
- Motorda: native ve büyütülmüş PNG'yi birlikte kaydet. `lintSprite` okunurluğu
  ölçmez; bu adım gözle yapılır.
