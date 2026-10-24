# İç mekân tarifi (kesit oda)

Oku: GUIDE.md → bu tarif → src/motifs/interior.ts.

1. Kesit çerçeve: tavan kirişi, iki yan duvar kesiti, zemin altı temel bandı.
   Oda içi bunların arasında kalır; dış koyu, iç sıcak.
2. roomShell ile duvar + süpürgelik + tahta zemin. Zemin bandı ince tutulur
   (yan görünüm); eşyaların "ayak" çizgisi zemin bandının ortası.
3. Pencere duvarın odak noktasıdır: windowPane, gökyüzü degradesi + perde.
4. Büyük eşyalar (yatak, masa) önce, temas gölgesiyle; karakterler en son.
   Eşya ve karakterleri ayrı tuvalde çiz, outline'ı orada uygula, sonra blit.
5. Işık kaynağı tek: tavan lambası ya da pencere. Yüzeylerde aynı yön.

## İki stil

- Piksel: unit=1, native çiz (ör. 160×112), upscale ile büyüt. Outline var.
- Yumuşak: aynı geometriyi S kat büyük çiz (unit=S, smooth:true), sonra
  downsample(p, n) ile küçült. Kenarlar kendiliğinden yumuşar; outline yok.
  Çekirdek antialiasing'siz kalır — yumuşaklık yalnız bu son adımdan gelir.

Kontrol: eşyalar zemine basıyor mu (temas gölgesi)? Duvar çizgileri
eşyalardan baskın mı? Karakterin yüzü gerçek boyutta okunuyor mu?
