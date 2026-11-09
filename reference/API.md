# pixel-art-engine — Kullanım Kılavuzu

Önce ../GUIDE.md'deki görev seçimini yap. Bu dosya ayrıntılı API başvurusudur.

## 13 Eylül ekleri / kesin davranışlar

- `vgrad(..., {smooth:true})`: RGBA kanallarını doğrusal harmanlar; yumuşak
  gradyan istendiğinde kullan. `dither` seçeneğini geçersiz kılar.
- `vgrad(..., {dither:false})`: ESKİ sert eşik davranışı korunur, interpolasyon
  yapmaz. Varsayılan ise Bayer dithering'dir. Eski oyunlar kendiliğinden değişmez.
- `upscale(p, n)` **Painter değil Uint8Array** döndürür. `const big = new
  Painter(p.w*n,p.h*n); big.data.set(upscale(p,n)); encodePng(big)` kullan.
- `stoneCourses(p,x,y,w,h,palette?,course=7,block=11)` verilen kutuda taş yüzeyi
  ve derzleri boyar. `w,h >= 1`, `course,block >= 3`, boyutlar tam sayı.
- `archedDoor(p,x,y,w,h,palette?,iron=false)`: kutu içinde kemer/karanlık
  açıklık/ahşap kapı. En az 11×16; yükseklik kemer yarıçapından en az 4 büyük.
- `lancetWindow(p,x,y,w,h,palette?,glow?)`: en az 5×8, sivri mazgal.
- `contactShadow(p,cx,groundY,w,h,color?,opacity=60)`: merkez koordinatlı,
  en az 2×2, opacity 0..255. Statik atlas'a bir kez üret; canlı oyunda geometri çizme.
- `MasonryPalette`: face/light/joint/recess/wood. Varsayılan WARM_STONE;
  oyunun renklerini geçirmek serbest. Hiçbiri outline veya seviye açılışı yapmaz.
  Örnek tam kullanım: ../demo/recipes.ts; testler: ../tests/architecture.test.mjs.

Bu dosya, motoru kullanarak yeni bir sahne/karakter/efekt üretecek bir
sonraki ajan (ya da insan) için yazıldı. "Hangi fonksiyon ne işe yarar" ve
"bir sahne kurarken hangi sırayla, neye dikkat ederek ilerlenir" sorularına
cevap verir. Zaman-bağımsız bir referanstır.

## Felsefe (unutma)

Her piksel matematikle yerleştirilir — AI, diffusion, hazır asset yok.
Rastgelelik sadece `mulberry32(seed)` ile (`Math.random` yasak): aynı seed
→ aynı sahne, her zaman yeniden üretilebilir. Antialiasing yok, bu kasıtlı
— piksel sanatın keskin kenarlı görünümü tam olarak buradan geliyor.

## Hızlı başlangıç

```ts
import { writeFileSync } from "node:fs";
import { Painter, mulberry32 } from "../src/index.js";
import { encodePng } from "../src/output/png.js"; // Node-only, ayrı import

const p = new Painter(64, 48);
const rng = mulberry32(42);
p.fill("#0d0b10");
p.ellipse(32, 24, 10, 8, "#8aab52");
writeFileSync("out.png", encodePng(p));
```

`src/index.ts` sadece runtime-agnostik olanı export eder. `output/png.ts`
(Node, `node:zlib`) ve `output/canvas.ts` (tarayıcı, DOM) kasıtlı ayrı
yollardan import edilir — biri diğerine sızarsa bundle kırılır.

## Çekirdek: `Painter` (`src/core/painter.ts`)

Kendi RGBA `Uint8Array` buffer'ına yazar, hiçbir runtime API'sine bağlı
değil. Çıktı katmanı bu buffer'ı PNG'ye ya da canvas'a çevirir.

