import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] font-sans text-slate-100 selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Background Blobs for Depth */}
      <div className="fixed top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-blue-600/10 blur-[120px] -z-10 pointer-events-none mix-blend-screen animate-pulse"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[35rem] h-[35rem] rounded-full bg-purple-600/10 blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>

      <Sidebar />

      <div className="ml-72 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
