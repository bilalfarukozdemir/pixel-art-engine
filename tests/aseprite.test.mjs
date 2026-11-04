import { test } from "node:test";
import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { Painter } from "../dist/index.js";
import { encodeAseprite } from "../dist/output/aseprite.js";

// Biçim belgesine göre yazılmış küçük okuyucu: dosyayı alanlarına ayırır.
function parse(buf) {
  assert.equal(buf.readUInt32LE(0), buf.length, "header dosya boyutu");
  assert.equal(buf.readUInt16LE(4), 0xa5e0, "header sihirli sayı");
  const file = {
    frames: buf.readUInt16LE(6), w: buf.readUInt16LE(8), h: buf.readUInt16LE(10),
    depth: buf.readUInt16LE(12), flags: buf.readUInt32LE(14), colors: buf.readUInt16LE(32),
    layers: [], tags: [], palette: [], cels: [], durations: [],
  };
  const readStr = (o) => {
    const n = buf.readUInt16LE(o);
    return [buf.toString("utf8", o + 2, o + 2 + n), o + 2 + n];
  };
  let at = 128;
  for (let f = 0; f < file.frames; f++) {
    const size = buf.readUInt32LE(at);
    assert.equal(buf.readUInt16LE(at + 4), 0xf1fa, "kare sihirli sayı");
    const chunks = buf.readUInt32LE(at + 12);
    assert.equal(buf.readUInt16LE(at + 6), chunks, "eski ve yeni parça sayısı");
    file.durations.push(buf.readUInt16LE(at + 8));
    let c = at + 16;
    for (let i = 0; i < chunks; i++) {
      const len = buf.readUInt32LE(c);
      const type = buf.readUInt16LE(c + 4);
      const d = c + 6;
      if (type === 0x2004) {
        file.layers.push({
          flags: buf.readUInt16LE(d), type: buf.readUInt16LE(d + 2), opacity: buf[d + 12],
          name: readStr(d + 16)[0],
        });
      } else if (type === 0x2005) {
        const celW = buf.readUInt16LE(d + 16);
        const celH = buf.readUInt16LE(d + 18);
        const pixels = inflateSync(buf.subarray(d + 20, c + len));
        assert.equal(pixels.length, celW * celH * 4, "cel piksel boyutu");
        assert.equal(buf.readUInt16LE(d + 7), 2, "cel türü");
        file.cels.push({
          frame: f, layer: buf.readUInt16LE(d), x: buf.readInt16LE(d + 2), y: buf.readInt16LE(d + 4),
          opacity: buf[d + 6], w: celW, h: celH, pixels,
        });
      } else if (type === 0x2018) {
        let o = d + 10;
        for (let t = 0; t < buf.readUInt16LE(d); t++) {
          const tag = {
            from: buf.readUInt16LE(o), to: buf.readUInt16LE(o + 2),
            direction: buf[o + 4], repeat: buf.readUInt16LE(o + 5),
          };
          [tag.name, o] = readStr(o + 17);
          file.tags.push(tag);
        }
      } else if (type === 0x2019) {
        const from = buf.readUInt32LE(d + 4);
        const to = buf.readUInt32LE(d + 8);
        assert.equal(buf.readUInt32LE(d), to - from + 1, "palet boyutu");
        for (let e = 0; e <= to - from; e++) {
          const o = d + 20 + e * 6;
          file.palette.push([buf[o + 2], buf[o + 3], buf[o + 4], buf[o + 5]]);
        }
      } else {
        assert.fail(`beklenmeyen parça ${type.toString(16)}`);
      }
      c += len;
    }
    assert.equal(c, at + size, "kare boyutu parçalarla tutmalı");
    at += size;
  }
  assert.equal(at, buf.length, "dosya kareden sonra bitmeli");
  return file;
}

// Katmanı kırpılmış cel'lerden yeniden kurar; tüm tuvali karşılaştırmak için.
function renderCel(file, frame, layer) {
  const out = new Uint8Array(file.w * file.h * 4);
  for (const cel of file.cels.filter((c) => c.frame === frame && c.layer === layer)) {
    for (let y = 0; y < cel.h; y++) {
      for (let x = 0; x < cel.w; x++) {
        const si = (y * cel.w + x) * 4;
        out.set(cel.pixels.subarray(si, si + 4), ((y + cel.y) * file.w + x + cel.x) * 4);
      }
    }
  }
  return out;
}

function dot(x, y, color, w = 8, h = 6) {
  const p = new Painter(w, h);
  p.px(x, y, color);
  return p;
}

test("tek katman: kareler, süreler ve pikseller dosyadan aynen okunur", () => {
  const a = dot(1, 1, "#ff0000");
  const b = dot(6, 4, "#00ff00");
  const file = parse(encodeAseprite({ frames: [{ painter: a, delayMs: 120 }, { painter: b }], defaultDelayMs: 80 }));
  assert.deepEqual([file.frames, file.w, file.h, file.depth, file.flags], [2, 8, 6, 32, 1]);
  assert.deepEqual(file.durations, [120, 80]);
  assert.deepEqual(file.layers, [{ flags: 3, type: 0, opacity: 255, name: "Layer 1" }]);
  assert.deepEqual(renderCel(file, 0, 0), a.data);
  assert.deepEqual(renderCel(file, 1, 0), b.data);
});

