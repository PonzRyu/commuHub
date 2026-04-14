import type { ExternalNavLinkPublic } from "@/lib/external-nav-links-shared";
import { prisma } from "@/lib/prisma";

export {
  MAX_EXTERNAL_LINK_LABEL_LEN,
  MAX_EXTERNAL_NAV_LINKS,
  type ExternalNavLinkPublic,
  normalizeExternalLinkLabel,
  validateExternalLinkUrl,
} from "@/lib/external-nav-links-shared";

export async function listExternalNavLinksPublic(): Promise<ExternalNavLinkPublic[]> {
  const rows = await prisma.externalNavLink.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, url: true },
  });
  return rows;
}
