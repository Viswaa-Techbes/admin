"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, TopNavbar } from "../components/LayoutModern";
import { ToastProvider } from "../components/UI";
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
import {
  AdmissionsPage,
  StudentProfilesPage,
  AdmissionPaymentsPage,
  CourseAssignmentPage,
  AdmissionAnalyticsPage
} from "../components/AdminPagesModern";
import { AnalyticsPage } from "../components/AnalyticsPage";
import DomainAnalyticsPage from "../components/analytics/DomainAnalyticsPage";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [user, setUser] = useState({ name: "Admin", role: "admin" });

  useEffect(() => {
    let wakeTimeout = setTimeout(() => {
      setIsWakingUp(true);
    }, 4000);

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        clearTimeout(wakeTimeout);
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
        clearTimeout(wakeTimeout);
        window.location.href = "/login";
      }
    }
    checkAuth();
    return () => clearTimeout(wakeTimeout);
  }, []);

  useEffect(() => {
    // initial sync with pathname (supports /admin/admissions and /admin/admissions/:id)
    try {
      const path = window.location.pathname || '';
      if (path.startsWith('/admin/admissions')) {
        const parts = path.split('/').filter(Boolean);
        setActivePage('admissions');
        setSelectedId(parts[2] || null);
      } else if (path === '/admin/payments') setActivePage('payments');
      else if (path === '/admin/analytics' || path === '/admin/reports') setActivePage('reports');
    } catch (e) {}

    const onPop = () => {
      const path = window.location.pathname || '';
      if (path.startsWith('/admin/admissions')) {
        const parts = path.split('/').filter(Boolean);
        setActivePage('admissions');
        setSelectedId(parts[2] || null);
      } else if (path === '/admin/payments') setActivePage('payments');
      else if (path === '/admin/analytics' || path === '/admin/reports') setActivePage('reports');
      else setActivePage('dashboard');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (!mounted) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "#64748b" }}>
      <div style={{ fontSize: 16, fontWeight: 500 }}>Loading techbes dashboard...</div>
      {isWakingUp && (
        <div style={{ marginTop: 16, padding: "12px 20px", background: "#e0f2fe", color: "#0369a1", borderRadius: 8, fontSize: 13, textAlign: "center", maxWidth: 400, animation: "fadeIn 0.5s ease" }}>
          <strong>Note:</strong> The backend server is hosted on a free Render instance and is currently waking up from sleep. This usually takes about 60-90 seconds. Please wait...
        </div>
      )}
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
    admissions: <AdmissionsPage selectedId={selectedId} onSelect={(id) => { setSelectedId(id); try { window.history.pushState({}, '', `/admin/admissions/${id}`); } catch(e){} }} />,
    "student-profiles": <StudentProfilesPage onView={(id) => { setActivePage('admissions'); setSelectedId(id); }} />,
    "admission-payments": <AdmissionPaymentsPage onView={(id) => { setActivePage('admissions'); setSelectedId(id); }} />,
    "course-assignment": <CourseAssignmentPage />,
    "admission-analytics": <AdmissionAnalyticsPage />,
    tracking: <TrackingPage />,
    attendance: <AttendancePage />,
    notifications: <NotificationsPage />,
    reports: <AnalyticsPage />,
    "analytics-main": <DomainAnalyticsPage domain="techbes.co.in" title="Main Website Analytics" />,
    "analytics-members": <DomainAnalyticsPage domain="members.techbes.co.in" title="Members Portal Analytics" />,
    "analytics-skills": <DomainAnalyticsPage domain="skills.techbes.co.in" title="Skills Portal Analytics" />,
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
        setActive={(page) => {
          setActivePage(page);
          const mapping = { admissions: '/admin/admissions', payments: '/admin/payments', reports: '/admin/analytics' };
          const newPath = mapping[page] || '/admin';
          try { window.history.pushState({}, '', newPath); } catch (e) {}
        }}
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        user={user} 
        onLogout={logout} 
      />
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ToastProvider>
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
        </ToastProvider>
      </div>
    </div>
  );
}
