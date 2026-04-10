import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CreateDepartmentForm } from "./create-department-form";
import { DepartmentsTable } from "./departments-table";
import { PageStack } from "@/components/page-stack";

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
    <PageStack>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">部署の管理</h1>
      </div>

      <CreateDepartmentForm />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">登録済みの部署</h2>
        <DepartmentsTable rows={rows} />
      </div>
    </PageStack>
  );
}
