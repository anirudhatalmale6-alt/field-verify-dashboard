import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[240px] print:ml-0 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
