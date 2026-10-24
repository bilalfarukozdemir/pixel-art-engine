# Manzara tarifi

Sıra: gökyüzü → uzak siluetler → zemin → gölgeler → nesneler → isteğe bağlı atmosfer.

- Gökyüzünde 3 renk durağıyla başla. Pürüzsüz isteniyorsa vgrad smooth:true.
  dither:false eski sert eşik davranışıdır; yumuşak geçiş anlamına gelmez.
- Uzakta daha düşük kontrast/doygunluk; yakında daha belirgin yüzeyler.
- Patikanın üst ve alt sınırlarını ayrı yavaş sinüslerle düzensizleştir.
  İç bölgeyi geniş tut; her pikseli gürültüyle doldurma.
- Seed'li çimen/taşları bir kez üret. Doku yığınları arasında boş alan bırak.
- Küçük tekrar eden tile yerine daha geniş tek yüzey veya birkaç varyant.
- Temas gölgesi nesnenin tabanına oturur; ışık halesi yerine koyu, ince elips.
- Gündüz açık bir oyun sahnesinde vignette şart değil. Okunurluğu bozuyorsa çıkar.

Tower Defense'te iyi bulunan yumuşak manzara tüketici Canvas ile üretildi;
bunu motorda hazır bir landscape API varmış gibi anlatma.
Çalışan Painter karşılaştırması: demo/recipes.ts.
