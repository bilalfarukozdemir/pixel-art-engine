# Çizgi ve kontur tarifi

Kaynak: [SOURCES.md](SOURCES.md). Kitaptaki çizgi bölümünden öğrenilenlerin
kendi cümlelerimizle özeti; örnekler motorun kendi çıktısıdır.

## Çizgi kalınlığı

- Bütün sprite'ta aynı çizgi kalınlığını koru. Çoğu sprite 1px kontur kullanır.
- Kalın çizgi bir stil tercihidir; kalınlaştıkça kenarı yumuşatmak için daha çok ara ton ister.
- Küçük alanlarda (yüz, parmak) ince çizgi; ana konturda gerekirse kalın.

## Eşit merdiven kuralı (jaggies)

- Düz çizgi, aynı uzunluktaki adımlardan oluşursa pürüzsüz görünür:
  1:1, 2:1, 3:1 ... Dikleştikçe adım uzar. **Adım boylarını karıştırma**:
  2'lik adımlarla giden bir çizgiye tek bir 1'lik adım girerse çizgi kırılır.
- Eğri, adım boyunun tek yönde değiştiği bir dizidir. Motor örneği:
  `ellipse(cx, cy, 11.5, 8.5)` dış konturunun sol üst çeyreği, soldan tepeye
  `3-2-1-1-2-3-4` (önce dikey adımlar kısalır, sonra yatay adımlar uzar).
  Aynı çeyreği bozarsak, örneğin `3-1-2-2-1-3-4`, adım boyu iki kez yön
  değiştirir ve eğri tırtıklı okunur.
- Akılda kalacak kural: **kısa bir adımı, iki tarafındaki daha uzun adımların
  arasına sıkıştırma.**
- Eğriyi baştan kusursuz çizmek zorunda değilsin: kabaca çiz, sonra fazla
  pikselleri sil, eksikleri ekle. Düzensiz adımlar kaçınılmazdır; temizlikte düzelir.
- Emin değilsen çizginin üstünden ideal, düz bir çizgi geçtiğini düşün; ondan
  belirgin sapan pikseller düzensiz adımdır.
- Siluetin ucu (bir elipsin tepesi gibi) yanındaki adımlardan kısa olmamalı:
  1 piksellik "meme ucu" (nub) bırakma. Düz uç en uzun adımdır.
- Çizgi olmayan yerde de kenar vardır: iki renk alanının sınırı da bir çizgidir.
  Hücre gölgelemenin (cel shading) sınırları da aynı kurala uyar.

## L-köşe (çift piksel)

1px çizgide bir basamak köşesinde fazladan piksel kalırsa çizgi o noktada
kalınlaşır. İnce çizgide basamaklar birbirine yalnız çaprazdan değer.
Gerçek 90° köşeler (kutu köşesi) bu kurala girmez. Baştan sona her basamağı
4-bağlantılı (2px kalın) çizilmiş bir çizgi tutarlıdır; o bir kalınlık seçimidir.

## Kontur türleri

| Tür | Ne zaman | Motorda |
|---|---|---|
| Kontursuz | Düz renk alanlarıyla çalışan stiller, arka planlar | konturu atla; kenar temizliği yine gerekir |
| Koyu iç çizgi | Parçaları içeriden ayırmak; aşırısı çamurlu durur | elle `line` + koyu ton |
| Koyu dış kontur | Sprite'ı her zeminde ayırır | `outline(p, inkOf(renk))` |
| Renkli kontur | Her parça kendi renginin en koyusuyla çevrilir | `colouredOutline(p, {palette})` |
| Seçmeli (sel-out) | Kontur ışığa göre tonlanır; nesne ortama karışır | `selectiveOutline(p, {light, palette})` |

- Saf siyah yerine paletten türeyen koyu ton kullan: `inkOf(renk)`.
- Seçmeli kontur koyu zeminde en iyi görünür. Açık zeminde kırık durursa
  `lit` değerini yükselt ya da renkli kontura geç.
- Kontur yalnız tek nesnelik tuvalde uygulanır (bkz. API.md, mini-Painter + blit).

## Motorda

- Eşit adımlı çizgi: `stairs(p, x, y, 2, 1, adet, renk)` (2:1), `stairs(p, x, y, 1, 3, ...)` (dik).
- Adımlarla tarif edilen eğri: `runCurve(p, x, y, [3,2,1,1], [2,3,4], 1, -1, renk)`.
  Tarifi çizmeden önce `curveRunIssues(dikey, yatay)` ile kontrol et.
- **Elips:** `ellipse` ve `aaEllipse`'e tam sayı merkezle tam sayı yarıçap verme; dört uçta da
  nub oluşur. Yarıçapı .5 eksik ver (`rx=9.5`) ya da merkezi .5 kaydır.
  3..16 arası bütün yarıçap çiftlerinde (196 elips) ölçüldü: tam sayı yarıçapla
  `ellipse` 676, `aaEllipse` 420 nub; .5 eksik yarıçapla ikisinde de 0.
- Bitince: `formatLint(lintSprite(p))`. `nub`, `double`, `jaggy` uyarılarına bak;
  `markIssues(p, rapor)` ile işaretli kopyayı büyütüp gör.
