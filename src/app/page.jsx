"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, TopNavbar } from "../components/LayoutModern";
import { DashboardPage } from "../components/ManagerDashboard";
import { CustomersPage, TechniciansPage, JobsPage, RequestsPage, ReviewsPage, ServicesPage, ServiceRequestsPage, PaymentsPage, TrackingPage, NotificationsPage, ReportsPage, SettingsPage, AttendancePage } from "../components/AdminPagesModern";
import { useAuth } from "../contexts/AuthContext";
// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function TechbesDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  const pages = {
    dashboard: <DashboardPage onNavigate={setActivePage} />,
    customers: <CustomersPage />,
    technicians: <TechniciansPage />,
    jobs: <JobsPage />,
    "service-requests": <ServiceRequestsPage />,
    requests: <RequestsPage />,
    reviews: <ReviewsPage />,
    services: <ServicesPage />,
    payments: <PaymentsPage />,
    tracking: <TrackingPage />,
    attendance: <AttendancePage />,
    notifications: <NotificationsPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f1f5f9", color: "#475569", fontFamily: "'Geist', 'DM Sans', system-ui, sans-serif" }}>Loading admin panel...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Geist', 'DM Sans', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        button { transition: all .15s; }
        button:hover { opacity: .88; transform: translateY(-0.5px); }
        tr:hover td { background: rgba(99,102,241,0.02); }
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        @keyframes ping { 75%,100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
      `}</style>
      <div style={{ display: "flex", height: "100vh", background: "#f1f5f9", fontFamily: "'Geist', 'DM Sans', system-ui, sans-serif" }}>
        <Sidebar active={activePage} setActive={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed} user={user} onLogout={logout} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopNavbar page={activePage} notifCount={3} user={user} onLogout={logout} />
          <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            {pages[activePage]}
          </main>
        </div>
      </div>
    </>
  );
}
