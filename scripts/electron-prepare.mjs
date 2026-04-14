/**
 * `next build`（standalone）後に、Next が要求する配置へ static / public をコピーし、
 * 同梱用に現在の Node バイナリを electron-resources に複製する。
 */
import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rasterizeElectronIcon } from "./rasterize-electron-icon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const standalone = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");
const bundledDir = path.join(root, "electron-resources", "bundled-node");

if (!existsSync(standalone)) {
  console.error("先に `npm run build` を実行してください（.next/standalone がありません）。");
  process.exit(1);
}

await mkdir(path.dirname(staticDest), { recursive: true });
await rm(staticDest, { recursive: true, force: true });
await rm(publicDest, { recursive: true, force: true });
await cp(staticSrc, staticDest, { recursive: true });
await cp(publicSrc, publicDest, { recursive: true });

await mkdir(bundledDir, { recursive: true });
const ext = process.platform === "win32" ? ".exe" : "";
const destNode = path.join(bundledDir, `node${ext}`);
await copyFile(process.execPath, destNode);
console.log("electron-prepare: OK（static/public 配置・Node 複製）", destNode);

await rasterizeElectronIcon();
