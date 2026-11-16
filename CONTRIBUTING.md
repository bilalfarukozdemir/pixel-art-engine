# Katkı rehberi

## Akış

1. Ne yapacağını önce bir **Issue**'da yaz; iki kişi aynı şeyi yazmasın.
2. `master`'dan güncel bir dal aç:
   ```bash
   git switch master && git pull
   git switch -c ozellik/kisa-ad   # hata için: duzeltme/kisa-ad
   ```
3. Küçük, anlamlı commit'ler at; commit mesajı ne değiştiğini söylesin.
4. Göndermeden önce testleri çalıştır:
   ```bash
   npm install
   npm test
   ```
5. Dalı push et ve `master`'a **Pull Request** aç. Açıklamada ne değiştiğini ve
   varsa önce/sonra görselini koy.
6. En az bir kişinin onayından sonra merge edilir; dal merge sonrası otomatik silinir.

`master`'a doğrudan push kapalıdır; her değişiklik PR ile gelir.

## Kurallar

- Çizim çekirdeği (`src/`) bağımlılıksız kalır; yeni paket eklemeden önce Issue'da konuşun.
- `src/core/` en alt katmandır: core dışındaki modülleri (`palette/`, `fx/` vb.) import
  etmez. Bu kural `tests/layers.test.mjs` ile korunur.
- Alfa karışımlı/bulanık AA yok; palet tabanlı açık AA yardımcıları serbest.
  Çekirdek keskin piksel üretir; yumuşatma yalnız açıkça çağrılan yardımcılarla
  yapılır: `downsample` ve opak, en fazla 2 ara ton üreten `aaEllipse` / `aaPoly`
  (`palette` verilirse ara tonlar palete oturur).
- Yeni bir yardımcı ekliyorsan `reference/API.md`'yi, yeni bir teknikse ilgili
  `recipes/` notunu güncelle.
- Yeni davranış için `tests/` altına test ekle.
- Derleme çıktıları (`dist/`, `dist-demo/`) commit'lenmez.
- Kişisel not, yerel dosya yolu, anahtar/token depoya girmez.
