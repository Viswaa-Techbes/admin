"use client";
import React, { useEffect, useState } from "react";
import { Modal } from './UI';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Color Palette ────────────────────────────────────────────────────────────
const BRAND = "#1565C0";
const ACCENT = "#E64A19";
const COLORS = [BRAND, ACCENT, "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

function KPICard({ label, value, sub, color = BRAND, icon, trend }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      padding: "22px 24px",
      boxShadow: "0 2px 16px rgba(15,23,42,0.06)",
      border: "1px solid #f1f5f9",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>{label}</div>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}18`,
          color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a" }}>
        {value ?? "—"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {trend !== undefined && (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "2px 8px",
            borderRadius: 99,
            background: trend >= 0 ? "#dcfce7" : "#fee2e2",
            color: trend >= 0 ? "#166534" : "#991b1b",
          }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</span>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, action, onAction }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      padding: "24px",
      boxShadow: "0 2px 16px rgba(15,23,42,0.06)",
      border: "1px solid #f1f5f9",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{title}</div>
        {action && (
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>{action}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function PeriodSelector({ value, onChange }) {
  const opts = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {opts.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: `1.5px solid ${value === o.value ? BRAND : "#e2e8f0"}`,
          background: value === o.value ? `${BRAND}12` : "#fff",
          color: value === o.value ? BRAND : "#64748b",
          cursor: "pointer",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [jobBreakdown, setJobBreakdown] = useState({ byStatus: [], byServiceType: [] });
  const [techPerf, setTechPerf] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [revPeriod, setRevPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch("/api/v2/analytics/summary"),
      apiFetch(`/api/v2/analytics/revenue?period=${revPeriod}&months=6`),
      apiFetch("/api/v2/analytics/jobs"),
      apiFetch("/api/v2/analytics/technicians"),
      apiFetch("/api/v2/analytics/funnel"),
    ])
      .then(([s, r, j, t, f]) => {
        if (!cancelled) {
          setSummary(s.data);
          setRevenue(r.data || []);
          setJobBreakdown(j.data || { byStatus: [], byServiceType: [] });
          setTechPerf(t.data || []);
          setFunnel(f.data || []);
          // visitors handled by separate fetch
          setError("");
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [revPeriod]);


  const fmt = (n) => n === undefined || n === null ? "—" : typeof n === "number" && n > 999 ? `₹${(n / 1000).toFixed(1)}k` : String(n);



  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.4s ease" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Analytics & Insights</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Real-time business performance metrics</div>
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KPICard label="Total Bookings" value={summary?.totalBookings ?? "—"} icon="📋" color={BRAND} />
        <KPICard
          label="Revenue This Month"
          value={summary ? `₹${(summary.monthRevenue || 0).toLocaleString("en-IN")}` : "—"}
          trend={summary?.revenueGrowth}
          sub="vs last month"
          icon="💰"
          color="#10b981"
        />
        <KPICard
          label="Conversion Rate"
          value={summary ? `${summary.conversionRate}%` : "—"}
          sub="bookings → completed"
          icon="🎯"
          color="#8b5cf6"
        />
        <KPICard
          label="Active Technicians"
          value={summary ? `${summary.onlineTechnicians}/${summary.totalTechnicians}` : "—"}
          sub="online / total"
          icon="👨‍🔧"
          color={ACCENT}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KPICard label="Active Jobs" value={summary?.activeJobs ?? "—"} icon="🔧" color="#f59e0b" />
        <KPICard label="Completed Jobs" value={summary?.completedJobs ?? "—"} icon="✅" color="#10b981" />
        <KPICard label="Pending Jobs" value={summary?.pendingJobs ?? "—"} icon="⏳" color="#94a3b8" />
        <KPICard label="Total Members" value={summary?.totalMembers ?? "—"} icon="👥" color="#06b6d4" />
      </div>



      {/* Revenue Chart */}
      <ChartCard
        title="Revenue Trend"
        action={<PeriodSelector value={revPeriod} onChange={setRevPeriod} />}
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND} stopOpacity={0.18} />
                <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
              contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Area type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2.5} fill="url(#revGrad)" />
            <Area type="monotone" dataKey="jobs" stroke={ACCENT} strokeWidth={2} fill="none" strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <LegendDot color={BRAND} label="Revenue (₹)" />
          <LegendDot color={ACCENT} label="Jobs Count" />
        </div>
      </ChartCard>



      {/* Jobs + Service Type */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <ChartCard title="Jobs by Status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={jobBreakdown.byStatus} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 10, fill: "#475569" }} width={120} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" fill={BRAND} radius={[0, 6, 6, 0]}>
                {jobBreakdown.byStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Service Type Split">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={jobBreakdown.byServiceType}
                dataKey="count"
                nameKey="type"
                cx="50%" cy="50%"
                outerRadius={80}
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {jobBreakdown.byServiceType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Booking Funnel */}
      <ChartCard title="Booking Conversion Funnel">
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 140, padding: "0 16px" }}>
          {funnel.map((step, i) => {
            const maxCount = funnel[0]?.count || 1;
            const pct = (step.count / maxCount) * 100;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{step.count}</div>
                <div style={{
                  width: "100%",
                  height: `${pct}%`,
                  minHeight: 12,
                  background: `linear-gradient(180deg, ${COLORS[i % COLORS.length]} 0%, ${COLORS[i % COLORS.length]}99 100%)`,
                  borderRadius: "8px 8px 0 0",
                  transition: "height 0.6s ease",
                }} />
                <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textAlign: "center", lineHeight: 1.3 }}>
                  {step.stage}
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Technician Performance Table */}
      <ChartCard title="Technician Performance">
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading...</div>
        ) : techPerf.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No technician data yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                  {["Technician", "Specialty", "Total Jobs", "Completed", "Completion %", "Revenue (₹)", "Days Present", "Hours"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {techPerf.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: `${COLORS[i % COLORS.length]}20`,
                          color: COLORS[i % COLORS.length],
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 800,
                        }}>
                          {(t.name || "?")[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{t.name || "Unknown"}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.isOnline ? "🟢 Online" : "⚫ Offline"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={TD}>{t.specialty || "—"}</td>
                    <td style={TD}>{t.totalJobs}</td>
                    <td style={TD}>{t.completedJobs}</td>
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          height: 6, width: 60, borderRadius: 99, background: "#f1f5f9", overflow: "hidden"
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${t.completionRate}%`,
                            background: t.completionRate > 70 ? "#10b981" : t.completionRate > 40 ? "#f59e0b" : "#ef4444",
                            borderRadius: 99,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{t.completionRate}%</span>
                      </div>
                    </td>
                    <td style={TD}>₹{(t.totalRevenue || 0).toLocaleString("en-IN")}</td>
                    <td style={TD}>{t.daysPresent}</td>
                    <td style={TD}>{t.totalHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
    </div>
  );
}

const TD = { padding: "12px 12px", fontSize: 12.5, color: "#475569", verticalAlign: "middle" };