test("boş pikseller kırpılır, tamamen boş katman karesi yazılmaz", () => {
  const empty = new Painter(8, 6);
  const file = parse(encodeAseprite({
    frames: [
      { layers: [{ name: "govde", painter: dot(3, 2, "#123456") }, { name: "gölge", painter: empty }] },
      { layers: [{ name: "govde", painter: empty }, { name: "gölge", painter: dot(0, 5, "#654321") }] },
    ],
  }));
  assert.deepEqual(file.layers.map((l) => l.name), ["govde", "gölge"]);
  assert.deepEqual(
    file.cels.map((c) => [c.frame, c.layer, c.x, c.y, c.w, c.h, c.opacity]),
    [[0, 0, 3, 2, 1, 1, 255], [1, 1, 0, 5, 1, 1, 255]],
  );
});

test("tam saydam pikselin rengi dosyaya sızmaz", () => {
  const p = dot(1, 1, "#ff0000");
  p.px(3, 1, "#00ff00");
  p.data.set([9, 8, 7, 0], (1 * 8 + 2) * 4); // kırpma alanı içinde saydam ama renkli
  const [cel] = parse(encodeAseprite({ frames: [{ painter: p }] })).cels;
  assert.deepEqual([...cel.pixels.subarray(4, 8)], [0, 0, 0, 0]);
});

test("yarı saydam renk korunur", () => {
  const p = new Painter(2, 1);
  p.data.set([10, 20, 30, 128], 0);
  const file = parse(encodeAseprite({ frames: [{ painter: p }] }));
  assert.deepEqual(renderCel(file, 0, 0), p.data);
});

test("etiketler aralık, yön ve tekrarla yazılır", () => {
  const p = dot(0, 0, "#ffffff");
  const file = parse(encodeAseprite({
    frames: [{ painter: p }, { painter: p }, { painter: p }],
    tags: [
      { name: "atış", from: 0, to: 1 },
      { name: "bekle", from: 2, to: 2, direction: "pingpong", repeat: 3 },
    ],
  }));
  assert.deepEqual(file.tags, [
    { from: 0, to: 1, direction: 0, repeat: 0, name: "atış" },
    { from: 2, to: 2, direction: 2, repeat: 3, name: "bekle" },
  ]);
});

test("palet kullanılan renkleri ilk görülme sırasıyla taşır, en çok 256", () => {
  const two = new Painter(3, 1);
  two.px(0, 0, "#112233");
  two.px(1, 0, "#445566");
  two.px(2, 0, "#112233");
  const file = parse(encodeAseprite({ frames: [{ painter: two }] }));
  assert.deepEqual(file.palette, [[0x11, 0x22, 0x33, 255], [0x44, 0x55, 0x66, 255]]);
  assert.equal(file.colors, 2);

  const many = new Painter(300, 1);
  for (let x = 0; x < 300; x++) many.data.set([x & 255, x >> 8, 0, 255], x * 4);
  const big = parse(encodeAseprite({ frames: [{ painter: many }] }));
  assert.equal(big.palette.length, 256);
  assert.equal(big.colors, 256);
});

test("tamamen boş sprite geçerli dosya üretir", () => {
  const file = parse(encodeAseprite({ frames: [{ painter: new Painter(4, 4) }] }));
  assert.deepEqual([file.cels.length, file.palette.length, file.colors], [0, 0, 256]);
});

test("aynı girdi aynı baytları üretir", () => {
  const make = () => encodeAseprite({ frames: [{ painter: dot(2, 2, "#abcdef") }], tags: [{ name: "a", from: 0, to: 0 }] });
  assert.deepEqual(make(), make());
});

test("hatalı girdi açık hata verir", () => {
  const p = new Painter(4, 4);
  const q = new Painter(5, 4);
  const cases = [
    [{ frames: [] }, /en az bir kare/],
    [{ frames: [{}] }, /boş/],
    [{ frames: [{ painter: p, layers: [{ name: "a", painter: p }] }] }, /hem painter hem layers/],
    [{ frames: [{ painter: p }, { painter: q }] }, /boyutu/],
    [{ frames: [{ layers: [{ name: "a", painter: p }, { name: "a", painter: p }] }] }, /tekrar ediyor/],
    [{ frames: [{ layers: [{ name: "a", painter: p }] }, { layers: [{ name: "b", painter: p }] }] }, /katman listesi/],
    [{ frames: [{ painter: p, delayMs: 0 }] }, /süresi/],
    [{ frames: [{ painter: p }], tags: [{ name: "t", from: 0, to: 1 }] }, /etiket aralığı/],
    [{ frames: [{ painter: p }], tags: [{ name: "t", from: 0, to: 0, repeat: -1 }] }, /tekrar sayısı/],
    [{ frames: [{ painter: p }], tags: [{ name: "t", from: 0, to: 0, direction: "yan" }] }, /yönü/],
    [{ frames: [{ layers: [{ name: "x".repeat(70000), painter: p }] }] }, /ad çok uzun/],
  ];
  for (const [input, message] of cases) assert.throws(() => encodeAseprite(input), message);
});
