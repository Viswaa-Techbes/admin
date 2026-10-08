"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Sidebar, TopNavbar } from "../../components/LayoutModern";
import { ToastProvider } from "../../components/UI";
import { DashboardPage } from "../../components/ManagerDashboard";
import { 
  CustomersPage, 
  EmployeeManagementPage,
  CustomerManagementPage,
  ProjectsPage, 
  ServiceRequestsPage,
  RequestsPage,
  ReviewsPage,
  ServicesPage,
  AddressesPage,
  PaymentsPage,
  TrackingPage,
  AttendancePage,
  NotificationsPage,
  SettingsPage,
  AdmissionsPage,
  StudentProfilesPage,
  AdmissionPaymentsPage,
  CourseAssignmentPage,
  AdmissionAnalyticsPage,
  CategoryManagementPage
} from "../../components/AdminPagesModern";
import { CctvPricingManagementPage } from "../../components/CctvPricingManagementPage";
import { io } from "socket.io-client";
import { DispatchMonitorPage, CancellationsPage, TechPerformancePage, PenaltiesPage } from "../../components/DispatchAdminPages";
import { AnalyticsPage } from "../../components/AnalyticsPage";
import DomainAnalyticsPage from "../../components/analytics/DomainAnalyticsPage";
import { WorksheetsPage } from "../../components/WorksheetsPage";
import { KycApprovalsPage } from "../../components/KycApprovalsPage";
import { AmcManagementPage } from "../../components/AmcManagementPage";
import { CctvMasterclassPage } from "../../components/CctvMasterclassPage";
import { QuoteRequestsPage } from "../../components/QuoteRequestsPage";
import { ApartmentManagementPage } from "../../components/ApartmentManagementPage";
import { wakeBackend, apiFetch } from "../../lib/apiClient";

