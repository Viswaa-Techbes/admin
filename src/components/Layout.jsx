import React from "react";
import { GridIcon, UsersIcon, HardHatIcon, BriefcaseIcon, WrenchIcon, CreditCardIcon, MapPinIcon, BellIcon, ChartIcon, SettingsIcon, SearchIcon } from "./Icons";
import { Avatar } from "./UI";
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: <GridIcon /> },
  { id: "customers", label: "Customers", icon: <UsersIcon /> },
  { id: "technicians", label: "Technicians", icon: <HardHatIcon /> },
  { id: "jobs", label: "Service Requests", icon: <BriefcaseIcon /> },
  { id: "requests", label: "Completion Requests", icon: <BellIcon /> },
  { id: "reviews", label: "Technician Reviews", icon: <ChartIcon /> },
  { id: "services", label: "Services", icon: <WrenchIcon /> },
  { id: "payments", label: "Payments", icon: <CreditCardIcon /> },
  { id: "tracking", label: "Live Tracking", icon: <MapPinIcon /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon />, badge: 3 },
  { id: "reports", label: "Reports & Analytics", icon: <ChartIcon /> },
  { id: "admissions", label: "Admission Management", icon: <UsersIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];
// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

export function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      background: "#0c0e16",
      display: "flex", flexDirection: "column",
      transition: "width .22s cubic-bezier(.4,0,.2,1)",
      flexShrink: 0, position: "relative", zIndex: 50,
      boxShadow: "1px 0 0 rgba(255,255,255,0.04)"
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "20px 14px" : "20px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 10,
        overflow: "hidden"
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0, boxShadow: "0 0 16px rgba(99,102,241,0.4)"
        }}>⚡</div>
        {!collapsed && (
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-.2px" }}>Techbes</div>
            <div style={{ color: "#475569", fontSize: 10, letterSpacing: ".8px", textTransform: "uppercase" }}>Service CRM</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
        {!collapsed && <div style={{ fontSize: 10, fontWeight: 600, color: "#334155", letterSpacing: "1px", textTransform: "uppercase", padding: "4px 12px 8px" }}>Main Menu</div>}
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} title={collapsed ? item.label : ""} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: collapsed ? "10px 18px" : "9px 12px",
              marginBottom: 1, borderRadius: 10, border: "none",
              cursor: "pointer", color: isActive ? "#fff" : "#64748b",
              background: isActive ? "linear-gradient(90deg,rgba(99,102,241,0.2),rgba(99,102,241,0.05))" : "transparent",
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              transition: "all .15s", justifyContent: collapsed ? "center" : "flex-start",
              position: "relative", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden"
            }}>
              {isActive && <span style={{ position: "absolute", left: 0, top: "18%", height: "64%", width: 3, background: "#6366f1", borderRadius: "0 3px 3px 0" }} />}
              <span style={{ color: isActive ? "#818cf8" : "#475569", flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && item.badge && (
                <span style={{ background: "#f43f5e", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 8px" }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 8, background: "rgba(255,255,255,.03)", borderRadius: 10 }}>
            <Avatar initials="AD" size={30} gradient="linear-gradient(135deg,#6366f1,#06b6d4)" />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ color: "#e2e8f0", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin User</div>
              <div style={{ color: "#475569", fontSize: 10.5 }}>Super Admin</div>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          width: "100%", padding: "8px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,.03)", color: "#475569", cursor: "pointer", fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}>
          {collapsed ? "→" : <>← <span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

// ─── TOP NAVBAR ───────────────────────────────────────────────────────────────

export function TopNavbar({ page, notifCount }) {
  const titles = {
    dashboard: "Dashboard", customers: "Customers",
    technicians: "Technicians", jobs: "Service Requests",
    requests: "Completion Requests", reviews: "Technician Reviews",
    services: "Services", payments: "Payments",
    tracking: "Live Tracking", notifications: "Notifications",
    reports: "Reports & Analytics", admissions: "Admission Management",
    settings: "Settings"
  };
  return (
    <header style={{
      height: 60, background: "#fff",
      borderBottom: "1px solid rgba(226,232,240,0.8)",
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: 16, flexShrink: 0,
      boxShadow: "0 1px 0 rgba(0,0,0,0.04)"
    }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-.3px" }}>{titles[page]}</h2>
      </div>
      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "7px 13px", width: 240
      }}>
        <span style={{ color: "#94a3b8" }}><SearchIcon /></span>
        <input placeholder="Search anything…" style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#475569", width: "100%" }} />
        <span style={{ fontSize: 10, color: "#cbd5e1", background: "#f1f5f9", padding: "2px 6px", borderRadius: 5 }}>⌘K</span>
      </div>
      {/* Notif */}
      <button style={{ position: "relative", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, width: 38, height: 38, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BellIcon />
        {notifCount > 0 && <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, background: "#f43f5e", borderRadius: "50%", border: "2px solid #fff" }} />}
      </button>
      {/* Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "5px 10px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
        <Avatar initials="AD" size={28} gradient="linear-gradient(135deg,#6366f1,#06b6d4)" />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>Admin</div>
          <div style={{ fontSize: 10.5, color: "#94a3b8" }}>Super Admin</div>
        </div>
        <span style={{ color: "#94a3b8", fontSize: 11 }}>▾</span>
      </div>
    </header>
  );
}
