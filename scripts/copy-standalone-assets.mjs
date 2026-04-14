/**
 * `next build`（standalone）後に、Next が要求する `.next/static` と `public` を
 * `.next/standalone` 配下へコピーする（IIS / 本番 Node 向けデプロイ用）。
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const standalone = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");

if (!existsSync(standalone)) {
  console.error("先に `npm run build` を実行してください（.next/standalone がありません）。");
  process.exit(1);
}

await mkdir(path.dirname(staticDest), { recursive: true });
await rm(staticDest, { recursive: true, force: true });
await rm(publicDest, { recursive: true, force: true });
await cp(staticSrc, staticDest, { recursive: true });
await cp(publicSrc, publicDest, { recursive: true });
console.log("copy-standalone-assets: OK");