| Metod | Ne zaman kullanılır |
|---|---|
| `px(x,y,c)` | Tek piksel. `c`'nin alfası <255 ise **Porter-Duff source-over ile birleşir**: boş hedefte kaynak RGB ve alfa korunur; yarı saydam hedefte RGB alfa ağırlıklıdır, alfa `As + Ad*(1-As)` olur; opak hedefte eski yuvarlama korunur — ince highlight/rim-ışığı/sis için temel taş. |
| `get(x,y)` | Bir pikseli geri oku (nadiren gerekir, debug/kompozisyon kontrolü için). |
| `fill(c)` / `rect` / `hline` / `vline` | Düz alan/zemin/kutu. |
| `line(x0,y0,x1,y1,c)` | Bresenham. İnce uzun şeyler: sap, ip, çizgi, asa. |
| `ellipse(cx,cy,rx,ry,c)` | Yuvarlak formlar: baş, göz, ay, taş, alev tabanı. |
| `poly(pts,c)` | **En çok kullanacağın araç.** Düzensiz/çokgen şekiller: gövde, giysi, çatı, dağ silüeti, kule. Scanline dolgu, antialiasing yok. |
| `vgrad(x,y,w,h,stops,opts)` | Dikey degrade, Bayer 4×4 dithering ile (`opts.dither=false` ile kapatılabilir). Gökyüzü, zemin geçişi. `stops`: `{t, color}[]`, `t` artan 0..1. |
| `scatter(x,y,w,h,c,count,rng)` | Rastgele nokta serpme: yıldız, toz, kıvılcım. `rng` **zorunlu parametre** — Math.random yok. |
| `blit(src,dx,dy)` | Başka bir `Painter`'ı `(dx,dy)`'ye alfa-harmanlı kopyalar. İki kullanım: (1) atlas/katalog oluşturmak, (2) **mini-Painter compose** — aşağıya bak. |
| `vignette(strength=0.3)` | Köşelere doğru karartma, 8 kademeye nicelenmiş. **Kullanılıyorsa sahnenin son adımıdır; zorunlu değildir** — Veyra'nın her paneli bununla bitiyor, sinematik/odaklanmış his katar. İlk demo turunda hiç kullanılmamıştı; unutmak sık yapılan bir hata. |

## Renk sistemi (`src/core/color.ts`) — kritik ayrım

- `hex(c)` — `"#rrggbb(aa)"` ↔ `[r,g,b,a]` dönüşümü, genelde elle çağırman gerekmez.
- `shade(c, f)` — basit koyulaştır/aydınlat (`f<1` koyu, `f>1` açık). Hızlı ton varyasyonu.
- `mix(a, b, t)` — iki rengin `t` (0..1) oranında karışımı. **Her zaman opak (`alpha=255`) döner.** Bir YÜZEYİN (poly/ellipse dolgusunun) kendi rengini "bu ışığa mı bakıyor" mantığıyla hesaplamak için doğru araç.
- `alpha(c, a)` — renge alfa (0..255) ekler. İNCE bir çizgi/nokta/highlight/rim-ışığı eklemek için doğru araç, çünkü `px()`'in blend mekanizmasından geçer ve hedef alfasını da hesaba katar; boş hedefte kaynak rengi koyulaşmadan kalır.

**Sık yapılan hata:** `mix()`'i ince bir rim-ışığı çizgisinde kullanmak —
sonuç "yama" gibi sert bir çizgi olur çünkü opak boyanır, altındaki dokuyla
karışmaz. Bu gerçekten yaşandı (`campfire-elder-wallpaper.ts`) ve
`alpha(DP.ember2, 90)` ile düzeltildi. Kural: **yüzey rengi → `mix`, ince vurgu/çizgi → `alpha`.**

## RNG (`src/core/rng.ts`)

`mulberry32(seed): Rng` — deterministik üretici. Bir sahnede genelde
**birden fazla rng kaynağı** olur:

- **Ana `rng`**: sahnenin sabit kısımları (yıldız, taş, çim dizilimi). Çağrı
  SAYISI ve SIRASI hiçbir zaman animasyon parametresine (`frameT` gibi)
  bağlı olmamalı — aksi halde tüm sahne kareler arası kayar.
