"use client";
import React, { useEffect, useState } from "react";
const VisitorMap = React.lazy(() => import('./analytics/VisitorMap'));
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
  const [visitors, setVisitors] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [cityDetail, setCityDetail] = useState(null);
  const [cityName, setCityName] = useState('');
  const [liveVisitors, setLiveVisitors] = useState(null);
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

  // separate fetch for visitors to handle auth path clearly
  useEffect(() => {
    let c = false;
    let iv;
    function fetchVisitors() {
      apiFetch('/api/v2/analytics/visitors/dashboard')
        .then((res) => { if (!c) { setVisitors(res.data); setLiveVisitors(res.data?.liveVisitors ?? res.data?.todayVisitors); } })
        .catch(() => { if (!c) setVisitors(null); });
    }
    fetchVisitors();
    iv = setInterval(fetchVisitors, 10_000);

    // setup socket for realtime events (lazy)
    let socket;
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        socket = io(undefined, { transports: ['websocket'] });
        socket.on('connect', () => {
          // console.log('analytics socket connected');
        });
        socket.on('visitorEvent', (ev) => {
          if (c) return;
          // update live counters
          setLiveVisitors(prev => (typeof prev === 'number' ? prev + 1 : 1));
          // update topCities heuristically
          setVisitors((prev) => {
            if (!prev) return prev;
            const topCities = Array.isArray(prev.topCities) ? [...prev.topCities] : [];
            const found = topCities.find(t => t.city === ev.city);
            if (found) found.visitors = (found.visitors || 0) + 1;
            else topCities.unshift({ city: ev.city || 'unknown', visitors: 1 });
            return { ...prev, topCities };
          });
          // push into activity feed
          setActivityFeed(a => [{ city: ev.city, page: ev.page, device: ev.device, browser: ev.browser, visitedAt: ev.visitedAt }].concat(a).slice(0, 100));
        });
      } catch (e) {
        // ignore if socket import fails
      }
    })();

    return () => { c = true; clearInterval(iv); if (socket) socket.disconnect(); };
  }, []);

  const fmt = (n) => n === undefined || n === null ? "—" : typeof n === "number" && n > 999 ? `₹${(n / 1000).toFixed(1)}k` : String(n);

  async function openCityDetail(city) {
    try {
      setCityName(city);
      setCityDetail(null);
      setCityModalOpen(true);
      const res = await apiFetch(`/api/v2/analytics/visitors/city/${encodeURIComponent(city)}`);
      setCityDetail(res.data || null);
    } catch (e) {
      setCityDetail({ error: e.message || 'Failed to load' });
    }
  }

  async function fetchCityDetailRange(city, from, to) {
    try {
      setCityDetail(null);
      const q = [];
      if (from) q.push(`from=${encodeURIComponent(from)}`);
      if (to) q.push(`to=${encodeURIComponent(to)}`);
      const url = `/api/v2/analytics/visitors/city/${encodeURIComponent(city)}${q.length ? ('?' + q.join('&')) : ''}`;
      const res = await apiFetch(url);
      setCityDetail(res.data || null);
    } catch (e) {
      setCityDetail({ error: e.message || 'Failed to load' });
    }
  }

  function exportCityCSV() {
    if (!cityDetail) return;
    const rows = [];
    rows.push(['City', cityName]);
    rows.push(['Total Hits', cityDetail.extras?.totalHits || '']);
    rows.push(['Unique Visitors', cityDetail.extras?.uniqueVisitors || '']);
    rows.push(['Avg Session (s)', cityDetail.extras?.avgSessionDuration || '']);
    rows.push([]);
    rows.push(['Top Pages']);
    rows.push(['Page', 'Visitors']);
    (cityDetail.topPages || []).forEach(p => rows.push([p.page, p.visitors]));
    rows.push([]);
    rows.push(['Trends']);
    rows.push(['Date', 'Visitors']);
    (cityDetail.trends || []).forEach(t => rows.push([t.date, t.visitors]));

    const csv = rows.map(r => r.map(c => `"${String(c || '')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `city-${cityName || 'export'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.4s ease" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Analytics & Insights</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Real-time business performance metrics</div>
        </div>
        <div style={{
          padding: "6px 14px", borderRadius: 10,
          background: "#dcfce7", color: "#166534",
          fontSize: 12, fontWeight: 700,
        }}>
            🟢 Live {liveVisitors ? `• ${liveVisitors}` : ''}
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

      {/* Visitor Map + Activity Feed Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <ChartCard title="Visitor Locations">
            {/* Lazy-load map component */}
            <div style={{ height: 420 }}>
              <React.Suspense fallback={<div style={{padding:20}}>Loading map…</div>}>
                <VisitorMap viewers={visitors} onCityClick={openCityDetail} />
              </React.Suspense>
            </div>
          </ChartCard>
        </div>
        <div>
          <ChartCard title="Live Activity">
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {activityFeed.length === 0 && <div style={{ padding: 12, color: '#64748b' }}>No recent activity yet.</div>}
              {activityFeed.map((it, idx) => (
                <div key={idx} style={{ padding: 10, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>{it.page}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{it.city} • {it.device} • {new Date(it.visitedAt).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
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

      {/* Visitor Locations */}
      <ChartCard title="Visitor Locations">
        {visitors ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Top Cities</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(visitors.topCities || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 8, background: '#fff', cursor: 'pointer' }} onClick={() => openCityDetail(c.city)}>
                    <div style={{ fontWeight: 700 }}>{c.city}</div>
                    <div style={{ color: '#64748b' }}>{c.visitors}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 1, background: '#f1f5f9' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Top Pages</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(visitors.topPages || []).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 8, background: '#fff' }}>
                    <div style={{ fontWeight: 700 }}>{p.page}</div>
                    <div style={{ color: '#64748b' }}>{p.visitors}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#94a3b8' }}>Visitor analytics not available.</div>
        )}
      </ChartCard>

      <Modal open={cityModalOpen} onClose={() => setCityModalOpen(false)} title={cityName ? `Visitors — ${cityName}` : 'City detail'}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: '#64748b' }}>From</label>
              <input type="date" onChange={(e) => fetchCityDetailRange(cityName, e.target.value, null)} />
              <label style={{ fontSize: 12, color: '#64748b' }}>To</label>
              <input type="date" onChange={(e) => fetchCityDetailRange(cityName, null, e.target.value)} />
              <button onClick={() => fetchCityDetailRange(cityName)} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 8, background: BRAND, color: '#fff', border: 'none' }}>Refresh</button>
              <button onClick={exportCityCSV} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 8, background: '#0f172a', color: '#fff', border: 'none' }}>Export CSV</button>
            </div>
            <div style={{ flex: 1 }}>
              {cityDetail ? (
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Top Pages</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(cityDetail.topPages || []).map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: '#fff', borderRadius: 8 }}>
                        <div>{p.page}</div>
                        <div style={{ color: '#64748b' }}>{p.visitors}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8' }}>Loading city details…</div>
              )}
            </div>
            <div style={{ width: 360 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Map</div>
              {cityName ? (
                <iframe title={`map-${cityName}`} src={`https://www.google.com/maps?q=${encodeURIComponent(cityName)}&output=embed`} style={{ width: '100%', height: 300, border: 0, borderRadius: 8 }} />
              ) : (
                <div style={{ color: '#94a3b8' }}>No city selected</div>
              )}
            </div>
          </div>
        </div>
      </Modal>

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
