import React from "react";
import { GridIcon, UsersIcon, HardHatIcon, BriefcaseIcon, WrenchIcon, CreditCardIcon, MapPinIcon, BellIcon, ChartIcon, SettingsIcon, SearchIcon } from "./Icons";
import { Avatar } from "./UI";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: <GridIcon /> },
  { id: "members", label: "Employee Management", icon: <HardHatIcon /> },
  { id: "technicians", label: "Customer Management", icon: <UsersIcon /> },
  { id: "leads", label: "Lead Management", icon: <BriefcaseIcon /> },
  { id: "quotes", label: "Quote Requests", icon: <BriefcaseIcon /> },
  { id: "jobs", label: "Projects", icon: <BriefcaseIcon /> },
  { id: "service-requests", label: "Service Requests", icon: <BellIcon />, badge: null },
  { id: "amc", label: "AMC Management", icon: <BriefcaseIcon /> },
  // ─── Phase 2: Dispatch ────────────────────────────────────────────────────
  { id: "dispatch-monitor", label: "Dispatch Monitor", icon: <MapPinIcon /> },
  { id: "kyc-approvals", label: "Technician KYC Approvals", icon: <UsersIcon /> },
  { id: "cancellations", label: "Cancellations", icon: <BellIcon /> },
  { id: "tech-performance", label: "Technician Performance", icon: <ChartIcon /> },
  { id: "penalties", label: "Penalties", icon: <CreditCardIcon /> },
  // ─── Operations ───────────────────────────────────────────────────────────
  { id: "requests", label: "Completion Requests", icon: <BellIcon /> },
  { id: "worksheets", label: "Service Worksheets", icon: <BriefcaseIcon /> },
  { id: "reviews", label: "Technician Reviews", icon: <ChartIcon /> },
  { id: "services", label: "Services", icon: <WrenchIcon /> },
  { id: "catalog", label: "Catalog Management", icon: <WrenchIcon /> },
  { id: "cctv-pricing", label: "CCTV Pricing", icon: <CreditCardIcon /> },
  { id: "addresses", label: "Address Management", icon: <MapPinIcon /> },
  { id: "payments", label: "Payments", icon: <CreditCardIcon /> },
  { id: "tracking", label: "Live Tracking", icon: <MapPinIcon /> },
  { id: "attendance", label: "Attendance", icon: <MapPinIcon /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon /> },
  { id: "reports", label: "Reports & Analytics", icon: <ChartIcon /> },
  { id: "admissions", label: "Admission Management", icon: <UsersIcon />, isHeader: true },
  { id: "admissions", label: "→ Applications", icon: <UsersIcon />, isSub: true },
  { id: "student-profiles", label: "→ Students", icon: <UsersIcon />, isSub: true },
  { id: "admission-payments", label: "→ Payments", icon: <CreditCardIcon />, isSub: true },
  { id: "course-assignment", label: "→ Assignments", icon: <BriefcaseIcon />, isSub: true },
  { id: "admission-analytics", label: "→ Analytics", icon: <ChartIcon />, isSub: true },
  { id: "visitor-analytics-header", label: "Visitor Analytics", icon: <ChartIcon />, isHeader: true },
  { id: "analytics-main", label: "→ Main Website", icon: <ChartIcon />, isSub: true },
  { id: "analytics-members", label: "→ Members Portal", icon: <ChartIcon />, isSub: true },
  { id: "analytics-skills", label: "→ Skills Portal", icon: <ChartIcon />, isSub: true },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

