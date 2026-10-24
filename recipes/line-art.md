# Çizgi ve kontur tarifi

Kaynak: [SOURCES.md](SOURCES.md) — Pixel Logic, Bölüm 1. Kendi cümlelerimizle özet.

## Çizgi kalınlığı

- Bütün sprite'ta aynı çizgi kalınlığını koru. Çoğu sprite 1px kontur kullanır.
- Kalın çizgi bir stil tercihidir; kalınlaştıkça daha çok AA ister.
- Küçük alanlarda (yüz, parmak) ince çizgi; ana konturda gerekirse kalın.

## Merdiven kuralı (jaggies)

- Düz çizgi, aynı uzunluktaki adımlardan oluşursa pürüzsüz görünür:
  1:1, 2:1, 3:1 ... Dikleştikçe adım uzar. **Adım boylarını karıştırma**:
  2'lik bir merdivene tek bir 1 koymak çizgiyi kırar.
- Eğri, adımların tek yönde değiştiği bir dizidir. İyi örnek (dikeyden yataya):
  `4-3-2-1-1-1-1-2-3-4-8`. Kötü örnek: `...1-1-2-1-3-2-3-8` (2 ile 3 arasında
  1, iki 3 arasında 2 var).
- Ezber cümle: **kısa bir sırayı kendinden uzun sıraların arasına sıkıştırma.**
- Eğriyi piksel piksel çizmek zorunda değilsin: kaba çiz, sonra fazla pikselleri
  sil, eksikleri ekle. Jaggies kaçınılmazdır, sonradan temizlenir.
- Emin değilsen çizginin üstünden hayali bir vektör çizgi geçir; ondan sapan
  pikseller jaggy'dir.
- Siluetin ucu (bir elipsin tepesi gibi) yanındaki adımlardan kısa olmamalı:
  1 piksellik "meme ucu" (nub) bırakma. Düz uç en uzun adımdır.
- Çizgi olmayan yerde de kenar vardır: iki renk alanının sınırı da bir çizgidir.
  Hücre gölgelemenin (cel shading) sınırları da aynı kurala uyar.

## L-köşe (çift piksel)

1px çizgide merdiven basamağı köşesinde fazladan piksel kalırsa çizgi o noktada
kalınlaşır. Basamaklar yalnız çaprazdan birbirine değmeli. Gerçek 90° köşeler
(kutu köşesi) bu kurala girmez.

## Kontur türleri

| Tür | Ne zaman | Motorda |
|---|---|---|
| Kontursuz | Vektör benzeri düz şekiller, arka planlar | konturu atla; jaggy temizliği yine gerekir |
| Siyah iç çizgi | Çok kısıtlı paletler; bugün çamurlu durur | elle `line` + koyu renk |
| Siyah dış kontur | Sprite'ı her zeminde ayırır, temiz | `outline(p, inkOf(renk))` |
| Renkli kontur | Her parça kendi renginin en koyusuyla çevrilir | `colouredOutline(p, {palette})` |
| Seçmeli (sel-out) | Kontur ışığa göre gölgelenir; ortama karışır | `selectiveOutline(p, {light, palette})` |

- Saf siyah yerine paletten türeyen koyu ton kullan: `inkOf(renk)`.
- Seçmeli kontur koyu zeminde en iyi görünür. Açık zeminde kırık durursa
  `lit` değerini yükselt ya da renkli kontura geç.
- Kontur yalnız tek nesnelik tuvalde uygulanır (bkz. API.md, mini-Painter + blit).

## Motorda

- Eşit adımlı çizgi: `stairs(p, x, y, 2, 1, adet, renk)` (2:1), `stairs(p, x, y, 1, 3, ...)` (dik).
- Adımlarla tarif edilen eğri: `runCurve(p, x, y, [4,3,2,1,1,1,1], [2,3,4,8], 1, -1, renk)`.
  Tarifi çizmeden önce `curveRunIssues(dikey, yatay)` ile kontrol et.
- **Elips:** `ellipse` ve `aaEllipse`'e tam sayı merkezle tam sayı yarıçap verme;
  dört uçta da nub oluşur. Yarıçapı .5 eksik ver (`rx=9.5`) ya da merkezi .5 kaydır.
  Bu, 3..16 arası bütün yarıçap çiftlerinde ölçüldü (196/196 temiz).
- Bitince: `formatLint(lintSprite(p))`. `nub`, `double`, `jaggy` uyarılarına bak;
  `markIssues(p, rapor)` ile işaretli kopyayı büyütüp gör.