export default function AdminDashboardContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [user, setUser] = useState({ name: "Admin", role: "admin" });
  const [notifCount, setNotifCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    
    // Connect to Socket.io backend for real-time dashboard updates
    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin || "", {
      path: "/socket.io",
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => {
      console.log("[Admin Socket] Connected successfully");
      socket.emit("join_admin");
    });

    const handleUpdate = (data) => {
      console.log("[Admin Socket] Received real-time update event:", data);
      setRefreshKey(k => k + 1);
    };

    socket.on("newBooking", handleUpdate);
    socket.on("jobStatusUpdated", handleUpdate);
    socket.on("technicianStatusUpdate", handleUpdate);
    socket.on("technicianLocationUpdate", handleUpdate);
    socket.on("bookingAssigned", handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [mounted]);

  useEffect(() => {
    let wakeTimeout = setTimeout(() => {
      setIsWakingUp(true);
    }, 4000);

    async function checkAuth() {
      try {
        await wakeBackend();
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        clearTimeout(wakeTimeout);
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const payload = await res.json();
        if (payload.user) {
          setUser(payload.user);
        }
        setMounted(true);
      } catch (err) {
        clearTimeout(wakeTimeout);
        router.replace("/login");
      }
    }
    checkAuth();
    return () => clearTimeout(wakeTimeout);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const syncPageFromUrl = () => {
      const path = pathname || '';
      
      if (path.includes('/admin/admissions/')) {
        const parts = path.split('/').filter(Boolean);
        setActivePage('admissions');
        setSelectedId(parts[parts.length - 1]);
      } 
      else if (path.includes('/admin/cctv-masterclass')) setActivePage('cctv-masterclass');
      else if (path.includes('/admin/quotes')) setActivePage('quotes');
      else if (path.includes('/admin/customers')) setActivePage('technicians');
      else if (path.includes('/admin/leads')) setActivePage('leads');
      else if (path.includes('/admin/bookings') || path.includes('/admin/service-requests')) setActivePage('service-requests');
      else if (path.includes('/admin/apartments')) setActivePage('apartments');
      else if (path.includes('/admin/projects') || path.includes('/admin/jobs')) setActivePage('jobs');
      else if (path.includes('/admin/amc')) setActivePage('amc');
      else if (path.includes('/admin/cancellations')) setActivePage('cancellations');
      else if (path.includes('/admin/services')) setActivePage('services');
      else if (path.includes('/admin/catalog')) setActivePage('catalog');
      else if (path.includes('/admin/cctv-pricing')) setActivePage('cctv-pricing');
      else if (path.includes('/admin/dispatch-monitor')) setActivePage('dispatch-monitor');
      else if (path.includes('/admin/tracking')) setActivePage('tracking');
      else if (path.includes('/admin/attendance')) setActivePage('attendance');
      else if (path.includes('/admin/tech-performance')) setActivePage('tech-performance');
      else if (path.includes('/admin/requests')) setActivePage('requests');
      else if (path.includes('/admin/worksheets')) setActivePage('worksheets');
      else if (path.includes('/admin/employees') || path.includes('/admin/members')) setActivePage('members');
      else if (path.includes('/admin/kyc-approvals')) setActivePage('kyc-approvals');
      else if (path.includes('/admin/reviews')) setActivePage('reviews');
      else if (path.includes('/admin/penalties')) setActivePage('penalties');
      else if (path.includes('/admin/applications') || path.includes('/admin/admissions')) setActivePage('admissions');
      else if (path.includes('/admin/students') || path.includes('/admin/student-profiles')) setActivePage('student-profiles');
      else if (path.includes('/admin/admission-payments')) setActivePage('admission-payments');
      else if (path.includes('/admin/assignments') || path.includes('/admin/course-assignment')) setActivePage('course-assignment');
      else if (path.includes('/admin/admission-analytics')) setActivePage('admission-analytics');
      else if (path.includes('/admin/analytics-main')) setActivePage('analytics-main');
      else if (path.includes('/admin/analytics-members')) setActivePage('analytics-members');
      else if (path.includes('/admin/analytics-skills')) setActivePage('analytics-skills');
      else if (path.includes('/admin/analytics') || path.includes('/admin/reports')) setActivePage('reports');
      else if (path.includes('/admin/payments')) setActivePage('payments');
      else if (path.includes('/admin/addresses')) setActivePage('addresses');
      else if (path.includes('/admin/notifications')) setActivePage('notifications');
      else if (path.includes('/admin/settings')) setActivePage('settings');
      else if (path === '/admin' || path === '/admin/') setActivePage('dashboard');
    };

    syncPageFromUrl();
  }, [mounted, pathname]);

  useEffect(() => {
    if (!mounted) return;

    const fetchNotificationsCount = async () => {
      try {
        const { payload } = await apiFetch("/api/v2/notifications");
        const list = payload.data ?? payload ?? [];
        const unread = list.filter(n => !n.isRead).length;
        setNotifCount(unread);
      } catch (err) {
        console.error("Failed to fetch notification count:", err.message);
      }
    };

    fetchNotificationsCount();
    const interval = setInterval(fetchNotificationsCount, 8000); // refresh every 8s
    return () => clearInterval(interval);
  }, [mounted, activePage]);

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

  const logout = async () => {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  };

  const PAGE_TO_ROUTE = {
    dashboard: '/admin',
    technicians: '/admin/customers',
    leads: '/admin/leads',
    quotes: '/admin/quotes',
    apartments: '/admin/apartments',
    'service-requests': '/admin/bookings',
    jobs: '/admin/projects',
    amc: '/admin/amc',
    cancellations: '/admin/cancellations',
    services: '/admin/services',
    catalog: '/admin/catalog',
    'cctv-pricing': '/admin/cctv-pricing',
    'dispatch-monitor': '/admin/dispatch-monitor',
    tracking: '/admin/tracking',
    attendance: '/admin/attendance',
    'tech-performance': '/admin/tech-performance',
    requests: '/admin/requests',
    worksheets: '/admin/worksheets',
    members: '/admin/employees',
    'kyc-approvals': '/admin/kyc-approvals',
    reviews: '/admin/reviews',
    penalties: '/admin/penalties',
    admissions: '/admin/applications',
    'student-profiles': '/admin/students',
    'admission-payments': '/admin/admission-payments',
    'course-assignment': '/admin/assignments',
    'admission-analytics': '/admin/admission-analytics',
    'cctv-masterclass': '/admin/cctv-masterclass',
    'analytics-main': '/admin/analytics-main',
    'analytics-members': '/admin/analytics-members',
    'analytics-skills': '/admin/analytics-skills',
    payments: '/admin/payments',
    reports: '/admin/reports',
    addresses: '/admin/addresses',
    notifications: '/admin/notifications',
    settings: '/admin/settings',
  };

  const navigate = (page) => {
    setActivePage(page);
    const newPath = PAGE_TO_ROUTE[page] || '/admin';
    router.push(newPath);
  };

  const pages = {
    dashboard: <DashboardPage onNavigate={navigate} />,
    members: <EmployeeManagementPage />,
    technicians: <CustomerManagementPage />,
    leads: <CustomersPage />,
    jobs: <ProjectsPage />,
    "service-requests": <ServiceRequestsPage />,
    "dispatch-monitor": <DispatchMonitorPage />,
    cancellations: <CancellationsPage />,
    "tech-performance": <TechPerformancePage />,
    penalties: <PenaltiesPage />,
    requests: <RequestsPage />,
    reviews: <ReviewsPage />,
    services: <ServicesPage />,
    addresses: <AddressesPage />,
    payments: <PaymentsPage />,
    admissions: <AdmissionsPage selectedId={selectedId} onSelect={(id) => { setSelectedId(id); try { window.history.pushState({}, '', `/admin/admissions/${id}`); } catch(e){} }} />,
    "student-profiles": <StudentProfilesPage onView={(id) => { setSelectedId(id); navigate('admissions'); }} />,
    "admission-payments": <AdmissionPaymentsPage onView={(id) => { setSelectedId(id); navigate('admissions'); }} />,
    "course-assignment": <CourseAssignmentPage />,
    "admission-analytics": <AdmissionAnalyticsPage />,
    tracking: <TrackingPage />,
    attendance: <AttendancePage />,
    notifications: <NotificationsPage />,
    reports: <AnalyticsPage />,
    worksheets: <WorksheetsPage />,
    "analytics-main": <DomainAnalyticsPage domain="techbes.co.in" title="Main Website Analytics" />,
    "analytics-members": <DomainAnalyticsPage domain="members.techbes.co.in" title="Members Portal Analytics" />,
    "analytics-skills": <DomainAnalyticsPage domain="skills.techbes.co.in" title="Skills Portal Analytics" />,
    "kyc-approvals": <KycApprovalsPage />,
    settings: <SettingsPage />,
    catalog: <CategoryManagementPage />,
    "cctv-pricing": <CctvPricingManagementPage />,
    amc: <AmcManagementPage />,
    "cctv-masterclass": <CctvMasterclassPage />,
    quotes: <QuoteRequestsPage />,
    apartments: <ApartmentManagementPage />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f1f5f9", fontFamily: "'Geist', 'DM Sans', system-ui, sans-serif" }}>
      <Sidebar 
        active={activePage} 
        setActive={navigate}
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        user={user} 
        onLogout={logout} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ToastProvider>
          <TopNavbar 
            page={activePage} 
            notifCount={notifCount} 
            user={user} 
            onLogout={logout} 
            onNotifClick={() => navigate("notifications")}
            onMenuClick={() => setMobileOpen(true)}
          />
          
          <main key={refreshKey} style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
              {pages[activePage] || pages.dashboard}
            </div>
          </main>
        </ToastProvider>
      </div>
    </div>
  );
}
