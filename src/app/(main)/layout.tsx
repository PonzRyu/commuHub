import { SiteHeader } from "@/components/site-header";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