- **Efekt-özel rng'ler** (örn. `fireRng`, `smokeRng`): animasyonlu/rastgele
  değişmesi gereken kısımlar için AYRI kaynak, farklı bir seed ile. Bkz.
  `campfire-elder-wallpaper.ts` — kıvılcımlar `fireRng` kullanıyor, ana
  sahne (dağ/yıldız/çim/adam/çadır) `rng` ile hâlâ birebir sabit.

## Motifler (`src/motifs/index.ts`)

Painter üstüne kompoze edilen, çoğu `rng` alan hazır sahne parçaları.

| Fonksiyon | Ne için |
|---|---|
| `stars(p,x,y,w,h,count,rng,c)` | Yıldız alanı. İki yoğunlukta (sönük+parlak) üst üste çağırmak zenginlik katar. |
| `fogBand(p,y,thickness,c,rng,a)` | Yatay, dalgalı sis bandı. |
| `orb(p,cx,cy,r,core,haloC)` | Ay/statik parlayan küre + halo. |
| `glow(p,x,y,r,core,haloColor,intensity,opts)` | **Animasyonlu** ışık kaynağı — `intensity` (0..1) kare kareye değiştirilerek "yanıp sönme" elde edilir. `opts.rng`+`opts.flicker` ile kenarda kıvılcım. Ateş, büyülü taş, fener için. |
| `crenellate` / `tower` / `deadTree` / `veins` | Mimari/doğa parçaları (mazgal, kule, ölü ağaç, çatlak/damar). |
| `embers(p,...,emberColors)` / `ashfall(p,...,ashColors)` | Havada asılı parçacık — renkler PARAMETRE (motor kendi paleti dayatmaz). |
| `hoodedFigure(p,x,baseY,h,c,opts)` | Kapüşonlu silüet. `opts.seated`, `opts.rim` (-1/0/1, ışığa dönük kenar). |

## İkon araçları (`src/icon/index.ts`) — nerede kullanılır, dikkat

| Fonksiyon | Kullanım |
|---|---|
| `outline(p, color)` | Şekil BİTTİKTEN SONRA çağrılır — opak/şeffaf sınırına 1px kontur basar. |
| `glint(p, cx, cy, c)` | Tek noktadan highlight (metal/cam parıltısı). |
| `mirrorX(p)` | Sol yarıyı sağa aynalar (simetrik ikonlar). |

**Kritik uyarı:** `outline()` TÜM tuvale uygulanır — bir "sahne" (birden
fazla nesne içeren büyük tuval) üzerinde çağırırsan zemin, duvar, her şey
kontur alır, muhtemelen istemediğin bir sonuç. İki doğru kullanım yolu:

1. **Icon/tek-nesne tuvali**: 32×32 gibi küçük, tek bir nesneyi kaplayan
   tuval — `outline` doğrudan işe yarar (bkz. Veyra'nın item/portre
   ikonları).
2. **Mini-Painter compose** (sahne içinde karaktere outline istiyorsan):
   karakteri KENDİ küçük `Painter`'ında çiz, `outline()` uygula, sonra ana
   sahneye `p.blit(miniPainter, dx, dy)` ile ekle. `party-ruins.ts`'teki
   `drawBull()`/`drawMage()`/`drawFrogMage()` fonksiyonları bu deseni
   gösteriyor — üçü de kendi tuvalinde çizilip outline alıyor, sahne
   zemini/duvarı bundan etkilenmiyor.

## Katalog (`src/catalog/index.ts` + `src/output/catalog-fs.ts`)

`Catalog.add(id, painter, meta)` ile üretilmiş bir sprite'ı sakla — aynı id
ikinci kez eklenemez (tekrar üretmemek zaten amaç). `buildAtlas(maxWidth)`
shelf-packing ile hepsini tek bir `Painter`'da birleştirir (`Painter.blit`
kullanır). `saveCatalog`/`loadManifest` (Node-only) atlas.png + manifest.json
olarak diske yazar/okur. Bir varlığı (örn. "goblin") ikinci bir projede
kullanacaksan önce kataloğa bak, sıfırdan yeniden yazma.

## Çıktı katmanları

