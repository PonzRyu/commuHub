import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CreateMemberForm } from "./create-member-form";
import { MembersTable } from "./members-table";

export const metadata: Metadata = {
  title: "メンバーの管理",
  description: "メンバーの参照・登録・更新・削除と ICS リンクの管理",
};
export default async function MembersAdminPage() {
  const [departments, members] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.member.findMany({
      orderBy: [
        { department: { name: "asc" } },
        { displayOrder: { sort: "asc", nulls: "last" } },
        { name: "asc" },
      ],
      include: { department: true },
    }),
  ]);

  const deptOptions = departments.map((d) => ({ id: d.id, name: d.name }));

  const rows = members.map((m) => ({
    id: m.id,
    name: m.name,
    departmentId: m.departmentId,
    departmentName: m.department.name,
    displayOrder: m.displayOrder ?? null,
    hasIcs: Boolean(m.icsUrl),
    icsUrl: m.icsUrl,
    icsRegisteredAt: m.icsRegisteredAt?.toISOString() ?? null,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          メンバーの管理
        </h1>
      </div>

      <CreateMemberForm departments={deptOptions} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">登録済みのメンバー</h2>
        <MembersTable rows={rows} departments={deptOptions} />
      </div>
    </div>
  );
}
