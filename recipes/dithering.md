# Dithering tarifi

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki dithering bölümünden öğrenilenlerin
kendi cümlelerimizle özeti.

Dither, iki rengi bir desenle karıştırıp az renkle geçiş yanılsaması yaratmaktır.

## Ne zaman

- Kullan: elle yapılınca çok renk isteyecek geniş geçişler; gökyüzü, uzay,
  geniş ve sakin arka planlar; doku; ağır renk kısıtı; **hareket etmeyen** şeyler.
- Kullanma: küçük sprite, animasyonlu parçalar (kareler arasında titrer),
  renk sınırı olmayan işler. Fazlası grenli ve pürüzlü gösterir.
- Geniş, dithersiz hücre gölgesi de düz ve çizgili kalabilir: önce temiz
  şekillerle gölgele, gerekiyorsa dithere geç.

## Kurallar

- En yaygın desen ailesi dama tahtasıdır: seyrek noktalar → ızgara → tam dama
  (%50) → ters desenler. Her yoğunluk seviyesini sabit bir desenle kullan.
- İki renk arasında kaç seviye kullanacağını geçişin uzunluğu belirler.
- Elle dither yaparken **yan yana iki azınlık pikseli** (2x1 "geniş piksel")
  bırakma; desen bozulmuş görünür.
- **Kontrastı düşük tut.** Sert iki renk arasındaki dither rahatsız eder.
- Eğride desen kayarsa baştan çizme; seçip bir piksel kaydır. Tile'larda
  kaçınılmazsa iki farklı tile yap.
- Desen yalnız dama olmak zorunda değil: paralel çizgiler, kendi doku desenin
  ya da serbest desenler de olur. Rastgele dither filtre çıktısı gibi durur;
  düzenli bir desene çevir ya da elle düzelt.
- Doku ile geçişi karıştırma: geçiş ışıktan karanlığa gidiştir, doku malzemenin
  hissidir. Doku için geçiş gerekmez.
- Hücre gölgesinin sert sınırını dar bir dither şeridiyle kırmak modern bir
  kullanım; aynı işi tek bir ara tonla da yapabilirsin.

## Motorda

- `ditherLevel(x, y, seviye)`: 4x4 sıralı desen, seviye 0..16; 8 = tam dama.
  Azınlık pikselleri hiçbir seviyede yan yana gelmez (testle garanti).
  Matris `fx` katmanındaki `bayer()` ile aynıdır (testle bağlı).
- `ditherRect(p, x, y, w, h, a, b, seviye, desen)`: desen `ordered` | `lines-h` | `lines-v`.
  Desen mutlak koordinata bağlı; komşu alanlar ve tile'lar hizalı kalır.
- `ditherBands(p, x, y, w, h, [renkler], {levels: 3})`: bantlı geçiş (klasik konsol gökyüzü).
- Mevcut `vgrad` varsayılanı da Bayer ditherdir; pürüzsüz istiyorsan `smooth: true`.
- Görsel: reports/pixel-logic.png 4. satır (17 seviyelik şerit ve bantlı gökyüzü).
