import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar title="Dashboard" />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}