- `output/png.ts` — Node-only, bağımlılıksız PNG encoder/decoder + `upscale(painter, n)` (nearest-neighbor büyütme, inceleme/gerçek export için).
- `output/canvas.ts` — tarayıcı-only, `ImageData` ile `<canvas>`'a blit.
- `output/gif.ts` — `gifenc` (npm paketi) ile animasyonlu GIF. `encodeGif(frames, opts)`, her `frame: {painter, delayMs}`.
- `output/aseprite.ts` — Node-only, bağımlılıksız `.aseprite` encoder. `encodeAseprite({frames, tags?, defaultDelayMs?})` Buffer döndürür.
  - Her kare `{painter, delayMs?}` ya da `{layers: [{name, painter}], delayMs?}`. Dizideki ilk katman en altta kalır; her karede aynı adlar aynı sırada olmalı, boyutlar eşit olmalı.
  - `tags`: `{name, from, to, direction?, repeat?}`. `from` ve `to` 0'dan başlar, `to` dahildir. Yön: `forward`, `reverse`, `pingpong`, `pingpong-reverse`.
  - Boş pikseller kırpılır, tamamen boş katman karesi yazılmaz. Süre 1..65535 ms, varsayılan 100.
  - Dosya RGBA'dır. Palete kullanılan renkler ilk görülme sırasıyla, en çok 256 tane yazılır; alfa palete taşınmaz.

## Zamanlı efektler (`src/fx/`) ve kontak föyü

Tarif: [../recipes/effects.md](../recipes/effects.md).

- `renderEffect(effect, {seed?, fps?, step?, levels?, opts?})` → `Painter[]`. Kare sayısı `round(duration*fps)+1`, son kare `t = duration`. Simülasyon 1/120 s adımla ilerler; kare hızı fiziği değiştirmez.
- `Effect<O>`: `{meta: {name, w, h, origin, duration, fps}, defaults, create(rng, opts) → {update(dt), draw(frame)}}`.
- `FxFrame(w, h, origin)`: yerel koordinatlı `dot`, `ditherDot`, `line`, `rect`, `disc(x,y,r,c,a?,dither?)`; ışık için `glow(x,y,r,c,güç)`. `color` bir Painter, `light` w*h*3 Float32Array.
- `composite(frame, {levels?})`: ışığı Bayer titreşimiyle `levels` kademeye yuvarlayıp renge ekler; boş pikselde ışık en parlak kanalı opaklık olan renk olur.
- `Particles({ground?})`: `spawn({kind, x, y, vx, vy, life, gravity?, drag?, bounce?, size?, colors, light?})`, `update(dt)`, `draw(frame)`, `count`. `ground(x)` yerel y; toz zemine çarpmaz.
- `sparkBurst`: hazır örnek efekt; `depth` > 0 derinlikli zemin.
- `contactSheet(frames, {cols?, scale?, every?, gap?, checker?, numbers?})` → Painter. Saf çekirdek; PNG için `encodePng`.

## Bir sahne nasıl kurulur — katman sırası

Yukarıdan aşağıya, arkadan öne:

1. **Gökyüzü ve zemin tabanı (nesnelerden önce)** — `vgrad`, genelde 3+ durak (2 durak "düz" hisseder).
2. **Uzak arkaplan** (dağ, uzak kule, ufuk) — soluk/koyu, ana kompozisyonun gölgesi gibi.
3. **Orta plan** (bina, duvar, ağaç) — burada **yönlü ışıklandırma** başlar: "bu yüzey ışığa mı bakıyor" sorusunu her poly için sor, `mix(temelRenk, ışıkRengi, oran)` ile ışık yüzü ayrı çiz.
4. **Karakterler/ana nesneler** — karmaşıksa mini-Painter+outline+blit (yukarı bak).
5. **Dip gölgeleri (kompozisyonda nesnelerin altında çiz)** — HER nesnenin altına `alpha(night0, ~130)` ile ince bir "temas gölgesi" ekle, yoksa nesne "havada asılı" görünür. Kolayca unutulan bir adım.
6. **İkincil atmosfer** — duman (yükseldikçe solan), ısı parıltısı, kıvılcım, sis. Sahneye "yaşıyor" hissi bunlardan gelir.
7. **`vignette()`** — yalnız odak/ton gerektiriyorsa, UI hariç en son.

