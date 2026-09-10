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

function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

const STATUS_COLORS = {
  PAID:      { bg: "rgba(34,197,94,0.10)",  text: "#16A34A", border: "rgba(34,197,94,0.25)"  },
  PENDING:   { bg: "rgba(234,179,8,0.10)",  text: "#B45309", border: "rgba(234,179,8,0.25)"  },
  FAILED:    { bg: "rgba(220,38,38,0.10)",  text: "#DC2626", border: "rgba(220,38,38,0.25)"  },
  CANCELLED: { bg: "rgba(100,116,139,0.10)",text: "#64748B", border: "rgba(100,116,139,0.25)" },
  REFUNDED:  { bg: "rgba(14,165,233,0.10)", text: "#0284C7", border: "rgba(14,165,233,0.25)" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 100, padding: "3px 10px",
      display: "inline-block",
    }}>
      {status}
    </span>
  );
}

function ZoomBadge({ sent, status, error, sentAt }) {
  if (sent) {
    return (
      <span
        title={sentAt ? `Sent at ${formatDateTime(sentAt)}` : 'Zoom link sent'}
        style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
          background: "rgba(34,197,94,0.10)", color: "#16A34A",
          border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: 100, padding: "3px 9px",
          display: "inline-flex", alignItems: "center", gap: 4,
          cursor: "help",
        }}
      >
        <span style={{ fontSize: 10 }}>✓</span> ZOOM SENT
      </span>
    );
  }

  if (status === 'FAILED') {
    return (
      <span
        title={error || 'Failed to send Zoom email'}
        style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
          background: "rgba(220,38,38,0.10)", color: "#DC2626",
          border: "1px solid rgba(220,38,38,0.25)",
          borderRadius: 100, padding: "3px 9px",
          display: "inline-flex", alignItems: "center", gap: 4,
          cursor: "help",
        }}
      >
        <span style={{ fontSize: 10 }}>✕</span> EMAIL FAILED
      </span>
    );
  }

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      background: "rgba(100,116,139,0.08)", color: "#64748B",
      border: "1px solid rgba(100,116,139,0.2)",
      borderRadius: 100, padding: "3px 9px",
      display: "inline-block",
    }}>
      NOT SENT
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
    { label: "Location", value: reg.location || "—" },
    { label: "Qualification", value: reg.qualification || "—" },
    { label: "Course Name", value: reg.courseName || reg.masterclassId?.title || "CCTV Masterclass" },
    { label: "Registration ID", value: reg.registrationId || reg.enrollmentId || "—", mono: true },
    { label: "Enrollment ID", value: reg.enrollmentId || "—", mono: true },
    { label: "Payment Status", value: <StatusBadge status={reg.paymentStatus} /> },
    { label: "Amount", value: reg.amount ? `₹${reg.amount}` : "₹499" },
    { label: "Razorpay Order ID", value: reg.razorpayOrderId || "—", mono: true, small: true },
    { label: "Razorpay Payment ID", value: reg.razorpayPaymentId || "—", mono: true, small: true },
    { label: "Zoom Status", value: <ZoomBadge sent={reg.zoomLinkSent} status={reg.zoomLinkEmailStatus} error={reg.zoomLinkEmailError} sentAt={reg.zoomLinkSentAt} /> },
    { label: "Zoom Sent At", value: formatDateTime(reg.zoomLinkSentAt) },
    { label: "Zoom Link", value: reg.zoomMeetingLink ? <a href={reg.zoomMeetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0284C7', wordBreak: 'break-all' }}>{reg.zoomMeetingLink}</a> : "—" },
    { label: "Registered At", value: formatDateTime(reg.createdAt) },
    { label: "Paid At", value: formatDateTime(reg.paidAt) },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(10,15,30,0.4)", backdropFilter: "blur(4px)",
        display: "flex", justifyContent: "flex-end",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
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
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0A0F1E" }}>{reg.name}</div>
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
                fontSize: small ? 11 : 13, fontWeight: 700, color: "#0A0F1E",
                fontFamily: mono ? "monospace" : "inherit",
                textAlign: "right", wordBreak: "break-word",
              }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Send Zoom Modal ─────────────────────────────────────────────────────────
function SendZoomModal({ selectedStudents, onClose, onSuccess }) {
  const [zoomLink, setZoomLink] = useState("");
  const [classTitle, setClassTitle] = useState("TechBes CCTV Masterclass");
  const [classDate, setClassDate] = useState("");
  const [classTime, setClassTime] = useState("10:00 AM - 04:00 PM");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [report, setReport] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    setUrlError("");

    const trimmedUrl = zoomLink.trim();
    if (!trimmedUrl) {
      setUrlError("Please enter the Zoom meeting link.");
      return;
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      setUrlError("Please enter a valid HTTP or HTTPS URL (e.g., https://zoom.us/j/1234567890).");
      return;
    }

    setSending(true);

    try {
      const regIds = selectedStudents.map(s => s._id);
      const { payload } = await apiFetch("/api/v2/cctv-course/admin/registrations/bulk-send-zoom", {
        method: "POST",
        body: {
          registrationIds: regIds,
          zoomLink: trimmedUrl,
          classTitle: classTitle.trim(),
          classDate: classDate.trim(),
          classTime: classTime.trim(),
          message: message.trim(),
        },
      });

      setReport({
        total: payload.total,
        sent: payload.sent,
        failed: payload.failed,
        results: payload.results || [],
      });
      onSuccess();
    } catch (err) {
      setUrlError(err.message || "Failed to dispatch Zoom emails.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(10,15,30,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget && !sending) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 520,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#FAFAFA",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#0A0F1E" }}>
              Send Class Link
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#64748B" }}>
              Selected Students: <strong style={{ color: "#0A0F1E" }}>{selectedStudents.length}</strong>
            </p>
          </div>
          {!sending && (
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "1.5px solid #E2E8F0", background: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#64748B", fontSize: 16,
              }}
            >×</button>
          )}
        </div>

        {report ? (
          /* Report View */
          <div style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: report.failed === 0 ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.12)",
              border: `2px solid ${report.failed === 0 ? "rgba(34,197,94,0.3)" : "rgba(234,179,8,0.3)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 26,
              color: report.failed === 0 ? "#16A34A" : "#D97706",
            }}>
              {report.failed === 0 ? "✓" : "⚠"}
            </div>

            <h4 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#0A0F1E" }}>
              {report.failed === 0 ? "All Emails Dispatched!" : "Dispatch Completed with Warnings"}
            </h4>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>
              ✓ {report.sent} sent successfully {report.failed > 0 && `• ✕ ${report.failed} failed`}
            </p>

            {report.results.length > 0 && (
              <div style={{
                maxHeight: 180, overflowY: "auto",
                background: "#F8FAFC", border: "1px solid #E2E8F0",
                borderRadius: 10, padding: "10px 14px",
                textAlign: "left", marginBottom: 20,
              }}>
                {report.results.map((r, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "6px 0", borderBottom: i < report.results.length - 1 ? "1px solid #F1F5F9" : "none",
                    fontSize: 12,
                  }}>
                    <span style={{ color: "#0A0F1E", fontWeight: 600 }}>{r.name} ({r.email})</span>
                    <span style={{ color: r.status === 'SENT' ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                      {r.status === 'SENT' ? '✓ Sent' : '✕ Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "12px",
                background: "#0A0F1E", color: "#fff",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSend} style={{ padding: "20px 24px" }}>
            {urlError && (
              <div style={{
                background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                fontSize: 12.5, color: "#DC2626", fontWeight: 600,
              }}>
                ⚠ {urlError}
              </div>
            )}

            {/* Zoom Meeting Link */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Zoom Meeting Link <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="url"
                required
                disabled={sending}
                placeholder="https://zoom.us/j/1234567890"
                value={zoomLink}
                onChange={e => { setZoomLink(e.target.value); setUrlError(""); }}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: urlError ? "1.5px solid #DC2626" : "1.5px solid #CBD5E1",
                  borderRadius: 8, fontSize: 13, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Optional Class Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Class Title <span style={{ color: "#94A3B8", fontWeight: 500 }}>(Optional)</span>
              </label>
              <input
                type="text"
                disabled={sending}
                value={classTitle}
                onChange={e => setClassTitle(e.target.value)}
                placeholder="TechBes CCTV Masterclass"
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1.5px solid #CBD5E1", borderRadius: 8,
                  fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Date and Time Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Class Date <span style={{ color: "#94A3B8", fontWeight: 500 }}>(Optional)</span>
                </label>
                <input
                  type="date"
                  disabled={sending}
                  value={classDate}
                  onChange={e => setClassDate(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 10px",
                    border: "1.5px solid #CBD5E1", borderRadius: 8,
                    fontSize: 13, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Class Time <span style={{ color: "#94A3B8", fontWeight: 500 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  disabled={sending}
                  placeholder="10:00 AM - 04:00 PM"
                  value={classTime}
                  onChange={e => setClassTime(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 10px",
                    border: "1.5px solid #CBD5E1", borderRadius: 8,
                    fontSize: 13, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Custom Message */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Custom Message / Instructions <span style={{ color: "#94A3B8", fontWeight: 500 }}>(Optional)</span>
              </label>
              <textarea
                disabled={sending}
                rows={3}
                placeholder="e.g. Please bring your laptop with software installed..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1.5px solid #CBD5E1", borderRadius: 8,
                  fontSize: 13, outline: "none", boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                disabled={sending}
                onClick={onClose}
                style={{
                  padding: "10px 18px", borderRadius: 8,
                  border: "1.5px solid #E2E8F0", background: "#fff",
                  color: "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                style={{
                  padding: "10px 22px", borderRadius: 8,
                  border: "none", background: "#0A0F1E",
                  color: "#fff", fontWeight: 800, fontSize: 13,
                  cursor: sending ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {sending ? "Sending..." : `Send Link (${selectedStudents.length})`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Resend Confirmation Modal ───────────────────────────────────────────────
function ResendConfirmModal({ student, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 700,
        background: "rgba(10,15,30,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#fff", borderRadius: 14,
        padding: "24px", textAlign: "center",
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(234,179,8,0.12)", border: "1.5px solid rgba(234,179,8,0.3)",
          color: "#D97706", fontSize: 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          ↻
        </div>

        <h4 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900, color: "#0A0F1E" }}>
          Resend Zoom Class Link?
        </h4>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
          Send the class link again to <strong>{student.name}</strong> ({student.email})?
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px", borderRadius: 8,
              border: "1.5px solid #E2E8F0", background: "#fff",
              color: "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "10px", borderRadius: 8,
              border: "none", background: "#0A0F1E",
              color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer",
            }}
          >
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export function CctvMasterclassPage() {
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, failed: 0, zoomSent: 0, revenue: 0 });
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [zoomFilter, setZoomFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReg, setSelectedReg] = useState(null);
  const [error, setError] = useState("");
  const searchTimeout = useRef(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [modalTargetStudents, setModalTargetStudents] = useState([]);
  const [resendTargetStudent, setResendTargetStudent] = useState(null);

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
        zoomSent: d.zoomSent || 0,
        revenue: d.revenue || 0,
      });
    } catch {}
  }, []);

  // ── Fetch registrations ──
  const fetchRegs = useCallback(async (
    currentPage = 1,
    s = search,
    st = statusFilter,
    zf = zoomFilter,
    df = dateFrom,
    dt = dateTo
  ) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: "20" });
      if (s) params.set("search", s);
      if (st) params.set("status", st);
      if (zf) params.set("zoomStatus", zf);
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
  }, [search, statusFilter, zoomFilter, dateFrom, dateTo]);

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
      fetchRegs(1, val, statusFilter, zoomFilter, dateFrom, dateTo);
    }, 400);
  };

  const applyFilters = () => {
    setPage(1);
    fetchRegs(1, search, statusFilter, zoomFilter, dateFrom, dateTo);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setZoomFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    fetchRegs(1, "", "", "", "", "");
  };

  const goToPage = (p) => {
    setPage(p);
    fetchRegs(p);
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = () => {
    const pageIds = registrations.map(r => r._id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllPaid = () => {
    const paidIds = registrations.filter(r => r.paymentStatus === 'PAID').map(r => r._id);
    setSelectedIds(paidIds);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Open Zoom Modal for selected
  const handleOpenBulkZoomModal = () => {
    const targets = registrations.filter(r => selectedIds.includes(r._id));
    if (targets.length === 0) return;
    setModalTargetStudents(targets);
    setZoomModalOpen(true);
  };

  // Open Zoom Modal for single student
  const handleOpenSingleZoom = (student) => {
    if (student.zoomLinkSent) {
      // Resend confirmation
      setResendTargetStudent(student);
    } else {
      setModalTargetStudents([student]);
      setZoomModalOpen(true);
    }
  };

  const handleConfirmResend = () => {
    if (resendTargetStudent) {
      setModalTargetStudents([resendTargetStudent]);
      setResendTargetStudent(null);
      setZoomModalOpen(true);
    }
  };

  const isAllOnPageSelected =
    registrations.length > 0 && registrations.every(r => selectedIds.includes(r._id));

  const statCards = [
    { label: "Total Registrations", value: stats.total,    icon: "👥", color: "#6366F1" },
    { label: "Paid Students",       value: stats.paid,     icon: "✅", color: "#16A34A" },
    { label: "Pending Payment",     value: stats.pending,  icon: "⏳", color: "#D97706" },
    { label: "Zoom Links Sent",     value: stats.zoomSent, icon: "📹", color: "#0EA5E9" },
    {
      label: "Total Revenue",
      value: `₹${stats.revenue.toLocaleString("en-IN")}`,
      icon: "💰",
      color: "#10B981",
    },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
          CCTV Course Platform
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0A0F1E", margin: 0, letterSpacing: "-0.02em" }}>
          CCTV Masterclass Registrations
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
          Manage enrolled students, verify payments, and dispatch live Zoom class meeting links
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 14,
        marginBottom: 24,
      }}>
        {statCards.map(sc => <StatCard key={sc.label} {...sc} />)}
      </div>

      {/* ── Bulk Actions Toolbar ── */}
      {selectedIds.length > 0 && (
        <div style={{
          background: "#0A0F1E",
          color: "#fff",
          borderRadius: 12,
          padding: "12px 20px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 4px 20px rgba(10,15,30,0.15)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              background: "#F5C218", color: "#0A0F1E",
              fontSize: 12, fontWeight: 900, padding: "3px 10px",
              borderRadius: 100,
            }}>
              {selectedIds.length} Selected
            </span>
            <span style={{ fontSize: 13, color: "#CBD5E1" }}>
              Students selected for class link dispatch
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleOpenBulkZoomModal}
              style={{
                background: "#22C55E", color: "#0A0F1E",
                border: "none", borderRadius: 8,
                padding: "8px 18px", fontSize: 13, fontWeight: 800,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              📹 Send Zoom Class Link
            </button>
            <button
              onClick={handleClearSelection}
              style={{
                background: "transparent", color: "#94A3B8",
                border: "1px solid #334155", borderRadius: 8,
                padding: "8px 14px", fontSize: 12.5, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

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
                background: "#FAFAFA", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Payment Status Filter */}
        <div style={{ flex: "0 1 150px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            Payment
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
            <option value="">All Payments</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        {/* Zoom Status Filter */}
        <div style={{ flex: "0 1 150px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            Zoom Status
          </label>
          <select
            value={zoomFilter}
            onChange={e => setZoomFilter(e.target.value)}
            style={{
              width: "100%", padding: "8px 10px",
              border: "1.5px solid #E2E8F0", borderRadius: 8,
              fontSize: 13, color: "#0A0F1E", background: "#FAFAFA", outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">All Zoom Status</option>
            <option value="SENT">ZOOM SENT</option>
            <option value="NOT_SENT">ZOOM NOT SENT</option>
            <option value="FAILED">EMAIL FAILED</option>
          </select>
        </div>

        {/* Date from */}
        <div style={{ flex: "0 1 140px" }}>
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
        <div style={{ flex: "0 1 140px" }}>
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

      {/* ── Table Container ── */}
      <div style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {/* Table header toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid #F1F5F9",
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0A0F1E" }}>
              Registered Students
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#64748B",
              background: "#F1F5F9", borderRadius: 100, padding: "2px 9px",
            }}>
              {pagination.total} Total
            </span>
            <button
              onClick={handleSelectAllPaid}
              style={{
                fontSize: 11.5, fontWeight: 700, color: "#16A34A",
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 6, padding: "3px 10px", cursor: "pointer",
              }}
            >
              Select All Paid
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => { fetchStats(); fetchRegs(page); }}
              style={{
                fontSize: 12, fontWeight: 700, color: "#0EA5E9",
                background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
                borderRadius: 7, padding: "6px 14px", cursor: "pointer",
              }}
            >
              ↻ Refresh
            </button>
          </div>
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
            No course registrations found matching the criteria.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ width: 42, padding: "10px 14px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isAllOnPageSelected}
                      onChange={handleSelectAllOnPage}
                      style={{ width: 16, height: 16, accentColor: "#0A0F1E", cursor: "pointer" }}
                      title="Select all on this page"
                    />
                  </th>
                  {["ID", "Student", "Mobile", "Email", "Course", "Payment", "Amount", "Zoom Link", "Date"].map(h => (
                    <th key={h} style={{
                      padding: "10px 12px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: "#64748B",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                  <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, idx) => {
                  const isSelected = selectedIds.includes(reg._id);
                  return (
                    <tr
                      key={reg._id}
                      style={{
                        borderBottom: "1px solid #F8FAFC",
                        background: isSelected ? "rgba(245,194,24,0.06)" : (idx % 2 === 0 ? "#fff" : "#FAFAFA"),
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F0F9FF"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA"; }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: "11px 14px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(reg._id)}
                          style={{ width: 16, height: 16, accentColor: "#0A0F1E", cursor: "pointer" }}
                        />
                      </td>

                      {/* Registration / Enrollment ID */}
                      <td style={{ padding: "11px 12px", fontSize: 12, fontFamily: "monospace", color: "#D97706", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {reg.enrollmentId || reg.registrationId || "—"}
                      </td>

                      {/* Student Name */}
                      <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 700, color: "#0A0F1E", whiteSpace: "nowrap" }}>
                        {reg.name}
                      </td>

                      {/* Mobile */}
                      <td style={{ padding: "11px 12px", fontSize: 12.5, color: "#475569", whiteSpace: "nowrap" }}>
                        {reg.mobile}
                      </td>

                      {/* Email */}
                      <td style={{ padding: "11px 12px", fontSize: 12, color: "#475569", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {reg.email}
                      </td>

                      {/* Course */}
                      <td style={{ padding: "11px 12px", fontSize: 12, color: "#475569", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {reg.courseName || reg.masterclassId?.title || "CCTV Masterclass"}
                      </td>

                      {/* Payment Status */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                        <StatusBadge status={reg.paymentStatus} />
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 700, color: "#0A0F1E", whiteSpace: "nowrap" }}>
                        {reg.amount ? `₹${reg.amount}` : "₹499"}
                      </td>

                      {/* Zoom Link Status */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                        <ZoomBadge
                          sent={reg.zoomLinkSent}
                          status={reg.zoomLinkEmailStatus}
                          error={reg.zoomLinkEmailError}
                          sentAt={reg.zoomLinkSentAt}
                        />
                      </td>

                      {/* Date */}
                      <td style={{ padding: "11px 12px", fontSize: 11.5, color: "#64748B", whiteSpace: "nowrap" }}>
                        {formatDate(reg.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "11px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            onClick={() => setSelectedReg(reg)}
                            style={{
                              padding: "5px 10px",
                              background: "rgba(99,102,241,0.08)",
                              border: "1px solid rgba(99,102,241,0.2)",
                              borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#6366F1",
                              cursor: "pointer",
                            }}
                          >
                            View
                          </button>

                          <button
                            onClick={() => handleOpenSingleZoom(reg)}
                            style={{
                              padding: "5px 10px",
                              background: reg.zoomLinkSent ? "rgba(14,165,233,0.08)" : "rgba(34,197,94,0.08)",
                              border: `1px solid ${reg.zoomLinkSent ? "rgba(14,165,233,0.25)" : "rgba(34,197,94,0.25)"}`,
                              borderRadius: 6, fontSize: 12, fontWeight: 700,
                              color: reg.zoomLinkSent ? "#0284C7" : "#16A34A",
                              cursor: "pointer",
                            }}
                          >
                            {reg.zoomLinkSent ? "Resend Link" : "Send Link"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* ── Detail Drawer ── */}
      {selectedReg && (
        <DetailDrawer reg={selectedReg} onClose={() => setSelectedReg(null)} />
      )}

      {/* ── Zoom Modal ── */}
      {zoomModalOpen && (
        <SendZoomModal
          selectedStudents={modalTargetStudents}
          onClose={() => setZoomModalOpen(false)}
          onSuccess={() => {
            fetchStats();
            fetchRegs(page);
          }}
        />
      )}

      {/* ── Resend Confirmation Modal ── */}
      {resendTargetStudent && (
        <ResendConfirmModal
          student={resendTargetStudent}
          onConfirm={handleConfirmResend}
          onCancel={() => setResendTargetStudent(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
