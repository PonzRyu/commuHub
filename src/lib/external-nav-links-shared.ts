export const MAX_EXTERNAL_NAV_LINKS = 5;
export const MAX_EXTERNAL_LINK_LABEL_LEN = 48;

export interface ExternalNavLinkPublic {
  id: string;
  label: string;
  url: string;
}

export function normalizeExternalLinkLabel(raw: string): string {
  return raw.trim();
}

export function validateExternalLinkUrl(
  raw: string,
): { ok: true; href: string } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "URL を入力してください。" };
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return { ok: false, error: "有効な URL を入力してください。" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, error: "http または https の URL だけ登録できます。" };
  }
  return { ok: true, href: u.href };
}
