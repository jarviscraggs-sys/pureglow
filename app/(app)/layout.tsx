import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Sidebar />
      <main style={{ marginLeft: 240 }} className="min-h-screen p-6">
        {children}
      </main>
    </div>
  );
}
