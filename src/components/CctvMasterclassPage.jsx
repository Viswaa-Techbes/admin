import React, { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../lib/apiClient";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_COLORS = {
  PAID:     { bg: "rgba(34,197,94,0.10)",  text: "#16A34A", border: "rgba(34,197,94,0.25)"  },
  PENDING:  { bg: "rgba(234,179,8,0.10)",  text: "#B45309", border: "rgba(234,179,8,0.25)"  },
  FAILED:   { bg: "rgba(220,38,38,0.10)",  text: "#DC2626", border: "rgba(220,38,38,0.25)"  },
  REFUNDED: { bg: "rgba(14,165,233,0.10)", text: "#0284C7", border: "rgba(14,165,233,0.25)" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 100, padding: "3px 10px",
    }}>
      {status}
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E2E8F0",
      borderRadius: 14,
      padding: "18px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0A0F1E", letterSpacing: "-0.02em" }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ reg, onClose }) {
  if (!reg) return null;

  const fields = [
    { label: "Full Name", value: reg.name },
    { label: "Mobile", value: reg.mobile },
    { label: "Email", value: reg.email },
    { label: "WhatsApp", value: reg.whatsapp || "—" },
    { label: "Location", value: reg.location },
    { label: "Qualification", value: reg.qualification },
    { label: "Enrollment ID", value: reg.enrollmentId || "—", mono: true },
    { label: "Payment Status", value: <StatusBadge status={reg.paymentStatus} /> },
    { label: "Amount", value: reg.amount ? `₹${reg.amount}` : "₹499" },
    { label: "Razorpay Order ID", value: reg.razorpayOrderId || "—", mono: true, small: true },
    { label: "Razorpay Payment ID", value: reg.razorpayPaymentId || "—", mono: true, small: true },
    { label: "Certificate Status", value: reg.certificateStatus || "NOT_GENERATED" },
    { label: "Registered At", value: formatDateTime(reg.createdAt) },
    { label: "Paid At", value: formatDateTime(reg.paidAt) },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(10,15,30,0.4)", backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "flex-end",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 460,
        background: "#fff",
        height: "100%",
        overflowY: "auto",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#fff", zIndex: 2,
        }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
              Registration Details
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0A0F1E" }}>{reg.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "1.5px solid #E2E8F0", background: "#F8FAFC",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748B", fontSize: 16,
            }}
          >×</button>
        </div>

        {/* Fields */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          {fields.map(({ label, value, mono, small }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "11px 0", borderBottom: "1px solid #F8FAFC",
              gap: 12,
            }}>
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600, flexShrink: 0 }}>{label}</span>
              <span style={{
                fontSize: small ? 10.5 : 13, fontWeight: 700, color: "#0A0F1E",
                fontFamily: mono ? "monospace" : "inherit",
                textAlign: "right", wordBreak: "break-all",
              }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CctvMasterclassPage() {
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, failed: 0, revenue: 0 });
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReg, setSelectedReg] = useState(null);
  const [error, setError] = useState("");
  const searchTimeout = useRef(null);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      const { payload } = await apiFetch("/api/v2/cctv-course/admin/masterclass/stats");
      const d = payload?.data || payload?.stats || {};
      setStats({
        total: d.total || 0,
        paid: d.paid || 0,
        pending: d.pending || 0,
        failed: d.failed || 0,
        revenue: d.revenue || 0,
      });
    } catch {}
  }, []);

  // ── Fetch registrations ──
  const fetchRegs = useCallback(async (currentPage = 1, s = search, st = statusFilter, df = dateFrom, dt = dateTo) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: "20" });
      if (s) params.set("search", s);
      if (st) params.set("status", st);
      if (df) params.set("from", df);
      if (dt) params.set("to", dt);

      const { payload } = await apiFetch(`/api/v2/cctv-course/admin/registrations?${params}`);
      setRegistrations(payload?.data || []);
      setPagination(payload?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError("Failed to load registrations. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
    fetchRegs(1);
  }, []);

  // Debounced search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchRegs(1, val, statusFilter, dateFrom, dateTo);
    }, 400);
  };

  const applyFilters = () => {
    setPage(1);
    fetchRegs(1, search, statusFilter, dateFrom, dateTo);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    fetchRegs(1, "", "", "", "");
  };

  const goToPage = (p) => {
    setPage(p);
    fetchRegs(p);
  };

  const statCards = [
    { label: "Total Registrations", value: stats.total,   icon: "👥", color: "#6366F1" },
    { label: "Paid",                value: stats.paid,    icon: "✅", color: "#16A34A" },
    { label: "Pending",             value: stats.pending, icon: "⏳", color: "#D97706" },
    { label: "Failed",              value: stats.failed,  icon: "❌", color: "#DC2626" },
    {
      label: "Total Revenue",
      value: `₹${stats.revenue.toLocaleString("en-IN")}`,
      icon: "💰",
      color: "#0EA5E9",
    },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
          Masterclasses
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0A0F1E", margin: 0, letterSpacing: "-0.02em" }}>
          CCTV Masterclass
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
          Live enrollment activity and participant details
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 14,
        marginBottom: 28,
      }}>
        {statCards.map(sc => <StatCard key={sc.label} {...sc} />)}
      </div>

      {/* ── Filters ── */}
      <div style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 20,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-end",
      }}>
        {/* Search */}
        <div style={{ flex: "1 1 200px", minWidth: 180 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            Search
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Name, email, mobile, ID…"
              style={{
                width: "100%", paddingLeft: 32, paddingRight: 12,
                paddingTop: 8, paddingBottom: 8,
                border: "1.5px solid #E2E8F0", borderRadius: 8,
                fontSize: 13, color: "#0A0F1E", outline: "none",
                background: "#FAFAFA",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div style={{ flex: "0 1 160px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              width: "100%", padding: "8px 10px",
              border: "1.5px solid #E2E8F0", borderRadius: 8,
              fontSize: 13, color: "#0A0F1E", background: "#FAFAFA", outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        {/* Date from */}
        <div style={{ flex: "0 1 160px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{
              width: "100%", padding: "8px 10px",
              border: "1.5px solid #E2E8F0", borderRadius: 8,
              fontSize: 13, color: "#0A0F1E", background: "#FAFAFA", outline: "none",
            }}
          />
        </div>

        {/* Date to */}
        <div style={{ flex: "0 1 160px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{
              width: "100%", padding: "8px 10px",
              border: "1.5px solid #E2E8F0", borderRadius: 8,
              fontSize: 13, color: "#0A0F1E", background: "#FAFAFA", outline: "none",
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, flex: "0 0 auto", alignSelf: "flex-end" }}>
          <button
            onClick={applyFilters}
            style={{
              padding: "8px 18px",
              background: "#0A0F1E", color: "#fff",
              border: "none", borderRadius: 8,
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            style={{
              padding: "8px 14px",
              background: "#F1F5F9", color: "#64748B",
              border: "1.5px solid #E2E8F0", borderRadius: 8,
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {/* Table header row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid #F1F5F9",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0A0F1E" }}>
            Registrations
            <span style={{
              marginLeft: 10, fontSize: 11, fontWeight: 700, color: "#64748B",
              background: "#F1F5F9", borderRadius: 100, padding: "2px 9px",
            }}>{pagination.total}</span>
          </div>
          <button
            onClick={() => { fetchStats(); fetchRegs(page); }}
            style={{
              fontSize: 12, fontWeight: 700, color: "#0EA5E9",
              background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
              borderRadius: 7, padding: "5px 12px", cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div style={{ padding: "16px 20px", background: "rgba(220,38,38,0.05)", color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{
              display: "inline-block", width: 36, height: 36,
              border: "3px solid rgba(245,194,24,0.2)",
              borderTop: "3px solid #F5C218",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 12 }}>Loading registrations…</div>
          </div>
        ) : registrations.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
            No registrations found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Enrollment ID", "Name", "Mobile", "Email", "Location", "Qualification", "Status", "Amount", "Registered"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: "#64748B",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                  <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, idx) => (
                  <tr key={reg._id} style={{
                    borderBottom: "1px solid #F8FAFC",
                    background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                    transition: "background 0.1s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F0F9FF")}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA")}
                  >
                    <td style={{ padding: "11px 14px", fontSize: 11.5, fontFamily: "monospace", color: "#F5C218", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {reg.enrollmentId || "—"}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#0A0F1E", whiteSpace: "nowrap" }}>
                      {reg.name}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#475569", whiteSpace: "nowrap" }}>{reg.mobile}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#475569", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {reg.email}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#475569", whiteSpace: "nowrap" }}>{reg.location || "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#475569", whiteSpace: "nowrap" }}>{reg.qualification || "—"}</td>
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <StatusBadge status={reg.paymentStatus} />
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#0A0F1E", whiteSpace: "nowrap" }}>
                      {reg.amount ? `₹${reg.amount}` : "₹499"}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11.5, color: "#64748B", whiteSpace: "nowrap" }}>
                      {formatDate(reg.createdAt)}
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      <button
                        onClick={() => setSelectedReg(reg)}
                        style={{
                          padding: "5px 14px",
                          background: "rgba(99,102,241,0.08)",
                          border: "1px solid rgba(99,102,241,0.2)",
                          borderRadius: 7,
                          fontSize: 12, fontWeight: 700, color: "#6366F1",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.14)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.pages > 1 && (
          <div style={{
            padding: "14px 20px",
            borderTop: "1px solid #F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                style={{
                  padding: "6px 14px", borderRadius: 7,
                  border: "1.5px solid #E2E8F0", background: "#fff",
                  fontSize: 12, fontWeight: 600, color: page <= 1 ? "#CBD5E1" : "#0A0F1E",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >← Prev</button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const p = Math.max(1, page - 2) + i;
                if (p > pagination.pages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    style={{
                      padding: "6px 12px", borderRadius: 7,
                      border: p === page ? "none" : "1.5px solid #E2E8F0",
                      background: p === page ? "#0A0F1E" : "#fff",
                      fontSize: 12, fontWeight: 700,
                      color: p === page ? "#fff" : "#0A0F1E",
                      cursor: "pointer",
                    }}
                  >{p}</button>
                );
              })}
              <button
                disabled={page >= pagination.pages}
                onClick={() => goToPage(page + 1)}
                style={{
                  padding: "6px 14px", borderRadius: 7,
                  border: "1.5px solid #E2E8F0", background: "#fff",
                  fontSize: 12, fontWeight: 600, color: page >= pagination.pages ? "#CBD5E1" : "#0A0F1E",
                  cursor: page >= pagination.pages ? "not-allowed" : "pointer",
                }}
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedReg && (
        <DetailDrawer reg={selectedReg} onClose={() => setSelectedReg(null)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
