"use client";
import { useState } from "react";
import { Sidebar, TopNavbar } from "../components/Layout";
import { DashboardPage } from "../components/Dashboard";
import { CustomersPage, TechniciansPage, JobsPage, ServicesPage, PaymentsPage, TrackingPage, NotificationsPage, ReportsPage, SettingsPage } from "../components/Pages";
// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function TechbesDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const pages = {
    dashboard: <DashboardPage />,
    customers: <CustomersPage />,
    technicians: <TechniciansPage />,
    jobs: <JobsPage />,
    services: <ServicesPage />,
    payments: <PaymentsPage />,
    tracking: <TrackingPage />,
    notifications: <NotificationsPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };

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
        <Sidebar active={activePage} setActive={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopNavbar page={activePage} notifCount={3} />
          <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            {pages[activePage]}
          </main>
        </div>
      </div>
    </>
  );
}