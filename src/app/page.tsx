import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          CommuHub（コミュハブ）
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Next.js・TypeScript・Tailwind CSS・shadcn/ui・PostgreSQL（Prisma）で構成した初期プロジェクトです。
        </p>
      </div>
      <Button type="button">shadcn/ui ボタン（動作確認）</Button>
    </div>
  );
}
