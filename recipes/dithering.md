# Dithering tarifi

Kaynak: [SOURCES.md](SOURCES.md) — Pixel Logic, Bölüm 5. Kendi cümlelerimizle özet.

Dither, iki rengi desenle karıştırıp az renkle geçiş yanılsaması yaratmaktır.

## Ne zaman

- Kullan: elle yapılınca çok renk isteyecek geniş geçişler; gökyüzü, uzay, boş
  kalacak geniş arka planlar; doku; ağır renk kısıtı; **hareket etmeyen** şeyler.
- Kullanma: küçük sprite, animasyonlu parçalar (kareler arasında titrer),
  renk sınırı olmayan işler. Fazlası grenli ve pürüzlü gösterir.
- Ama geniş, dithersiz hücre gölgesi de düz ve çizgili kalabilir: önce temiz
  şekillerle gölgele, gerekiyorsa dithere geç.

## Kurallar

- **Dama ailesi** en yaygın desendir: tek tek noktalar → ızgara → dama tahtası
  (%50) → ters desenler. Her seviyeyi bir desenle hatırla.
- İki renk arasında kaç dither seviyesi kullanacağın geçişin uzunluğuna bağlı.
- Serbest dither yaparken **asla 2x1 geniş piksel** (yan yana iki azınlık pikseli) bırakma.
- **Kontrastı düşük tut.** Sert iki renk arasında dither rahatsız eder.
- Eğrilerde çift piksel çıkarsa deseni baştan yapma, seçip kaydır.
  Tile setlerde çift sayı yüzünden kaçınılmazsa iki farklı tile yap.
- Diğer desenler: paralel çizgiler (eski CRT'ler için; bugün stil amaçlı),
  kesik çizgiler, tek sıra "diş" deseni (dokuya iyi, geçişe değil), iç içe
  geçmiş yamalar, rastgele dither (filtre çıktısı gibi durur; tile'a dönüştür
  ya da elle düzelt).
- **Stilize dither:** kendi doku desenini geçiş olarak kullan; gren hissi vermez, yer ister.
- Doku ile geçişi karıştırma: geçiş ışıktan karanlığa gidiştir, doku malzemenin
  hissidir. Doku için geçiş gerekmez.
- Modern kullanım: hücre gölgesinin sert sınırını dither ile "yumuşatma fırçası"
  gibi kırmak. Aynı işi bir ara tonla da yapabilirsin.

## Motorda

- `ditherLevel(x, y, seviye)`: 4x4 sıralı desen, seviye 0..16. 8 = tam dama.
  Bu desenlerde azınlık pikselleri hiçbir seviyede yan yana gelmez (testle garanti).
- `ditherRect(p, x, y, w, h, a, b, seviye, desen)`: desen `ordered` | `lines-h` | `lines-v`.
  Desen mutlak koordinata bağlı; komşu alanlar ve tile'lar hizalı kalır.
- `ditherBands(p, x, y, w, h, [renkler], {levels: 3})`: bantlı geçiş (klasik konsol gökyüzü).
- Mevcut `vgrad` varsayılanı da Bayer ditherdir. Pürüzsüz istiyorsan `smooth: true`.
- Görsel: reports/pixel-logic.png 4. satır (17 seviyelik şerit + bantlı gökyüzü).
