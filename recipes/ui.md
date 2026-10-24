# Net yazı ve fantastik HUD

Bu motor font/render motoru değildir. Painter sprite'larını yüksek çözünürlükte
yazı elde etmek için büyütmek sorunu çözmez.

Web oyunu: düşük çözünürlüklü savaş canvas'ı + ayrı HTML/CSS metin katmanı.
Native oyun: UI renderer'ını kullan. HUD çözünürlüğü sprite çözünürlüğünden bağımsız.

- Gerçek canvas bounding rect üzerinden konum ve ölçeği eşle.
- Yalnız CSS viewport boyutuna güvenme; letterbox, cutout ve yeniden boyutlandırma var.
- Dekoratif katman pointer-events:none; alttaki butonlar çalışmaya devam etmeli.
- Scene kapanırken gözlemci/listener/DOM katmanını kaldır.
- Türkçe deneme: İı Şş Ğğ Üü Öö Çç. Küçük sayılar için tabular numerals.
- İnce gölge, yüksek kontrast; kalın siyah stroke küçük yazıları boğar.
- Can barı: koyu kanal, sınırlı metal çerçeve, küçük kalkan, sade kırmızı gradyan.
- Gerçek can anında düşer; dekoratif hasar izi sonra yetişebilir.
- 0%, 1%, 50%, 100%, yeniden dolum, büyük sayı ve düşük can kontrolü.
- Render ölçeği değişince dokunma hedefleri yer değiştirmemeli.

Tower Defence'te metin katmanı oyunun kendi kodunda; motor metin çizmez.
Kendi tüketicinin yaşam döngüsüne uyarla.
