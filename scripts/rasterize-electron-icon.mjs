/**
 * BrowserWindow 用: SVG を PNG（256px）へ書き出す。
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "electron", "assets", "commuHubIcon.svg");
const outPath = path.join(root, "electron", "assets", "commuHubIcon.png");

export async function rasterizeElectronIcon() {
  if (!existsSync(svgPath)) {
    console.warn("rasterize-electron-icon: SVG がありません:", svgPath);
    return;
  }
  await sharp(svgPath)
    .resize(256, 256, { fit: "contain" })
    .png()
    .toFile(outPath);
  console.log("rasterize-electron-icon:", outPath);
}

const entry = process.argv[1];
if (entry && path.resolve(entry) === path.resolve(fileURLToPath(import.meta.url))) {
  await rasterizeElectronIcon();
}
