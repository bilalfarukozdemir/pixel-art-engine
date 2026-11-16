# Oyun perspektifleri tarifi

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki perspektif bölümünden öğrenilenlerin
kendi cümlelerimizle özeti.

2D oyunların çoğunda gerçek perspektif ve kaçış noktası yoktur; üç boyutu ima
eden düz projeksiyonlar kullanılır. **Oynanışa hizmet eden görünümü seç**:
oyuncu dünyaya bütün oyun boyunca o açıdan bakacak.

## Görünümler

- **Yan görünüm:** platform ve nişancı oyunları. Hareket tek bir 2D hat üzerinde.
  Ön yüzü düz, üst ya da yan yüzü hafifçe gösteren varyantları var.
- **Yukarıdan (top-down):** kare tile'lar, keşfe uygun. Kamera açısı, nesnelerin
  ön yüzü ile üst yüzü arasındaki oranı belirler: ön yüz büyüdükçe karakterler
  daha çok görünür, üst yüz büyüdükçe zemin ve yükseklik daha çok okunur.
- **Tam tepeden:** harita ya da plan gibi; derinlik yok, nadir kullanılır.
- **Karışık açı sorunu:** oda bir açıyla, içindeki nesneler başka bir açıyla
  çizilirse duvara yakın nesneler yanlış durur. Görünen duvarı sadeleştirmek ya
  da kaldırmak çözümdür.
- **İzometrik:** elmas ızgara. Pikselde gerçek 30° yerine **2 piksellik
  adımlar** (~26.5°) kullanılır. Kesişimlerde çift piksel olmasın diye
  kenarları çizgiyle değil renk farkıyla ayır. Serbest çizilen izometrik arka
  plan güzeldir ama çarpışma haritasına çevirmesi zordur.
- **Dimetrik / eğik:** üst yüz düz ya da ön yüz düz kalır, diğer yüzler 45°
  (bazen 2:1) eğilir. Yüksek yapıların oynanışı kapatmaması için kullanılır.
- **Gerçek perspektif:** illüstrasyonda normal perspektif kuralları geçerli.
  Oyunda nesnenin uzaklıkla ölçeklenmesini gerektirir.

## Teknikler

- Nesneyi ya göz kararı ya da kılavuz çizgilerle kur; önce kurmayı öğren.
  Küp, silindir, piramit, koni ve küreden her şey türer.
- Yan görünüşten izometriğe geçiş için bir yol: yatayı ~%87'ye (cos 30°)
  sıkıştır, baktığı yöne 2:1 eğimle kaydır, parçaları derinlik için düzelt, temizle.
- Organik şekilleri (ağaç gibi) birkaç ovalle kur, dış hattı izle, sonra gölgele.
- Tam tepeden görünüm çoğu zaman sıkıcıdır; nesneleri okunurluk için hafif
  açıyla çizmek iyi bir hiledir.
- Ölçek hissi için katmanlar, ölçekleme ya da ekrana sığmayan büyük grafikler kullan.

## Motorda

- `isoDiamond(p, cx, cy, w, renk)`: 2:1 elmas karo (w 4'ün katı, yükseklik w/2).
- `isoBox(p, cx, cy, w, h, {top, left, right})`: üst yüz ve iki yan yüz.
  Renkleri bir `hueRamp`'ten al: üst en açık, ışık alan yan orta, diğer yan koyu.
- `stairs(p, x, y, 2, 1, n, renk)`: izometrik kılavuz çizgi.
- Görsel: reports/pixel-logic.png sol alt.
