"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, TopNavbar } from "../components/LayoutModern";
import { DashboardPage } from "../components/ManagerDashboard";
import { 
  CustomersPage, 
  TechniciansPage, 
  ProjectsPage, 
  ServiceRequestsPage,
  RequestsPage,
  ReviewsPage,
  ServicesPage,
  PaymentsPage,
  TrackingPage,
  AttendancePage,
  NotificationsPage,
  SettingsPage
} from "../components/AdminPagesModern";
import { AnalyticsPage } from "../components/AnalyticsPage";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState({ name: "Admin", role: "admin" });

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const payload = await res.json();
        if (payload.user) {
          setUser(payload.user);
        }
        setMounted(true);
      } catch (err) {
        window.location.href = "/login";
      }
    }
    checkAuth();
  }, []);

  if (!mounted) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "#64748b" }}>
      Loading techbes dashboard...
    </div>
  );

  const logout = () => {
    // Basic logout logic
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/login";
  };

  const pages = {
    dashboard: <DashboardPage onNavigate={setActivePage} />,
    members: <CustomersPage />,
    technicians: <TechniciansPage />,
    jobs: <ProjectsPage />,
    "service-requests": <ServiceRequestsPage />,
    requests: <RequestsPage />,
    reviews: <ReviewsPage />,
    services: <ServicesPage />,
    payments: <PaymentsPage />,
    tracking: <TrackingPage />,
    attendance: <AttendancePage />,
    notifications: <NotificationsPage />,
    reports: <AnalyticsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f1f5f9", fontFamily: "'Geist', 'DM Sans', system-ui, sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .reports-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <Sidebar 
        active={activePage} 
        setActive={setActivePage} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        user={user} 
        onLogout={logout} 
      />
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopNavbar 
          page={activePage} 
          notifCount={0} 
          user={user} 
          onLogout={logout} 
        />
        
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            {pages[activePage] || pages.dashboard}
          </div>
        </main>
      </div>
    </div>
  );
}
