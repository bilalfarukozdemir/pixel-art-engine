# Oyun perspektifleri tarifi

Kaynak: [SOURCES.md](SOURCES.md) — Pixel Logic, Bölüm 6. Kendi cümlelerimizle özet.

2D oyunların çoğunda gerçek perspektif ve kaçış noktası yoktur. Üç boyutu ima
eden düz projeksiyonlar kullanılır. **Oynanışa hizmet eden görünümü seç**; oyuncu
dünyaya bütün oyun boyunca bu açıdan bakacak.

## Görünümler

- **Yan görünüm:** platform ve shoot'em up. Kesit, hafif yukarıdan ya da eğik
  (ön yüz düz, yanlar eğik) varyantları var. Hareket hep tek bir 2D hat üzerinde.
- **Yukarıdan (top-down):** kare tile'lar, keşfe uygun. Kameranın yüksekliği
  ön/üst yüz oranını belirler: ön > üst (beat 'em up), ön ≈ üst (yaygın),
  ön = üst (tile seti en kolay), üst > ön (yükseklik hissi).
- **Tam tepeden (90°):** harita, plan gibi; derinlik yok, nadir.
- **Zelda sorunu:** oda tek noktalı perspektifle, nesneler 45° top-down çizilince
  güney duvarına yakın sprite'lar yanlış durur. Önündeki duvarı kaldırmak ("4. duvar") çözümdür.
- **İzometrik:** elmas ızgara; gerçek 30° yerine **2 piksellik adımlar** (~26.5°).
  Kesişimlerde çift piksel olmasın diye kenarları çizgiyle değil renk farkıyla
  (dama tahtası gibi) ayır. Serbest çizilen izometrik arka plan güzel ama
  çarpışma haritasına çevirmesi zordur.
- **45° dimetrik:** üst yüz düz, kılavuz çizgiler 1:1. Yüksek yapılar oynanışı kapatmasın diye.
- **Eğik (oblique):** ön yüz düz, üst ve yan 45° (bazen 2:1) eğik. "Yan görünüm + iki yüz."
- **Gerçek perspektif:** illüstrasyonda normal perspektif kuralları geçerli.
  Oyunda sprite'ın büyüyüp küçülmesini gerektirir (çoğunlukla motor ölçekler).

## Teknikler

- Nesneyi ya göz kararı ya da kılavuzla kur. Önce kurmayı öğren, göz kararı sonra gelir.
  Küp, silindir, piramit, koni, küreden her şey türer.
- Yan görünüm sprite'ını izometriğe çevirmek: yatayı %87'ye (cos 30°) sıkıştır,
  baktığı yöne doğru 30° (0.5 eğim) kaydır, parçaları derinlik için düzelt, temizle.
- Organik şekilleri (ağaç) birkaç ovalle kur, ovallerin dış hattını izle, sonra gölgele.
- Gerçek tepeden görünüm çoğu zaman sıkıcıdır: nesneleri okunurluk için hafif
  açıyla çizmek "iyi bir hile"dir.
- Ölçek hissi için alçak kamera yerine iki katman, ölçekleme ya da iki ekrana yayılan grafik kullan.

## Motorda

- `isoDiamond(p, cx, cy, w, renk)`: 2:1 elmas karo (w 4'ün katı, yükseklik w/2).
- `isoBox(p, cx, cy, w, h, {top, left, right})`: üst yüz + iki yan yüz.
  Renkleri bir `hueRamp`'ten al: üst en açık, ışık alan yan orta, diğer yan koyu.
- `stairs(p, x, y, 2, 1, n, renk)`: izometrik kılavuz çizgi.
- Görsel: reports/pixel-logic.png sol alt.