export function Sidebar({ active, setActive, collapsed, setCollapsed, user, onLogout, mobileOpen, setMobileOpen }) {
  const groups = [
    {
      id: "dashboard",
      title: "Dashboard",
      items: [
        { id: "dashboard", label: "Dashboard", icon: <GridIcon /> }
      ]
    },
    {
      id: "customers",
      title: "Customer Management",
      items: [
        { id: "technicians", label: "Customers", icon: <UsersIcon /> },
        { id: "leads", label: "Leads", icon: <BriefcaseIcon /> },
        { id: "quotes", label: "Quote Requests", icon: <BriefcaseIcon /> },
        { id: "service-requests", label: "Bookings", icon: <BellIcon /> },
        { id: "amc", label: "AMC Management", icon: <BriefcaseIcon /> },
        { id: "cancellations", label: "Cancellations", icon: <BellIcon /> }
      ]
    },
    {
      id: "services",
      title: "Services",
      items: [
        { id: "services", label: "Services", icon: <WrenchIcon /> },
        { id: "catalog", label: "Catalog", icon: <WrenchIcon /> },
        { id: "cctv-pricing", label: "CCTV Pricing", icon: <CreditCardIcon /> }
      ]
    },
    {
      id: "dispatch",
      title: "Dispatch",
      items: [
        { id: "dispatch-monitor", label: "Dispatch Monitor", icon: <MapPinIcon /> },
        { id: "tracking", label: "Live Tracking", icon: <MapPinIcon /> },
        { id: "attendance", label: "Attendance", icon: <MapPinIcon /> },
        { id: "tech-performance", label: "Technician Performance", icon: <ChartIcon /> },
        { id: "requests", label: "Completion Requests", icon: <BellIcon /> },
        { id: "worksheets", label: "Service Worksheets", icon: <BriefcaseIcon /> }
      ]
    },
    {
      id: "technicians",
      title: "Technician Management",
      items: [
        { id: "members", label: "Employees", icon: <HardHatIcon /> },
        { id: "kyc-approvals", label: "KYC", icon: <UsersIcon /> },
        { id: "reviews", label: "Reviews", icon: <ChartIcon /> },
        { id: "penalties", label: "Penalties", icon: <CreditCardIcon /> }
      ]
    },
    {
      id: "academic",
      title: "Academic Admissions",
      items: [
        { id: "admissions", label: "Applications", icon: <UsersIcon /> },
        { id: "student-profiles", label: "Students", icon: <UsersIcon /> },
        { id: "admission-payments", label: "Payments", icon: <CreditCardIcon /> },
        { id: "course-assignment", label: "Assignments", icon: <BriefcaseIcon /> },
        { id: "admission-analytics", label: "Analytics", icon: <ChartIcon /> }
      ]
    },
    {
      id: "masterclasses",
      title: "Masterclasses",
      items: [
        { id: "cctv-masterclass", label: "CCTV Masterclass", icon: <BriefcaseIcon /> }
      ]
    },
    {
      id: "visitor-analytics",
      title: "Visitor Analytics",
      items: [
        { id: "analytics-main", label: "Main Website", icon: <ChartIcon /> },
        { id: "analytics-members", label: "Members Portal", icon: <ChartIcon /> },
        { id: "analytics-skills", label: "Skills Portal", icon: <ChartIcon /> }
      ]
    },
    {
      id: "finance",
      title: "Finance",
      items: [
        { id: "payments", label: "Payments", icon: <CreditCardIcon /> },
        { id: "reports", label: "Reports", icon: <ChartIcon /> }
      ]
    },
    {
      id: "settings",
      title: "Settings",
      items: [
        { id: "addresses", label: "Address Management", icon: <MapPinIcon /> },
        { id: "notifications", label: "Notifications", icon: <BellIcon /> },
        { id: "settings", label: "Settings", icon: <SettingsIcon /> }
      ]
    }
  ];

  const [expandedGroups, setExpandedGroups] = React.useState({});

  // Auto-expand group containing the active page
  React.useEffect(() => {
    groups.forEach((g) => {
      if (g.items.some((i) => i.id === active)) {
        setExpandedGroups((prev) => ({ ...prev, [g.id]: true }));
      }
    });
  }, [active]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSelect = (id) => {
    setActive(id);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const flatItems = React.useMemo(() => {
    const list = [];
    groups.forEach((g) => {
      g.items.forEach((i) => {
        if (!list.some((existing) => existing.id === i.id)) {
          list.push(i);
        }
      });
    });
    return list;
  }, []);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:relative top-0 bottom-0 left-0 z-50 flex flex-col
          bg-[#0c0e16] transition-all duration-200 ease-out
          ${mobileOpen ? "translate-x-0 w-[260px] shadow-2xl" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "md:w-16" : "md:w-60"}
        `}
        style={{ boxShadow: "1px 0 0 rgba(255,255,255,0.06)" }}
      >
        <div style={{ padding: collapsed ? "20px 14px" : "20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 800, flexShrink: 0, boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>TB</div>
            {(!collapsed || mobileOpen) && (
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-.2px" }}>Techbes</div>
                <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: ".8px", textTransform: "uppercase" }}>Admin Panel</div>
              </div>
            )}
          </div>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen && setMobileOpen(false)}
              aria-label="Close menu"
              className="md:hidden text-slate-400 hover:text-white p-1.5 text-lg rounded-lg"
            >
              ✕
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
          {collapsed && !mobileOpen ? (
            flatItems.map((item, idx) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id + idx}
                  onClick={() => handleSelect(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    padding: "12px",
                    marginBottom: 4,
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    color: isActive ? "#fff" : "#94a3b8",
                    background: isActive ? "linear-gradient(90deg,rgba(99,102,241,0.2),rgba(99,102,241,0.05))" : "transparent",
                    transition: "all .15s"
                  }}
                >
                  <span style={{ color: isActive ? "#818cf8" : "#94a3b8" }}>{item.icon}</span>
                </button>
              );
            })
          ) : (
            groups.map((group) => {
              const isExpanded = expandedGroups[group.id] || false;
              const hasActiveItem = group.items.some((i) => i.id === active);
              return (
                <div key={group.id} style={{ marginBottom: 8 }}>
                  {/* Group Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: hasActiveItem ? "#818cf8" : "#cbd5e1",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase"
                    }}
                  >
                    <span style={{ flex: 1 }}>{group.title}</span>
                    <span style={{
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.15s",
                      fontSize: 9,
                      color: "#94a3b8"
                    }}>
                      &gt;
                    </span>
                  </button>

                  {/* Group Items */}
                  {isExpanded && (
                    <div style={{ marginTop: 2, paddingLeft: 4 }}>
                      {group.items.map((item, idx) => {
                        const isActive = active === item.id;
                        return (
                          <button
                            key={item.id + idx}
                            onClick={() => handleSelect(item.id)}
                            aria-current={isActive ? "page" : undefined}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              padding: "8px 12px",
                              marginBottom: 2,
                              borderRadius: 8,
                              border: "none",
                              cursor: "pointer",
                              color: isActive ? "#fff" : "#cbd5e1",
                              background: isActive ? "linear-gradient(90deg,rgba(99,102,241,0.15),rgba(99,102,241,0.02))" : "transparent",
                              fontSize: 13,
                              fontWeight: isActive ? 600 : 400,
                              transition: "all .15s",
                              position: "relative",
                              textAlign: "left"
                            }}
                          >
                            {isActive && (
                              <span style={{
                                position: "absolute",
                                left: 0,
                                top: "20%",
                                height: "60%",
                                width: 3,
                                background: "#6366f1",
                                borderRadius: "0 3px 3px 0"
                              }} />
                            )}
                            <span style={{ color: isActive ? "#818cf8" : "#94a3b8", flexShrink: 0 }}>
                              {item.icon}
                            </span>
                            <span style={{ flex: 1 }}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 8px" }}>
          {!collapsed || mobileOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 8, background: "rgba(255,255,255,.03)", borderRadius: 10 }}>
              <Avatar initials={(user?.name || "Admin").slice(0, 2).toUpperCase()} size={30} gradient="linear-gradient(135deg,#6366f1,#06b6d4)" />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ color: "#f8fafc", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Admin User"}</div>
                <div style={{ color: "#94a3b8", fontSize: 10.5, textTransform: "capitalize" }}>{user?.role || "Super Admin"}</div>
              </div>
            </div>
          ) : null}
          {!collapsed || mobileOpen ? (
            <button
              onClick={onLogout}
              aria-label="Log out"
              style={{ width: "100%", padding: "8px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,.04)", color: "#f1f5f9", cursor: "pointer", fontSize: 12, marginBottom: 8, fontWeight: 600 }}
            >
              Sign Out
            </button>
          ) : null}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex"
            style={{ width: "100%", padding: "8px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,.03)", color: "#94a3b8", cursor: "pointer", fontSize: 12, alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {collapsed ? ">" : <><span>{"<"}</span><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}

export function TopNavbar({ page, notifCount, user, onLogout, onNotifClick, onMenuClick }) {
  const titles = {
    dashboard: "Dashboard",
    members: "Employee Management",
    technicians: "Customer Management",
    leads: "Lead Management",
    jobs: "Projects",
    "service-requests": "Service Requests",
    "dispatch-monitor": "Dispatch Monitor",
    cancellations: "Cancellations",
    "tech-performance": "Technician Performance",
    penalties: "Penalties",
    requests: "Completion Requests",
    reviews: "Technician Reviews",
    services: "Services",
    addresses: "Address Management",
    payments: "Payments",
    tracking: "Live Tracking",
    attendance: "Daily Attendance",
    notifications: "Notifications",
    reports: "Reports & Analytics",
    admissions: "Admission Applications",
    "student-profiles": "Student Profiles",
    "admission-payments": "Admission Payments",
    "course-assignment": "Course Assignments",
    "admission-analytics": "Admission Analytics",
    "analytics-main": "Main Website Analytics",
    "analytics-members": "Members Portal Analytics",
    "analytics-skills": "Skills Portal Analytics",
    "cctv-masterclass": "CCTV Masterclass Registrations",
    settings: "Settings",
  };

  return (
    <header style={{ height: 60, background: "#fff", borderBottom: "1px solid rgba(226,232,240,0.8)", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0, boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
      {/* Mobile Hamburger Toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open mobile navigation"
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <span className="text-lg font-bold">☰</span>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {titles[page] || page}
        </h2>
      </div>

      <div className="hidden sm:flex" style={{ alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 13px", width: 220 }}>
        <span style={{ color: "#64748b" }}><SearchIcon /></span>
        <input placeholder="Search..." aria-label="Search admin records" style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#0f172a", width: "100%" }} />
      </div>

      <button
        onClick={onNotifClick}
        aria-label="View notifications"
        style={{ position: "relative", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, width: 38, height: 38, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        <BellIcon />
        {notifCount > 0 ? <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, background: "#f43f5e", borderRadius: "50%", border: "2px solid #fff" }} /> : null}
      </button>

      <button
        onClick={onLogout}
        aria-label="Account menu and sign out"
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 8px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", flexShrink: 0 }}
      >
        <Avatar initials={(user?.name || "Admin").slice(0, 2).toUpperCase()} size={28} gradient="linear-gradient(135deg,#6366f1,#06b6d4)" />
        <div className="hidden sm:block text-left">
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{user?.name || "Admin"}</div>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "capitalize" }}>{user?.role || "Super Admin"}</div>
        </div>
      </button>
    </header>
  );
}
