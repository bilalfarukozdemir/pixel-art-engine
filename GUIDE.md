# pixel-art-engine — Başlangıç rehberi

Amaç daha çok ayrıntı değil, gerçek kullanım boyutunda okunur ve tutarlı sanat.
Önce bu sayfayı, sonra yalnız görevine uygun tarifi oku. API icat etme.

## Hangi katman?

- Sprite, ikon, küçük bina: Painter → kendi tuvalinde outline → atlas.
- Statik piksel manzara: Painter; yumuşak geçiş için vgrad(..., {smooth:true}).
- Oyunda geniş ve yumuşak manzara: tüketici Canvas katmanı da kullanılabilir.
  Bu motor özelliği değildir; sahneyi bir kez üret, her karede yeniden boyama.
- Okunur yazılar / HUD: native UI veya HTML/CSS. Düşük çözünürlüklü sprite
  atlasına metin gömme. Pixel-art görünümü bütün katmanlara zorunlu değildir.
- Hareket / hasar / seviye açılışı: tüketici oyunun sorumluluğu, motorun değil.

## Görevine git

- Bina / kemer / taş / mazgal: [recipes/buildings.md](recipes/buildings.md)
- Doğal zemin / atmosfer: [recipes/landscape.md](recipes/landscape.md)
- Ev içi kesit oda / yumuşak stil: [recipes/interior.md](recipes/interior.md)
- Karakter / animasyon: [recipes/animation.md](recipes/animation.md)
- Kıvılcım / toz / parıltı / zamanlı efekt: [recipes/effects.md](recipes/effects.md)
- Net metin / fantastik HUD: [recipes/ui.md](recipes/ui.md)
- İmzalar, renk, RNG, katalog, çıktı: [reference/API.md](reference/API.md)
- Çalışan önce/sonra: [demo/recipes.ts](demo/recipes.ts), [demo/pixel-logic.ts](demo/pixel-logic.ts)
- Görsel açıklama: [recipes/COMPARISON.md](recipes/COMPARISON.md)

## Teknik temelleri (her işte geçerli)

Pixel Logic kitabından öğrenilenlerin kendi cümlelerimizle özeti
([kaynakça](recipes/SOURCES.md)). İmzalar: [reference/API.md](reference/API.md),
"Pixel Logic araçları (Kasım 2026 eki)". Görev tarifine ek olarak ilgili olanı oku:

- Palet, rampa, ton kaydırma, siyah tonları: [recipes/color.md](recipes/color.md)
- Çizgi, kontur, düzensiz adım (jaggy), L-köşe: [recipes/line-art.md](recipes/line-art.md)
- Okunurluk, sprite boyutu, el/göz, silüet: [recipes/readability.md](recipes/readability.md)
- Temizlik ve lint: [recipes/cleanup.md](recipes/cleanup.md)
- Anti-aliasing, çizgi ağırlığı, banding: [recipes/anti-aliasing.md](recipes/anti-aliasing.md)
- Dithering: [recipes/dithering.md](recipes/dithering.md)
- Oyun perspektifleri, izometrik: [recipes/perspective.md](recipes/perspective.md)
- Subpiksel, seçmeli kontur: [recipes/subpixel.md](recipes/subpixel.md)

## Her işte aynı döngü

1. Hedefi yaz: nesne, iç piksel boyutu, gerçek ekranda boyutu, palet,
   ışık yönü, hareket edecek parçalar, seviye ile açılan parçalar.
   Okunması gereken **en küçük parçayı** belirle; tuval boyutunu ona göre seç.
2. Önce siluet. Tek renk hâlinde tanınmıyorsa ayrıntı ekleme; oranları düzelt.
   Geometri yazmadan önce mevcut yardımcıları eşle: taş→stoneCourses,
   kemer→archedDoor, mazgal→lancetWindow, gölge→contactShadow, eşit adımlı
   çizgi→stairs, temiz eğri→runCurve. Yetersizse nedenini belirt; aynı işi başka
   isimli yerel fonksiyonla sessizce yeniden yazma.
3. En az üç değer kullan: gölge, ana yüzey, ışık. Paleti `hueRamp` ile kur
   (gölge mora, ışık sarıya kayar); küçük sprite'ta 3-4 ton yeter. Saf siyah
   yerine `inkOf`. Aynı ışık yönünü koru.
4. Zemin nesnelerden önce; temas gölgeleri nesnelerin altında çizilir.
5. Az sayıda büyük malzeme detayı ekle. Rastgele noktalar detay yerine geçmez.
6. Yalnız gerekiyorsa atmosfer ekle. Vignette isteğe bağlıdır; UI'ı karartmaz.
7. Render al; hem native hem gerçek kullanım büyüklüğünde görseli aç.
   `formatLint(lintSprite(p))` raporuna bak, `markIssues` ile işaretli kopyayı
   büyütüp kaydet. Testlerin ve lint'in geçmesi sanatın iyi olduğunu kanıtlamaz.
8. En belirgin iki sorunu düzelt, tekrar render al. Test ve görülmeyen
   durumları dürüstçe raporla. “Kontrol ettim” demek için görüntüyü gerçekten gör.

## Durduran hatalar

- Math.random veya her karede değişen zemin seed'i.
- Sahne tamamına outline uygulamak.
- Işık yönlerini rastgele değiştirmek.
- Tekrarlayan küçük zemini bütün ekran boyunca belirgin döşemek.
- Bulanık metni yalnız font büyüterek çözmeye çalışmak.
- Erken seviyeye geç seviye süsleri koymak.
- Örnek dosyayı kopyalayıp kaynak projeye bağımlı hâle getirmek.
- Kod çalıştı diye görüntüyü görmeden bitirmek.
- Tam sayı merkez + tam sayı yarıçaplı elips: dört uçta tek piksel çıkıntı (nub).
  Yarıçapı .5 eksik ver (`ellipse(16,16,9.5,6.5,...)`).
- Aynı merdivende farklı adım boylarını karıştırmak (2'lerin arasına 1: jaggy).
- Kontura birebir paralel 1px gölge şeridi (banding).
- Küçük sprite'ta ya da animasyonlu parçada dither.

## Doğrulama

Motor kökünde: npm run typecheck; npm test; npm run examples; npm run examples:pixel-logic.
Çıktı: reports/recipe-comparison.png (solda düz temel, sağda işlenmiş örnek),
reports/pixel-logic.png (Pixel Logic araçları, önce/sonra).
Önkoşul: package.json'da zaten tanımlı geliştirme bağımlılıkları mevcut olmalı.
Eksikse kurulum için kullanıcı onayı iste; bağımlılık sürümlerini rastgele değiştirme.
