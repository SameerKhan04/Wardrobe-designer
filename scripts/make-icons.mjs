// Regenerates the app icons (a gold hanger on warm paper). No dependencies: `node scripts/make-icons.mjs`
import { crc32, deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const PAPER = [245, 240, 230];
const GOLD = [184, 134, 43];
const INK = [28, 26, 22];

// The hanger as capsule segments in a 1024 box, centred on (512, 500).
function hanger() {
  const seg = [
    [[512, 470], [150, 700]], [[512, 470], [874, 700]], [[150, 700], [874, 700]], // body
    [[512, 470], [512, 402]], // neck
  ];
  const [cx, cy, r] = [512, 340, 62];
  for (let a = 90; a < 360; a += 10) { // hook: 270 degrees of a ring
    const p = (d) => [cx + r * Math.cos((d * Math.PI) / 180), cy + r * Math.sin((d * Math.PI) / 180)];
    seg.push([p(a), p(Math.min(a + 10, 360))]);
  }
  return seg;
}

function distToSeg(px, py, [[ax, ay], [bx, by]]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** RGBA pixels: optional solid background, hanger stroked in `fg`, scaled about its centre. */
function render(size, { bg, fg, scale }) {
  const segs = hanger();
  const s = size / 1024;
  const half = 20 * scale * s; // half stroke width in output pixels
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // pixel -> hanger space
      const hx = (x / s - 512) / scale + 512;
      const hy = (y / s - 512) / scale + 500;
      let d = Infinity;
      for (const sg of segs) d = Math.min(d, distToSeg(hx, hy, sg));
      const cover = Math.max(0, Math.min(1, 0.5 - (d * scale * s - half))); // 1px anti-alias
      const o = (y * size + x) * 4;
      if (bg) {
        for (let c = 0; c < 3; c++) out[o + c] = Math.round(bg[c] * (1 - cover) + fg[c] * cover);
        out[o + 3] = 255;
      } else if (fg) {
        out[o] = fg[0]; out[o + 1] = fg[1]; out[o + 2] = fg[2];
        out[o + 3] = Math.round(cover * 255);
      }
    }
  }
  return out;
}

function png(size, rgba) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = (name, size, opts) => writeFileSync(`assets/images/${name}.png`, png(size, render(size, opts)));
out('icon', 1024, { bg: PAPER, fg: GOLD, scale: 0.95 });
out('android-icon-foreground', 1024, { fg: GOLD, scale: 0.62 }); // inside the adaptive-icon safe zone
out('android-icon-monochrome', 1024, { fg: INK, scale: 0.62 });
out('android-icon-background', 1024, { bg: PAPER, fg: PAPER, scale: 0.01 });
out('splash-icon', 512, { fg: GOLD, scale: 0.95 });
console.log('icons written');