**Tekrarlayan elemanlar için parametrik mini-üretici yaz.** 3 kule, 5
pencere sırası, 2 köprü mü çiziyorsun? Elle 3-5 kez kopyala-yapıştır yerine
yerel bir fonksiyon tanımla (`function kule(cx,baseY,w,h,spireH) {...}`) ve
farklı parametrelerle çağır — hem DRY hem tutarlı, hem de matematiksel
desenler (bir `for` döngüsüyle yükseklik bazlı renk geçişi, `Math.sin` ile
sarkan bir köprü/kablo) elle yazmaktan daha organik sonuç verir.

## Çözünürlük — ne kadar küçük çok küçük?

Somut referans noktaları (tümü bu projede gerçekten denendi):

- **~1.200 piksel** (örn. 48×24): karmaşık bir nesne (motosiklet, insan)
  tanınmaz kalır; ne olduğunu tahmin etmek neredeyse imkânsızdır.
- **~4.800 piksel** (örn. 96×48, 80×56): tek bir nesne/kısa sahne için
  kabul edilebilir, detay sınırlı ama tanınabilir.
- **192×80 = 15.360 piksel**: Veyra'nın "sahne paneli" standardı — birden
  fazla nesne + atmosfer içeren bir sahne için makul bir taban.
- **384×216 = 82.944 piksel**: "duvar kağıdı" ölçeği (16:9, ×5 ile
  1920×1080'e oturur), zengin detaya izin verir.
- **1920×1080'i native çizme.** Piksel sanatın "her piksel kasıtlı"
  karakterini bozar. Düşük-native-çöz + `upscale()` yolu her zaman
  tercih edilir (bir oyun motorunun render çözünürlüğü/ekran çözünürlüğü
  ayrımıyla aynı mantık).

Çözünürlük tek başına yeterli değil — bkz. bir sonraki bölüm.

## Bilinen sınırlar / dikkat listesi

- **`mix()` opak döner** — ince highlight/rim-ışığı için `alpha()` kullan (yukarıya bak).
- **`outline()` tüm tuvale uygulanır** — sahne içinde tek karaktere istiyorsan mini-Painter+blit.
- **Karmaşık organik/simetrik şekiller** (yüz, hayvan kafası, simetrik silah)
  elle koordinatla ZOR. Motosiklet sürücüsü ve minotor kafası/baltası iki
  ayrı denemede de ilk seferde oturmadı, 2-3 iterasyon gerekti. Bu motorun
  sınırı değil — `poly`/`outline`/`mix` hepsi çalışıyor, zorluk doğru
  geometriyi (oran, açı, nokta sayısı) elle tutturmakta. İlk seferde
  mükemmel beklenmemeli; gerçek render alıp bakmadan "bitti" denmemeli.
- **Temas gölgesi gereklidir; vignette isteğe bağlıdır** — ikisi de küçük
  ama fark yaratıyor, checklist'e dahil et.
- **Bayer dithering** (`vgrad`) yüksek upscale çarpanlarında (×5+) belirgin
  bir "checker" deseni bırakabilir — kasıtlı ama gözden kaçmasın.
- **Animasyonda ana `rng`'yi bozmadan hareket ekleme**: yeni bir animasyonlu
  eleman eklerken ana sahnenin rng çağrı sırasını değiştirme — ayrı bir rng
  kaynağı aç (bkz. RNG bölümü) ya da çizim SIRASINDA sabit bir offset ekle
  (bkz. `campfire-elder-wallpaper.ts`'teki çim salınımı: rng() çağrı sayısı
  aynı kalıyor, sadece sonuca `Math.sin(frameT*2π+i)` offset'i ekleniyor).
- **Loop-uyumlu animasyon fonksiyonu**: bir GIF döngüsü için titreşim/nefes
  fonksiyonu yazıyorsan `t=0` ile `t=1` aynı değeri vermeli (saf `sin(t*2π*n)`
  toplamları bunu otomatik sağlar) — yoksa döngü noktasında sıçrama olur.
  Örnek: `fireFlicker`/`slowBreath` (`campfire-elder-wallpaper.ts`).

## Referans örnekler — hangi dosyaya ne için bakılır

- `../demo/scenes/campfire-elder-wallpaper.ts` — yönlü ışıklandırma, ışık
  halkası, duman, dip gölgesi, vignette; ayrıca deterministik animasyon
  (birden fazla rng kaynağı, loop-uyumlu flicker/breath fonksiyonları).
- `../demo/build-wallpaper-gif.ts` — çoklu kare üretip `encodeGif`'e verme.
- `../demo/scenes/party-ruins.ts` — mini-Painter + `outline` + `blit` compose
  deseni, parametrik olmayan ama tamamen sıfırdan (referans görselden)
  üretilmiş çok-karakterli bir sahne örneği.
- `../demo/build.ts` — birden fazla sahneyi `Catalog`'a ekleyip atlas + PNG
  olarak kaydetme.


## Gürültü ve organik çizim (saf çekirdek)

Hepsi `src/index.js` üzerinden alınır. Renk parametreleri `ColorInput`
(`#rrggbb`, `#rrggbbaa` veya `[r,g,b,a]`). Veyra paleti/sabitleri taşınmaz.

- `H32(a,b): number`: 0..1 deterministik hash. Normal JS çarpması kullanır,
  **Math.imul değildir**; Veyra ile sayısal uyum için değiştirilmemelidir.
- `vnoise(x,y): number`: yumuşatılmış iki boyutlu değer gürültüsü.
- `fbm(x,y,oct=4): number`: 2.03 frekans, 0.5 genlik çarpanlı oktav toplamı;
  `oct` pozitif tam sayı olmalı. Bu üç işlevin ayrı RNG/seed parametresi yok;
  seed koordinata ofset olarak katılır.
- `stroke(p,x0,y0,x1,y1,c,amp,seed): void`: dik yönde gürültüyle salınan çizgi.
- `wobblePoly(pts,amp,seed,step=3): [number,number][]`: kenarları böler ve
  noktaları oynatır; girdi değişmez, `step > 0` kullan.
- `erode(layer,amount,seed,passes=2): void`: silüeti yerinde aşındırır/büyütür.
  `amount` genelde 0..1, `passes` negatif olmayan tam sayı.
- `roughTower(p,x,base,w,h,lean,c,seed): void`: eğik, düzensiz kule gövdesi.

Algoritmalar, döngü ve işlem sırası Veyra `organik.ts` ile aynıdır.
`px` düzeltmesi saydam hedefe yarı saydam renk çiziminde bilinçli fark yaratır.

## Görüntü işleme (saf çekirdek, `src/core/image.ts`)

`src/index.js` üzerinden import edilir; Node/DOM bağımlılığı yoktur.
`resizeArea` yeni Painter döndürür; diğer üç işlev Painter'ı yerinde değiştirir.

- `resizeArea(src,width,height=round(src.h*width/src.w)): Painter`: tam sayı
  olmayan ölçek oranlarında gerçek alan örtüşmesiyle, alfa ağırlıklı küçültme.
  Varsayılan yükseklik en az 1; hedef boyutlar pozitif tam sayı ve kaynaktan
  büyük olamaz. Tam saydam RGB ortalamaya katılmaz. Mevcut `downsample` değişmedi.
- `chromaKey(p,opts={}): void`: anahtar ve kenar sızıntısı temizliği.
  `ChromaKeyOptions`: `key: ColorInput = '#ff00ff'`, `dominance=60`,
  `high=140`, `low=120`, `edgeDominance=25`, `spillPrimary=40`,
  `spillSecondary=60`, `passes=2`.
  Anahtarın >=128 olan güçlü kanalları ve <128 olan zayıf kanalları ayrılır
  (RGB/CMY tonları, ör. yeşil veya macenta; siyah/beyaz anahtar desteklenmez).
  En düşük güçlü kanal eksi en yüksek zayıf kanal > dominance **veya**
  güçlü kanallar > high, zayıf kanallar < low ise alfa sıfırlanır.
  Dört yönde saydam/tuval dışı komşu kenar sayılır. Kenarda fark > edgeDominance
  ise piksel geçiş sonunda silinir; kalan güçlü kanallar zayıf kanal + spill
  sınırına kırpılır (RGB kanal sırasındaki ilk güçlüye primary, diğerine secondary).
  Varsayılan macenta davranışı karma.ts ile aynıdır; kalan alfa korunur.
- `quantizeKMeans(p,colors,opts={}): void`: en çok `colors` RGB rengine indirger.
  `QuantizeOptions`: `seed=7`, `iterations=14`, `maxSamples=60000`.
  RNG `mulberry32` olduğundan Veyra karma.ts içindeki eski LCG ile aynı
  palet beklenmez. Tam saydam pikseller atlanır; diğer alfalar korunur.
  Renk/iterasyon/örnek sayısı pozitif tam sayı; boş görüntü değişmez.
- `despeckle(p,threshold=6): void`: sekiz komşudan en az threshold tanesi aynı
  farklı RGB'deyse ve mevcut RGB'den komşu yoksa merkez RGB değiştirilir.
  Girdi anlık kopyayla değerlendirilir; alfa, saydam pikseller ve sınırlar
  korunur. threshold 1..8 tam sayı.

## PNG çözme ve animasyon sheet (Node-only)

Doğrudan `src/output/png.js`, `src/output/sheet.js` veya ortak Node girişi
`src/output/index.js` üzerinden alınır; tarayıcı girişine eklenmez.

- `decodePng(bytes: Uint8Array): Painter`: 8-bit RGB (tip 2) ve RGBA (tip 6),
  filtre 0..4, birden fazla IDAT ve RGB tRNS destekler. Interlace, diğer renk
  tipleri/bit derinlikleri ve bilinmeyen kritik chunk'lar açık hatayla reddedilir.
  İmza, CRC, veri uzunluğu ve zlib doğrulanır. `encodePng(decodePng(bytes))`
  RGBA piksellerini korur; kaynak sıkıştırması/metadata korunmaz.
- `encodeSheet({frames,pivot,animations}): EncodedSheet`: eş boyutlu, boş olmayan
  `Painter[]` karelerden tek satır PNG üretir; dosya yazmaz.
  Dönüş `{png: Buffer, json: string, aseprite: Buffer}`. `pivot: [x,y]`,
  tuval koordinatlarıdır. PNG kare sırası girdi sırasıdır; ham RGBA korunur.
  JSON tipi `SheetMetadata`, animasyon tipi `SheetAnimation`, seçenek tipi
  `EncodeSheetOptions`:

```json
{
  "frameWidth": 64,
  "frameHeight": 64,
  "pivot": [32, 60],
  "animations": {
    "attack": {
      "frames": [0, 1, 2],
      "delays": [90, 90, 110],
      "events": {"2": "hit"},
      "hitStopMs": {"2": 45}
    }
  }
}
```

`frames` sheet'teki sıfır tabanlı indeksler; `delays` aynı uzunlukta ms
süreleri (1..65535). Tekrar/sıra serbesttir. Opsiyonel `events` string,
`hitStopMs` negatif olmayan sonlu ms değerleri taşır; anahtarlar **animasyon
listesindeki** sıfır tabanlı kare sırasıdır. Alanlar verilmezse JSON'a eklenmez.
Motor bu metadata'yı çalıştırmaz; dövüş sistemi tüketir.
Aseprite zaman çizelgesi animasyonları nesnenin giriş sırasıyla birleştirir,
her animasyon için etiket ekler; tekrar edilen kareler/süre farkları korunur.
Hiçbir animasyonda kullanılmayan kareler sona 100 ms süreyle etiketsiz eklenir.
JSON ve PNG indeksleri bu Aseprite zaman çizelgesinden bağımsızdır.
