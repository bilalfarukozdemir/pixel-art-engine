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
- Net metin / fantastik HUD: [recipes/ui.md](recipes/ui.md)
- İmzalar, renk, RNG, katalog, çıktı: [reference/API.md](reference/API.md)
- Çalışan önce/sonra: [demo/recipes.ts](demo/recipes.ts)
- Görsel açıklama: [recipes/COMPARISON.md](recipes/COMPARISON.md)

## Her işte aynı döngü

1. Hedefi yaz: nesne, iç piksel boyutu, gerçek ekranda boyutu, palet,
   ışık yönü, hareket edecek parçalar, seviye ile açılan parçalar.
2. Önce siluet. Tek renk hâlinde tanınmıyorsa ayrıntı ekleme; oranları düzelt.
   Geometri yazmadan önce mevcut yardımcıları eşle: taş→stoneCourses,
   kemer→archedDoor, mazgal→lancetWindow, gölge→contactShadow. Yetersizse nedenini
   belirt; aynı işi başka isimli yerel fonksiyonla sessizce yeniden yazma.
3. Üç değer kullan: gölge, ana yüzey, ışık. Aynı ışık yönünü koru.
4. Zemin nesnelerden önce; temas gölgeleri nesnelerin altında çizilir.
5. Az sayıda büyük malzeme detayı ekle. Rastgele noktalar detay yerine geçmez.
6. Yalnız gerekiyorsa atmosfer ekle. Vignette isteğe bağlıdır; UI'ı karartmaz.
7. Render al; hem native hem gerçek kullanım büyüklüğünde görseli aç.
   Testlerin geçmesi sanatın iyi olduğunu kanıtlamaz.
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

## Doğrulama

Motor kökünde: npm run typecheck; npm test; npm run examples.
Çıktı: reports/recipe-comparison.png (solda düz temel, sağda işlenmiş örnek).
Önkoşul: package.json'da zaten tanımlı geliştirme bağımlılıkları mevcut olmalı.
Eksikse kurulum için kullanıcı onayı iste; bağımlılık sürümlerini rastgele değiştirme.
