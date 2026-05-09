import React, { Suspense } from "react";
import AdminDashboardContent from "./AdminDashboardContent";

export default function AdminDashboardPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .reports-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      ` }} />
      
      <Suspense fallback={
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "#64748b" }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Initializing techbes...</div>
        </div>
      }>
        <AdminDashboardContent />
      </Suspense>
    </>
  );
}
