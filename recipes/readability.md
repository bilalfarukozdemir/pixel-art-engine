# Okunurluk tarifi

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki okunurluk bölümünden öğrenilenlerin
kendi cümlelerimizle özeti.

Okunurluk, izleyicinin neyi çizdiğini ilk bakışta anlamasıdır.

## Boyut

- Küçük sprite'ta ifade aktarmak zordur. Büyük sprite temiz çizgi ve sağlam
  çizim ister; küçük sprite ise tanınır birkaç özellik ister.
- Boyutu seçerken sor: görünmesi gereken **en küçük parça** ne? Eller hareket
  edecek mi? Ağız konuşacak mı? Silahın üstündeki süs görünmeli mi?
  O parçanın okunabildiği en küçük tuval, doğru tuvaldir.
- Küçük sprite daha akıcı animasyon ve daha kolay kostüm değişimi sağlar.
  Çok büyüyünce piksel sanattan "küçültülmüş çizim"e kayar.
- Her ayrıntıyı sığdırmaya çalışma. Karakteri ayırt eden şeyi seç, gerisinden
  vazgeç: az çoktur.
- Küçük boyutta tek bir piksel bile nesnenin ne olduğunu değiştirebilir. Emin
  değilsen birkaç sürüm yap ve ne olduğunu söylemeden başkasına sor.

## Eller ve gözler

- **Eller:** önce parmaksız bir kütle olarak çiz, sonra ayrıntıya in. İşaret
  parmağı ile başparmak eli en çok tanımlayan parçalardır. Yer yoksa üç parmak
  ve bir başparmak yeter. Parmakları renk ya da parlaklık farkıyla ayır.
  Zorlanırsan büyük çizip küçült ve bir referansa bak.
- **Gözler:** izleyici önce gözü arar; yüze emek ver. Göze yer yoksa yüzdeki
  gölgeyle göz bölgesini ima et. Tek bir parlak piksel ifadeyi değiştirir.

## Tasarım

- **Oranlar:** büyük kafa duygu ve kimliği öne çıkarır; gerçekçi oran beden
  diline dayanır. Oranı sprite'ın işi belirler (diyalog, harita, dövüş).
- **Silüet:** tek renk hâlinde de baş, uzuvlar ve eylem okunmalı. Parçalar üst
  üste biniyorsa renk kontrastıyla ayır.
- **Renk tasarımı:** 2-3 ana renk. Bir parçanın rengi ona başka bir anlam
  yükleyebilir; rengin neyi çağrıştırdığını kontrol et.
- **Işık ve gölge:** kontur yer kaplar. Onun yerine en koyu tonla siluet ve
  derinliği, en açık tonla kritik kenarları göster.
- **Boşluk ve teğetler:** iki öğe tam sınırda birbirine değerse okunmaz.
  Ağız, göz gibi parçaların çevresinde boşluk bırak. İç çizgileri kaldırmak ya
  da parçaları bir piksel kaydırmak yer açar.
- **Sprite ve arka plan:** oyunda sprite arka plandan her zaman ayrılmalı:
  kontur ekle, arka planın rengini sakinleştir, arka planı daha az odakta tut.

## Kontrol

- Her zaman **1x boyutta** önizle (bu motorda native PNG'yi aç).
- Gözünü kısarak ya da bulanıklaştırarak bak: bulanıkken kötü görünen yer
  pikselde de kötüdür; kontura yapışık şeritler de böyle ortaya çıkar.
- Motorda: native ve büyütülmüş PNG'yi birlikte kaydet. `lintSprite` okunurluğu
  ölçmez; bu adım gözle yapılır.
