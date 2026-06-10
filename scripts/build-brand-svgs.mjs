/**
 * Converte PNGs de marca (fundo escuro) em SVGs transparentes com glow preservado.
 *
 * Uso: node scripts/build-brand-svgs.mjs
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCES = join(__dirname, "brand-sources");
const OUT_DIR = join(ROOT, "public", "brand");
const REPO_LOGO_DIR = resolve(ROOT, "..", "logo");

const BG_TARGETS = [
  [5, 7, 10],
  [0, 0, 0],
  [10, 14, 20],
  [13, 17, 23],
];

const VARIANTS = [
  { png: "devforless-simbolo.png", svg: "devforless-simbolo.svg", title: "DEV4LESS símbolo" },
  { png: "devforless-padrao.png", svg: "devforless-padrao.svg", title: "DEV4LESS logo padrão" },
  { png: "devforless-white.png", svg: "devforless-white.svg", title: "DEV4LESS logo white" },
  {
    png: "devforless-lockup-white.png",
    svg: "devforless-lockup-white.svg",
    title: "DEV4LESS lockup white",
  },
  { png: "devforless-wordmark.png", svg: "devforless-wordmark.svg", title: "DEV4LESS wordmark" },
];

/** @param {number} r @param {number} g @param {number} b */
function saturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/** @param {number} r @param {number} g @param {number} b */
function isBackgroundPixel(r, g, b) {
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const spread = maxC - minC;

  if (maxC <= 48 && spread <= 28) {
    let minDist = Infinity;
    for (const [br, bg, bb] of BG_TARGETS) {
      minDist = Math.min(minDist, Math.hypot(r - br, g - bg, b - bb));
    }
    if (minDist < 40) return true;
    if (maxC <= 28) return true;
  }

  return false;
}

/**
 * Flood-fill a partir das bordas para remover fundo contíguo, preservando glow/desalinhado.
 * @param {Uint8Array} data
 * @param {number} width
 * @param {number} height
 * @param {number} channels
 */
function floodRemoveBackground(data, width, height, channels) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const tryPush = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * channels;
    if (!isBackgroundPixel(data[i], data[i + 1], data[i + 2])) return;
    visited[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx - x) / width;
    data[idx * channels + 3] = 0;

    if (x > 0) tryPush(x - 1, y);
    if (x < width - 1) tryPush(x + 1, y);
    if (y > 0) tryPush(x, y - 1);
    if (y < height - 1) tryPush(x, y + 1);
  }

  for (let idx = 0; idx < total; idx++) {
    const i = idx * channels;
    const a = data[i + 3];
    if (a === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxC = Math.max(r, g, b);

    if (maxC <= 55) {
      const sat = saturation(r, g, b);
      const feather = Math.min(1, (maxC - 18) / 36 + sat * 0.35);
      if (feather <= 0.05) {
        data[i + 3] = 0;
      } else {
        data[i + 3] = Math.round(feather * a);
      }
    }
  }
}

/**
 * @param {Buffer} input
 * @param {{ padding?: number, square?: boolean }} [opts]
 */
async function removeBackground(input, opts = {}) {
  const { padding = 8, square = false } = opts;
  const image = sharp(input).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const alpha = data[i + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  floodRemoveBackground(data, width, height, channels);

  minX = width;
  minY = height;
  maxX = 0;
  maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const alpha = data[i + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    throw new Error("Nenhum conteúdo visível encontrado após remoção de fundo");
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  let cropW = maxX - minX + 1;
  let cropH = maxY - minY + 1;
  let cropX = minX;
  let cropY = minY;

  if (square) {
    const size = Math.max(cropW, cropH);
    cropX = Math.max(0, Math.floor(minX + cropW / 2 - size / 2));
    cropY = Math.max(0, Math.floor(minY + cropH / 2 - size / 2));
    cropW = Math.min(size, width - cropX);
    cropH = Math.min(size, height - cropY);
  }

  const cropped = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  return { png: cropped, width: cropW, height: cropH };
}

/**
 * @param {{ png: Buffer, width: number, height: number, title: string, glowBlur?: number, glowOpacity?: number, viewWidth?: number, viewHeight?: number }} opts
 */
function buildSvg({ png, width, height, title, glowBlur = 4, glowOpacity = 0.55, viewWidth, viewHeight }) {
  const base64 = png.toString("base64");
  const vw = viewWidth ?? width;
  const vh = viewHeight ?? height;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${vw}" height="${vh}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>${title}</title>
  <defs>
    <image id="brandRaster" href="data:image/png;base64,${base64}" width="${width}" height="${height}"/>
    <filter id="brandGlow" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${glowBlur}" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${glowOpacity} 0" result="glow"/>
    </filter>
  </defs>
  <use href="#brandRaster" filter="url(#brandGlow)" aria-hidden="true"/>
  <use href="#brandRaster"/>
</svg>
`;
}

/** @param {string} name @param {string} svg */
function writeSvg(name, svg) {
  const outPath = join(OUT_DIR, name);
  writeFileSync(outPath, svg, "utf8");
  mkdirSync(REPO_LOGO_DIR, { recursive: true });
  writeFileSync(join(REPO_LOGO_DIR, name), svg, "utf8");
  return outPath;
}

async function buildFavicon() {
  const input = readFileSync(join(SOURCES, "devforless-simbolo.png"));
  const { png } = await removeBackground(input, { padding: 16, square: false });

  const trimmed = await sharp(png).trim({ threshold: 10 }).png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const size = Math.max(meta.width ?? 0, meta.height ?? 0) + 24;
  const padLeft = Math.floor((size - (meta.width ?? 0)) / 2);
  const padTop = Math.floor((size - (meta.height ?? 0)) / 2);

  const squared = await sharp(trimmed)
    .extend({
      top: padTop,
      bottom: size - (meta.height ?? 0) - padTop,
      left: padLeft,
      right: size - (meta.width ?? 0) - padLeft,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const squareMeta = await sharp(squared).metadata();
  const svg = buildSvg({
    png: squared,
    width: squareMeta.width ?? size,
    height: squareMeta.height ?? size,
    title: "DEV4LESS favicon",
    glowBlur: 2.5,
    glowOpacity: 0.5,
    viewWidth: 32,
    viewHeight: 32,
  });
  writeSvg("devforless-favicon.svg", svg);
  copyFileSync(join(OUT_DIR, "devforless-favicon.svg"), join(ROOT, "public", "favicon.svg"));
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const variant of VARIANTS) {
    const inputPath = join(SOURCES, variant.png);
    const input = readFileSync(inputPath);
    const { png, width, height } = await removeBackground(input);
    const svg = buildSvg({ png, width, height, title: variant.title });
    const out = writeSvg(variant.svg, svg);
    console.log(`✓ ${variant.svg} (${width}×${height}, ${Math.round(svg.length / 1024)} KB)`);
    void out;
  }

  await buildFavicon();
  console.log("✓ devforless-favicon.svg + public/favicon.svg");
  console.log(`\nArquivos em ${OUT_DIR} e ${REPO_LOGO_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
