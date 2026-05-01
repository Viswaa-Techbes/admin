import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Card, StatusBadge, SectionHeader, ActionBtn, TableWrapper } from "./UI";
import { TREND_DATA, MONTHLY_TREND, SERVICE_DIST, TECH_PERF, JOBS, ACTIVITIES } from "../lib/data";
// ─── STAT CARDS ──────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Requests", value: "1,284", trend: "+12%", up: true, icon: "📋", gradient: "linear-gradient(135deg,#6366f1,#818cf8)", light: "#eef2ff", iconColor: "#6366f1", target: "service-requests" },
  { label: "Pending Projects", value: "87", trend: "+5%", up: false, icon: "⏳", gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)", light: "#fffbeb", iconColor: "#f59e0b", target: "jobs" },
  { label: "In Progress", value: "43", trend: "−2", up: false, icon: "🔄", gradient: "linear-gradient(135deg,#06b6d4,#22d3ee)", light: "#ecfeff", iconColor: "#06b6d4", target: "jobs" },
  { label: "Members Management", value: "1,154", trend: "+18%", up: true, icon: "👥", gradient: "linear-gradient(135deg,#10b981,#34d399)", light: "#ecfdf5", iconColor: "#10b981", target: "members" },
  { label: "Active Technicians", value: "28", trend: "+3", up: true, icon: "👷", gradient: "linear-gradient(135deg,#8b5cf6,#a78bfa)", light: "#f5f3ff", iconColor: "#8b5cf6", target: "technicians" },
  { label: "Today Revenue", value: "₹48,200", trend: "+22%", up: true, icon: "💰", gradient: "linear-gradient(135deg,#f43f5e,#fb7185)", light: "#fff1f2", iconColor: "#f43f5e", target: "payments" },
];

export function StatCards({ onNavigate }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 20 }}>
      {STATS.map((s, i) => (
        <div key={i} onClick={() => onNavigate && s.target ? onNavigate(s.target) : null} style={{ cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform="translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform="none"}>
        <Card style={{ padding: "18px", height: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: s.light,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
            }}>{s.icon}</div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
              background: s.up ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
              color: s.up ? "#10b981" : "#f43f5e"
            }}>{s.up ? "↑" : "↓"} {s.trend}</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-.5px", marginBottom: 2 }}>{s.value}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
          <div style={{ height: 3, borderRadius: 99, background: "#f1f5f9", marginTop: 14, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${60 + i * 5}%`, background: s.gradient, borderRadius: 99 }} />
          </div>
        </Card>
        </div>
      ))}
    </div>
  );
}

// ─── ACTIVITY PANEL ───────────────────────────────────────────────────────────

export function ActivityPanel() {
  return (
    <Card style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%" }}>
      <SectionHeader title="Live Activity" action="See all" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {ACTIVITIES.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `${a.color}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, flexShrink: 0
            }}>{a.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>{a.msg}</div>
              <div style={{ fontSize: 11.5, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.sub}</div>
              <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>{a.time}</div>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, flexShrink: 0, marginTop: 6 }} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────

export function DashboardPage({ onNavigate }) {
  const [period, setPeriod] = useState("weekly");
  const chartData = period === "weekly" ? TREND_DATA : MONTHLY_TREND;
  const xKey = period === "weekly" ? "day" : "month";

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Stat Cards */}
      <StatCards onNavigate={onNavigate} />

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 16, marginBottom: 16 }}>

        {/* Line Chart */}
        <Card style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Service Requests Trend</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>New vs completed over time</p>
            </div>
            <div style={{ display: "flex", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              {["weekly", "monthly"].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "5px 12px", border: "none", fontSize: 11.5, fontWeight: 600,
                  background: period === p ? "#6366f1" : "transparent",
                  color: period === p ? "#fff" : "#64748b", cursor: "pointer",
                  textTransform: "capitalize"
                }}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" />
              <XAxis dataKey={xKey} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2.5} fill="url(#reqGrad)" name="Requests" dot={{ fill: "#6366f1", r: 3 }} />
              <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} fill="url(#compGrad)" name="Completed" dot={{ fill: "#10b981", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart */}
        <Card style={{ padding: "20px" }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Technician Performance</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Projects completed this month</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={TECH_PERF} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[5, 5, 0, 0]} />
              <Bar dataKey="inProgress" name="In Progress" fill="#06b6d4" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut Chart */}
        <Card style={{ padding: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Service Distribution</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>By service type</p>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={SERVICE_DIST} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                {SERVICE_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {SERVICE_DIST.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: "#475569" }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Table + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 16 }}>

        {/* Jobs Table */}
        <Card style={{ padding: "20px" }}>
          <SectionHeader title="Recent Service Requests" action="View All Projects →" />
          <TableWrapper
            headers={["Project ID", "Customer", "Service", "Technician", "Status", "Date", "Action"]}
            rows={JOBS.map((j, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f8fafc", transition: "background .1s" }}>
                <td style={{ padding: "11px 14px", fontSize: 12.5, fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>{j.id}</td>
                <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{j.customer}</td>
                <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#475569" }}>{j.service}</td>
                <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#475569" }}>{j.tech}</td>
                <td style={{ padding: "11px 14px" }}><StatusBadge status={j.status} /></td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "#94a3b8" }}>{j.date}</td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ background: "rgba(99,102,241,0.08)", border: "none", color: "#6366f1", padding: "5px 10px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>View</button>
                    <button style={{ background: "rgba(6,182,212,0.08)", border: "none", color: "#06b6d4", padding: "5px 10px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          />
        </Card>

        {/* Activity */}
        <ActivityPanel />
      </div>
    </div>
  );
}
