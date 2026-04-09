# CommuHub（コミュハブ）

チーム内予定表でメンバーの週間日程を把握するための Web アプリです。要件は `RDD.md` を参照してください。

## 技術スタック（概要）

- **言語**: TypeScript
- **フロント**: Next.js（App Router）、React
- **UI**: shadcn/ui（Base UI / Radix 系）、Tailwind CSS
- **DB**: PostgreSQL（開発は Docker Compose を想定）
- **ORM / マイグレーション**: Prisma

## ランタイム

`package.json` の `engines` に合わせて Node.js / npm を揃えてください。`.nvmrc` に推奨の Node バージョンを記載しています。

## 開発の始め方

1. 依存関係のインストール

   ```bash
   npm install
   ```

2. 環境変数（`.env.example` を複製して `.env` を用意する）

   PowerShell の例: `Copy-Item .env.example .env`  
   bash の例: `cp .env.example .env`

   **必須**: `ADMIN_PASSWORD`（部署・メンバー管理のログイン用）と `ADMIN_SESSION_SECRET`（Cookie 署名用。十分に長いランダム文字列）を本番相当の値に変更してください（NFR-SEC-01）。

   画面上の製品名は **{接頭辞} CommuHub** の形で、末尾の `CommuHub` は固定です。接頭辞の既定は **PonzRyu**（全体では「PonzRyu CommuHub」）。ログイン後の **管理** 画面（`/admin`）の「アプリ表示名」で接頭辞を変更できます。

3. PostgreSQL の起動（Docker が使える環境）

   ```bash
   docker compose up -d
   ```

4. データベースマイグレーション（初回・スキーマ変更時）

   ```bash
   npm run db:migrate
   ```

5. 開発サーバー

   ```bash
   npm run dev
   ```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。管理者パスワードでログインしたうえで、[http://localhost:3000/admin](http://localhost:3000/admin) の管理メニューから部署・メンバーを操作できます（FR-SEC-* / FR-MEM-* / NFR-SEC-01）。

本番向けのフロント配信・API 配置の手順は、運用方針が固まり次第この README に追記します（要件 NFR-OPS-01）。DB は CI・本番では `npx prisma migrate deploy` でマイグレーションを適用できます（NFR-OPS-02）。

## よく使う npm スクリプト

| スクリプト | 説明 |
|------------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド（Prisma Client 生成を含む） |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma マイグレーション（開発） |
| `npm run db:studio` | Prisma Studio |

## ブラウザ対応

要件どおり **Google Chrome** での動作を主眼に置いています。
