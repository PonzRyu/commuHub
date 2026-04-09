import {
  APP_DISPLAY_NAME_PREFIX_DEFAULT,
  APP_DISPLAY_NAME_SUFFIX,
} from "@/lib/app-display-constants";
import { prisma } from "@/lib/prisma";

export {
  APP_DISPLAY_NAME_PREFIX_DEFAULT,
  APP_DISPLAY_NAME_SUFFIX,
} from "@/lib/app-display-constants";

const SITE_CONFIG_ID = 1;

/**
 * DB に保存されている接頭辞を正規化（誤って全体が入っていた場合に末尾 CommuHub を除去）
 */
export function normalizeDisplayNamePrefix(
  raw: string | null | undefined,
): string {
  if (raw == null) return APP_DISPLAY_NAME_PREFIX_DEFAULT;
  let p = raw.trim();
  p = p.replace(/\s*CommuHub\s*$/i, "").trim();
  return p.length > 0 ? p : APP_DISPLAY_NAME_PREFIX_DEFAULT;
}

/**
 * ブラウザタイトル・ヘッダー等の製品表示名。常に「{接頭辞} CommuHub」形式。
 */
export async function getAppDisplayName(): Promise<string> {
  const prefix = await getAppDisplayNamePrefix();
  return `${prefix} ${APP_DISPLAY_NAME_SUFFIX}`;
}

/**
 * 管理画面で編集する接頭辞（既定: PonzRyu）。
 */
export async function getAppDisplayNamePrefix(): Promise<string> {
  try {
    const row = await prisma.siteConfig.findUnique({
      where: { id: SITE_CONFIG_ID },
    });
    return normalizeDisplayNamePrefix(row?.displayName);
  } catch {
    return APP_DISPLAY_NAME_PREFIX_DEFAULT;
  }
}
