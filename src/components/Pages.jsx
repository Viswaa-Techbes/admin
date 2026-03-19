import React, { useState, useEffect } from "react";
import { PlusIcon, EyeIcon, EditIcon } from "./Icons";
import { PageHeader, SearchFilter, Card, TableWrapper, Avatar, StatusBadge, ActionBtn, StarRating, SectionHeader } from "./UI";
import { CUSTOMERS, TECHNICIANS, JOBS, PAYMENTS, TRACKING_TECHS, NOTIFICATIONS, MONTHLY_TREND, SERVICE_DIST, TECH_PERF } from "../lib/data";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

export function CustomersPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Grouping State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [groupByPincode, setGroupByPincode] = useState(false);

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => {
        console.log('Leads API response:', d);
        setLeads(d.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch leads:', err);
        setLoading(false);
      });
  }, []);

  // 1. Filtering Logic
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      (l.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (l.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (l.phone?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (l.pincode?.toString().toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    const matchesService = serviceFilter === "All" || 
      (l.plan?.toLowerCase() || "").includes(serviceFilter.toLowerCase()) ||
      (l.service?.toLowerCase() || "").includes(serviceFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesService;
  });

  // 2. Grouping Logic (if enabled)
  const renderRow = (l, i) => (
    <tr key={l._id || i} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <Avatar 
            initials={(l.name || '?').charAt(0).toUpperCase()} 
            size={40} 
            gradient={i % 2 === 0 ? "linear-gradient(135deg,#6366f1,#818cf8)" : "linear-gradient(135deg,#8b5cf6,#a78bfa)"}
          />
          <div>
            <div className="font-bold text-slate-900 text-sm">{l.name || 'Anonymous'}</div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{l.role || 'User'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <div className="text-sm text-slate-600 font-medium">{l.email}</div>
          <div className="text-xs text-slate-400 font-mono tracking-tight">{l.phone}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
          l.plan?.toLowerCase() === 'lifetime' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
          l.plan?.toLowerCase() === 'premium' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
          'bg-slate-50 text-slate-600 border border-slate-100'
        }`}>
          {(l.plan || l.service || '—').toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-600 font-medium">{l.pincode || '—'}</div>
        {l.location && <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{l.location}</div>}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-slate-600">
         {new Date(l.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={l.status} />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="View Details"><EyeIcon /></button>
           <button className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-xl transition-colors" title="Edit Lead"><EditIcon /></button>
        </div>
      </td>
    </tr>
  );

  let tableContent;
  if (groupByPincode && filteredLeads.length > 0) {
    const groups = filteredLeads.reduce((acc, lead) => {
      const pin = lead.pincode || "Unassigned";
      if (!acc[pin]) acc[pin] = [];
      acc[pin].push(lead);
      return acc;
    }, {});

    tableContent = Object.entries(groups).map(([pin, groupLeads]) => (
      <React.Fragment key={pin}>
        <tr className="bg-slate-50/80">
          <td colSpan="7" className="px-6 py-2 border-y border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pincode Area: <span className="text-slate-900">{pin}</span></span>
              <span className="ml-auto text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{groupLeads.length} Leads</span>
            </div>
          </td>
        </tr>
        {groupLeads.map((l, i) => renderRow(l, i))}
      </React.Fragment>
    ));
  } else {
    tableContent = filteredLeads.length > 0 ? filteredLeads.map((l, i) => renderRow(l, i)) : (
      <tr>
        <td colSpan="7" className="px-6 py-20 text-center">
          <div className="flex flex-col items-center text-slate-400">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-sm font-medium">No leads match your criteria.</p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="font-[family-name:var(--font-geist-sans)] max-w-[1400px] mx-auto">
      <PageHeader
        title="Lead Management"
        subtitle={`${filteredLeads.length} leads matching filters`}
        actions={<ActionBtn icon={<PlusIcon />} label="Add Lead" primary />}
      />
      
      <SearchFilter 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        serviceFilter={serviceFilter}
        onServiceChange={setServiceFilter}
        groupByPincode={groupByPincode}
        onGroupToggle={() => setGroupByPincode(!groupByPincode)}
        placeholder="Search by name, email, phone or pincode…"
      />
      
      <Card>
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-32 mb-2"></div>
              <p className="text-slate-400 text-sm">Loading leads data...</p>
            </div>
          </div>
        ) : (
          <TableWrapper
            headers={["Customer", "Contact Details", "Plan", "Pincode / Area", "Date", "Status", "Actions"]}
            rows={tableContent}
          />
        )}
      </Card>
    </div>
  );
}

// ─── TECHNICIANS PAGE ─────────────────────────────────────────────────────────

export function TechniciansPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false) });
  }, []);

  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered system users`}
        actions={<ActionBtn icon={<PlusIcon />} label="Add User" primary />}
      />
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        {loading ? <div className="p-8 text-center text-slate-500">Loading users...</div> : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-center">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, i) => (
                <tr key={u._id || i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={u.name.charAt(0)} size={32} />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>{u.role.toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">Revoke Access</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── JOBS PAGE ────────────────────────────────────────────────────────────────

export function JobsPage() {
  return (
    <div>
      <PageHeader
        title="Service Requests"
        subtitle="All jobs and service requests"
        actions={<><ActionBtn label="Export" /><ActionBtn icon={<PlusIcon />} label="New Job" primary /></>}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {["All", "Pending", "Assigned", "In Progress", "Completed", "Cancelled"].map(s => (
          <button key={s} style={{
            padding: "6px 14px", borderRadius: 99, border: "1px solid #e2e8f0",
            background: s === "All" ? "#6366f1" : "#fff",
            color: s === "All" ? "#fff" : "#64748b",
            fontSize: 12.5, fontWeight: 600, cursor: "pointer"
          }}>{s}</button>
        ))}
      </div>
      <SearchFilter placeholder="Search by Job ID, customer, service…" />
      <Card>
        <TableWrapper
          headers={["Job ID", "Customer", "Service Type", "Technician", "Location", "Status", "Scheduled Date", "Actions"]}
          rows={JOBS.map((j, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={{ padding: "12px 14px", fontSize: 12.5, fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>{j.id}</td>
              <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{j.customer}</td>
              <td style={{ padding: "12px 14px", fontSize: 12.5, color: "#475569" }}>{j.service}</td>
              <td style={{ padding: "12px 14px", fontSize: 12.5, color: "#475569" }}>{j.tech}</td>
              <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>{j.location}</td>
              <td style={{ padding: "12px 14px" }}><StatusBadge status={j.status} /></td>
              <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{j.date}</td>
              <td style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={{ background: "rgba(99,102,241,0.08)", border: "none", color: "#6366f1", padding: "5px 10px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>View</button>
                  <button style={{ background: "rgba(6,182,212,0.08)", border: "none", color: "#06b6d4", padding: "5px 10px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                </div>
              </td>
            </tr>
          ))}
        />
      </Card>
    </div>
  );
}

// ─── SERVICES PAGE ────────────────────────────────────────────────────────────

const SERVICES_LIST = [
  { name: "CCTV Installation", desc: "Full HD and IP camera installation", category: "Security", basePrice: "₹8,000", active: true, jobs: 412 },
  { name: "Laptop Repair", desc: "Hardware and software diagnostics & repair", category: "Repair", basePrice: "₹500+", active: true, jobs: 359 },
  { name: "Desktop Service", desc: "PC assembly, repair & OS installation", category: "Repair", basePrice: "₹400+", active: true, jobs: 231 },
  { name: "Networking Setup", desc: "LAN, WAN, WiFi and structured cabling", category: "Networking", basePrice: "₹5,000+", active: true, jobs: 180 },
  { name: "AMC Maintenance", desc: "Annual maintenance contract for all systems", category: "Maintenance", basePrice: "₹12,000/yr", active: true, jobs: 102 },
];

export function ServicesPage() {
  return (
    <div>
      <PageHeader title="Services" subtitle="Manage your service catalog" actions={<ActionBtn icon={<PlusIcon />} label="Add Service" primary />} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {SERVICES_LIST.map((s, i) => (
          <Card key={i} style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: ["#eef2ff", "#ecfeff", "#ecfdf5", "#fffbeb", "#fff1f2"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {["📹", "💻", "🖥️", "🌐", "🔧"][i]}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Active</span>
              </div>
            </div>
            <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{s.name}</h4>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b" }}>{s.desc}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.jobs} total jobs</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#6366f1" }}>{s.basePrice}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── PAYMENTS PAGE ────────────────────────────────────────────────────────────

export function PaymentsPage() {
  const totalRev = PAYMENTS.filter(p => p.status === "Paid").reduce((a, p) => a + p.amount, 0);
  const pending = PAYMENTS.filter(p => p.status === "Pending").reduce((a, p) => a + p.amount, 0);
  return (
    <div>
      <PageHeader title="Payments" subtitle="Revenue and transaction overview" actions={<ActionBtn label="Export Report" primary />} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          ["Total Revenue", `₹${totalRev.toLocaleString("en-IN")}`, "💰", "#10b981", "#ecfdf5"],
          ["Pending Amount", `₹${pending.toLocaleString("en-IN")}`, "⏳", "#f59e0b", "#fffbeb"],
          ["Transactions", PAYMENTS.length, "🔄", "#6366f1", "#eef2ff"],
          ["Avg. Order Value", "₹8,667", "📊", "#06b6d4", "#ecfeff"],
        ].map(([l, v, icon, c, bg], i) => (
          <Card key={i} style={{ padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-.5px" }}>{v}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{l}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ padding: "20px 20px 0" }}>
          <SectionHeader title="Recent Transactions" />
        </div>
        <TableWrapper
          headers={["Transaction ID", "Customer", "Service", "Amount", "Method", "Status", "Date"]}
          rows={PAYMENTS.map((p, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={{ padding: "12px 14px", fontSize: 12.5, fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>{p.id}</td>
              <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{p.customer}</td>
              <td style={{ padding: "12px 14px", fontSize: 12.5, color: "#475569" }}>{p.service}</td>
              <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>₹{p.amount.toLocaleString("en-IN")}</td>
              <td style={{ padding: "12px 14px" }}>
                <span style={{ fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "3px 9px", borderRadius: 6, color: "#475569" }}>{p.method}</span>
              </td>
              <td style={{ padding: "12px 14px" }}><StatusBadge status={p.status} /></td>
              <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{p.date}</td>
            </tr>
          ))}
        />
      </Card>
    </div>
  );
}

// ─── LIVE TRACKING PAGE ───────────────────────────────────────────────────────

export function TrackingPage() {
  return (
    <div>
      <PageHeader title="Live Tracking" subtitle="Real-time technician location monitoring" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* Map Placeholder */}
        <Card style={{ overflow: "hidden", minHeight: 500 }}>
          <div style={{
            height: "100%", minHeight: 500,
            background: "linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)",
            position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 16, overflow: "hidden"
          }}>
            {/* Grid lines */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .12 }} xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth=".5" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {/* Ping dots */}
            {TRACKING_TECHS.map((t, i) => (
              <div key={i} style={{
                position: "absolute",
                left: `${[28, 62, 72, 52][i]}%`,
                top: `${[35, 65, 28, 50][i]}%`,
              }}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: t.status === "On Job" ? "rgba(6,182,212,0.2)" : "rgba(16,185,129,0.2)",
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    animation: "ping 1.5s cubic-bezier(0,0,.2,1) infinite"
                  }} />
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: t.status === "On Job" ? "#06b6d4" : "#10b981",
                    border: "3px solid #fff",
                    boxShadow: "0 0 12px rgba(99,102,241,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 8, fontWeight: 800,
                    position: "relative", zIndex: 2
                  }}>{t.avatar[0]}</div>
                  <div style={{
                    position: "absolute", top: -36, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(15,23,42,0.9)", color: "#e2e8f0",
                    fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 6,
                    whiteSpace: "nowrap", border: "1px solid rgba(99,102,241,0.3)"
                  }}>{t.name}</div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: "center", zIndex: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
              <div style={{ color: "#475569", fontSize: 13 }}>Live Map View</div>
              <div style={{ color: "#334155", fontSize: 11, marginTop: 4 }}>Google Maps / MapBox will be integrated here</div>
            </div>
          </div>
        </Card>

        {/* Technician list */}
        <Card style={{ padding: "20px" }}>
          <SectionHeader title="Field Technicians" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TRACKING_TECHS.map((t, i) => (
              <div key={i} style={{
                padding: "14px", borderRadius: 12,
                background: "#f8fafc", border: "1px solid #f1f5f9"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Avatar initials={t.avatar} size={36} gradient={t.status === "On Job" ? "linear-gradient(135deg,#06b6d4,#0ea5e9)" : "linear-gradient(135deg,#10b981,#34d399)"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>{t.location}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b" }}>
                  <span>Job: <strong style={{ color: "#6366f1" }}>{t.job}</strong></span>
                  <span style={{ color: t.status === "On Job" ? "#06b6d4" : "#10b981" }}>{t.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <style>{`@keyframes ping { 75%,100%{transform:translate(-50%,-50%) scale(2);opacity:0} }`}</style>
    </div>
  );
}

// ─── NOTIFICATIONS PAGE ───────────────────────────────────────────────────────

export function NotificationsPage() {
  const typeColors = { info: "#6366f1", success: "#10b981", payment: "#f59e0b", warning: "#f43f5e", alert: "#ef4444" };
  const typeIcons = { info: "ℹ️", success: "✅", payment: "💳", warning: "⚠️", alert: "🚨" };
  return (
    <div>
      <PageHeader title="Notifications" subtitle={`${NOTIFICATIONS.filter(n => !n.read).length} unread notifications`}
        actions={<ActionBtn label="Mark all read" />} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 780 }}>
        {NOTIFICATIONS.map((n, i) => (
          <Card key={i} style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14, opacity: n.read ? 0.65 : 1 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${typeColors[n.type]}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{typeIcons[n.type]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{n.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />}
                  <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{n.time}</span>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}>{n.desc}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────

export function ReportsPage() {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>{p.name}: {typeof p.value === "number" && p.value > 1000 ? `₹${(p.value / 1000).toFixed(0)}K` : p.value}</div>
        ))}
      </div>
    );
  };
  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Insights and performance metrics" actions={<ActionBtn label="Download Report" primary />} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Revenue Trends */}
        <Card style={{ padding: "20px" }}>
          <SectionHeader title="Revenue Trends (2026)" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_TREND}>
              <defs>
                <linearGradient id="revGradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGradR)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Service Demand */}
        <Card style={{ padding: "20px" }}>
          <SectionHeader title="Service Demand by Type" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SERVICE_DIST} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Share %" radius={[0, 5, 5, 0]}>
                {SERVICE_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Technician Performance */}
        <Card style={{ padding: "20px" }}>
          <SectionHeader title="Technician Performance" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TECH_PERF} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Completion */}
        <Card style={{ padding: "20px" }}>
          <SectionHeader title="Monthly Job Completion Rate" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2.5} name="Requests" dot={{ fill: "#6366f1", r: 3 }} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} name="Completed" dot={{ fill: "#10b981", r: 3 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      setStatus({ type: res.ok ? 'success' : 'error', msg: data.message });
      if (res.ok) { setCurrentPassword(''); setNewPassword(''); }
    } catch {
      setStatus({ type: 'error', msg: 'Something went wrong' });
    }
  };

  return (
    <Card style={{ padding: "24px", marginTop: "16px" }}>
      <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Change Password</h3>
      {status.msg && <div className={`p-3 rounded-xl text-sm mb-4 border ${status.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{status.msg}</div>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Current Password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#0f172a", outline: "none", width: 240 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#0f172a", outline: "none", width: 240 }} />
        </div>
        <button type="submit" style={{ marginTop: 10, alignSelf: "flex-start", padding: "8px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" }}>Update Password</button>
      </form>
    </Card>
  );
}

export function SettingsPage() {
  const sections = [
    { title: "Company Profile", fields: [["Company Name", "Techbes Services Pvt. Ltd."], ["Email", "admin@techbes.in"], ["Phone", "+91 80 4123 5678"], ["Address", "Koramangala, Bangalore - 560034"]] },
    { title: "Notification Preferences", fields: [["Email Notifications", "Enabled"], ["SMS Alerts", "Enabled"], ["Push Notifications", "Disabled"]] },
    { title: "System Settings", fields: [["Timezone", "Asia/Kolkata (IST)"], ["Currency", "Indian Rupee (₹)"], ["Language", "English"]] },
  ];
  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration and preferences" />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, maxWidth: 900 }}>
        <Card style={{ padding: "8px" }}>
          {["Company Profile", "Notifications", "Users & Roles", "Integrations", "Security", "Billing"].map((s, i) => (
            <button key={s} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "10px 14px", borderRadius: 9, border: "none",
              background: i === 0 ? "rgba(99,102,241,0.1)" : "transparent",
              color: i === 0 ? "#6366f1" : "#64748b",
              fontSize: 13, fontWeight: i === 0 ? 600 : 400, cursor: "pointer"
            }}>{s}</button>
          ))}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sections.map((section, si) => (
            <Card key={si} style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{section.title}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {section.fields.map(([label, value], fi) => (
                  <div key={fi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</label>
                    <input defaultValue={value} style={{
                      padding: "7px 12px", borderRadius: 8,
                      border: "1px solid #e2e8f0", background: "#f8fafc",
                      fontSize: 13, color: "#0f172a", outline: "none", width: 240
                    }} />
                  </div>
                ))}
              </div>
              <button style={{ marginTop: 20, padding: "8px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" }}>Save Changes</button>
            </Card>
          ))}
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
