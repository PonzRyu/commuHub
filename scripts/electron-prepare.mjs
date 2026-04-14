/**
 * `next build`（standalone）後に、Next が要求する配置へ static / public をコピーし、
 * 同梱用に現在の Node バイナリを electron-resources に複製する。
 */
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rasterizeElectronIcon } from "./rasterize-electron-icon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const bundledDir = path.join(root, "electron-resources", "bundled-node");

await import("./copy-standalone-assets.mjs");

await mkdir(bundledDir, { recursive: true });
const ext = process.platform === "win32" ? ".exe" : "";
const destNode = path.join(bundledDir, `node${ext}`);
await copyFile(process.execPath, destNode);
console.log("electron-prepare: OK（static/public 配置・Node 複製）", destNode);

await rasterizeElectronIcon();
