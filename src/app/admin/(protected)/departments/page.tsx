import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CreateDepartmentForm } from "./create-department-form";
import { DepartmentsTable } from "./departments-table";

export const metadata: Metadata = {
  title: "部署の管理",
  description: "部署の参照・登録・更新・削除",
};

export default async function DepartmentsAdminPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  const rows = departments.map((d) => ({
    id: d.id,
    name: d.name,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">部署の管理</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          登録済み部署の一覧・編集・削除と、新規登録ができます（FR-SEC-01〜03）。
        </p>
      </div>

      <CreateDepartmentForm />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">登録済みの部署</h2>
        <DepartmentsTable rows={rows} />
      </div>
    </div>
  );
}
