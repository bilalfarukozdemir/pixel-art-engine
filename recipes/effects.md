# Zamanlı efekt tarifi (kıvılcım, toz, parça, parıltı)

Efekt bir an değil bir süreçtir: bir şey patlar, parçalar uçar, düşer, seker,
söner. Motor bunu `src/fx/` ile kurar. Sanat yine koddan gelir; zaman, fizik ve
ışık yalnız yardımcıdır.

## Sözleşme

```ts
import { renderEffect, contactSheet, Particles, type Effect } from "../src/index.js";

const pop: Effect<{ color: string }> = {
  meta: { name: "pop", w: 64, h: 48, origin: [32, 36], duration: 0.6, fps: 20 },
  defaults: { color: "#ffd27a" },
  create(rng, o) {
    const ps = new Particles({ ground: () => 0 });           // y = 0 zemin
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 2, sp = 60 + rng() * 80;
      ps.spawn({ kind: "spark", x: 0, y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, colors: ["#fff", o.color], light: 0.6 });
    }
    return { update: (dt) => ps.update(dt), draw: (f) => ps.draw(f) };
  },
};
const frames = renderEffect(pop, { seed: 1 });               // Painter[]
```

- **Yerel koordinat:** (0,0) `origin`; çarpma noktası, ayak ya da zemin. y aşağı.
- **Zaman:** `update(dt)` sabit adımla (1/120 s) çağrılır; kare hızı fiziği
  değiştirmez. Kendi `t`'ni tut, çizimi durumdan yap.
- **Rastgelelik:** yalnız `create`'e gelen `rng` (`Math.random` yok). Aynı seed
  aynı kareleri verir.
- **Bitiş:** tek seferlik efekt `duration` anında hiçbir şey çizmez. Bütün
  parçacıkların ömrü `duration`'dan kısa olmalı.

## İki katman: renk ve ışık

`FxFrame` iki katman tutar. `dot`, `line`, `rect`, `disc` keskin pikseldir.
`glow(x, y, r, renk, güç)` ise ışığa ekler. `composite` ışığı Bayer titreşimiyle
birkaç kademeye (`levels`, varsayılan 4) yuvarlayıp renge ekler. Yumuşak gradyan
çıkmaz; parıltı da piksel sanatı gibi görünür. Rengin boş olduğu yerde ışık
kendi rengini taşır, koyu arka planda toplanır gibi okunur. Açık zemin üstünde
güçlü parıltı leke gibi durabilir: oyunun gerçek arka planında bak.

## Parçacık türleri

| tür | görünüş | varsayılan |
|---|---|---|
| `spark` | hızla uzayan çizgi (en çok 6 px), isterse ışık saçar | yerçekimi 420, sürtünme 0,4 |
| `chunk` | yere düşüp seken, sonra duran kare | yerçekimi 420, sekme 0,3 |
| `dust` | büyüyen, Bayer titreşimiyle sönen disk; zemine çarpmaz | yerçekimi 0, sürtünme 2 |

`colors` yaşa göre sırayla kullanılır, parlaktan koyuya ver. Toz yarı saydam
piksel bırakmaz: her piksel ya çizilir ya çizilmez.

## Derinlikli zemin

`ground` bir fonksiyondur: `(x) => y`. Tek çizgi için `() => 0`. Yandan ama
derinlikli bakan oyunlarda (yolun üstü ve altı olan) zemini x boyunca yumuşak
dalgalandır; parçalar yolun farklı derinliklerine düşer. `sparkBurst`'ün
`depth` seçeneği bunu gösterir. Alan efektinde (buz, patlama) parçaları tek
hatta değil, gücün alanını gösteren yassı bir elipse dağıt.

## Çiz, bak, düzelt

Tek denemede iyi efekt çıkmaz. Her değişiklikten sonra kontak föyüne bak:

```ts
writeFileSync("efekt.png", encodePng(contactSheet(frames, { cols: 9, scale: 3 })));
```

Föy kareleri numaralı, saydam alan dama desenli dizer; `every: 2` her ikinci
kareyi alır, son kare hep alınır. Bakılacaklar: parçalar tuvalden çıkıyor mu,
sonda boş kare kalıyor mu, ilk karede vuruş okunuyor mu, renkler oyunun
zemininde seçiliyor mu. `npm run fx` örnekleri `examples/fx-*.png` olarak yazar.

İki katman ve "çiz, bak, düzelt" fikri [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx)
(MIT) ve Hugo Duprez'in yönteminden esinlendi; buradaki kod bu motor için yazıldı.
