import type { Metadata } from "next";
import { getAppDisplayName } from "@/lib/app-display-name";
import { listExternalNavLinksPublic } from "@/lib/external-nav-links";
import { PageStack } from "@/components/page-stack";
import { ExternalLinksManager } from "./external-links-manager";

export async function generateMetadata(): Promise<Metadata> {
  const name = await getAppDisplayName();
  return {
    title: "外部リンク",
    description: `${name} のトップバーに表示する外部リンクを管理します`,
  };
}

export default async function AdminExternalLinksPage() {
  const links = await listExternalNavLinksPublic();

  return (
    <PageStack>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">外部リンク</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          サイト名と URL を登録すると、メイン画面のトップバーにメニューとして表示されます。
        </p>
      </div>

      <ExternalLinksManager initialLinks={links} />
    </PageStack>
  );
}
