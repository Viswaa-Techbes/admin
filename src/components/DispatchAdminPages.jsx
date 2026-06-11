/**
 * DispatchAdminPages.jsx
 * ======================
 * Phase 2 Admin pages:
 * - DispatchMonitorPage   → Real-time view of all job dispatches
 * - CancellationsPage     → Review customer cancellations + tech penalties
 * - TechPerformancePage   → Technician dispatch profiles & metrics
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Card, TableWrapper, Avatar, ActionBtn, SectionHeader, useToast, Modal } from "./UI";
import { apiFetch } from "../lib/apiClient";

const LABEL_STYLE = { fontSize: 12, fontWeight: 700, color: "#475569" };
const INPUT_STYLE = { padding: "10px 12px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 13 };
const TD_STYLE = { padding: "12px 14px", fontSize: 12.5, color: "#475569" };
const primaryButton = { border: "none", borderRadius: 12, background: "#4f46e5", color: "#fff", fontWeight: 700, padding: "10px 16px", cursor: "pointer" };
const approveButton = { border: "none", borderRadius: 10, background: "#dcfce7", color: "#15803d", fontWeight: 700, padding: "8px 12px", cursor: "pointer" };
const rejectButton = { border: "none", borderRadius: 10, background: "#fee2e2", color: "#b91c1c", fontWeight: 700, padding: "8px 12px", cursor: "pointer" };
const pillButton = (active) => ({ padding: "6px 14px", borderRadius: 99, background: active ? "#6366f1" : "#fff", color: active ? "#fff" : "#64748b", fontWeight: 700, cursor: "pointer", border: "1px solid #e2e8f0" });

function formatDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function useApiData(url) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(url);
      const list = res?.data || res?.payload?.data || res || [];
      setData(Array.isArray(list) ? list : []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPATCH MONITOR PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function DispatchMonitorPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overrideModal, setOverrideModal] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState("");
  const [overriding, setOverriding] = useState(false);
  const [overrideError, setOverrideError] = useState("");
  const showToast = useToast();

  const DS_COLORS = {
    pending_dispatch: { bg: "#fef3c7", color: "#92400e" },
    dispatching: { bg: "#dbeafe", color: "#1e40af" },
    assigned: { bg: "#d1fae5", color: "#065f46" },
    no_tech_found: { bg: "#fee2e2", color: "#991b1b" },
  };

  const AM_COLORS = {
    AUTO: { bg: "#ede9fe", color: "#5b21b6" },
    MANUAL: { bg: "#fce7f3", color: "#831843" },
    ACCEPTED: { bg: "#d1fae5", color: "#065f46" },
    FALLBACK: { bg: "#fff7ed", color: "#9a3412" },
  };

  async function loadJobs() {
    try {
      const res = await apiFetch("/api/v2/admin/service-requests?limit=200");
      const list = res?.data || res?.payload?.data || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTechs() {
    try {
      const res = await apiFetch("/api/v2/admin/users");
      const list = res?.data || res?.payload?.data || [];
      setTechnicians((Array.isArray(list) ? list : []).filter((u) => u.role === "technician"));
    } catch {}
  }

  async function retryDispatch(jobId) {
    try {
      await apiFetch(`/api/v2/dispatch/retry/${jobId}`, { method: "POST" });
      showToast("Dispatch retried!");
      loadJobs();
    } catch (err) {
      showToast(err.message, { duration: 4000 });
    }
  }

  async function handleOverride() {
    if (!selectedTech) { setOverrideError("Select a technician"); return; }
    setOverriding(true);
    setOverrideError("");
    try {
      await apiFetch(`/api/v2/dispatch/override/${overrideModal._id || overrideModal.id}`, {
        method: "POST",
        body: { technicianId: selectedTech },
      });
      showToast("Technician override applied!");
      setOverrideModal(null);
      loadJobs();
    } catch (err) {
      setOverrideError(err.message);
    } finally {
      setOverriding(false);
    }
  }

  useEffect(() => { loadJobs(); loadTechs(); }, []);
  useEffect(() => {
    const t = setInterval(loadJobs, 8000);
    return () => clearInterval(t);
  }, []);

  const noTech = jobs.filter((j) => j.dispatchStatus === "no_tech_found");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader
        title="🚀 Dispatch Monitor"
        subtitle={`${jobs.length} total requests · live auto-refresh every 8s`}
        actions={<button onClick={loadJobs} style={primaryButton}>↺ Refresh Now</button>}
      />

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "Total Requests", value: jobs.length, c: "#6366f1" },
          { label: "Dispatching", value: jobs.filter((j) => j.dispatchStatus === "dispatching").length, c: "#f59e0b" },
          { label: "No Tech Found", value: noTech.length, c: "#ef4444" },
          { label: "Assigned", value: jobs.filter((j) => j.assignedTechnician).length, c: "#10b981" },
        ].map((k, i) => (
          <Card key={i} style={{ padding: 16, borderLeft: `4px solid ${k.c}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: k.c, marginTop: 4 }}>{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Alert: no tech found */}
      {noTech.length > 0 && (
        <Card style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>
            ⚠️ {noTech.length} job(s) need manual assignment!
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {noTech.map((j) => (
              <button
                key={j._id}
                onClick={() => { setOverrideModal(j); setSelectedTech(""); setOverrideError(""); }}
                style={{ ...primaryButton, background: "#ef4444", padding: "6px 12px", fontSize: 12 }}
              >
                Assign: {j.customerName} – {j.serviceName || j.title}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Main table */}
      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading dispatch data...</div>
        ) : error ? (
          <div style={{ padding: 40, color: "#ef4444" }}>{error}</div>
        ) : (
          <TableWrapper
            headers={["Customer", "Service", "Dispatch Status", "Method", "Assigned To", "Attempts", "Date", "Actions"]}
            rows={jobs.map((j) => {
              const dsc = DS_COLORS[j.dispatchStatus] || { bg: "#f1f5f9", color: "#475569" };
              const amc = AM_COLORS[j.assignmentMethod] || { bg: "#f1f5f9", color: "#475569" };
              return (
                <tr key={j._id || j.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={TD_STYLE}>
                    <div style={{ fontWeight: 700 }}>{j.customerName || "—"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{j.customerPhone}</div>
                  </td>
                  <td style={TD_STYLE}>{j.serviceName || j.title || "—"}</td>
                  <td style={TD_STYLE}>
                    <span style={{ ...dsc, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                      {(j.dispatchStatus || "not dispatched").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={TD_STYLE}>
                    {j.assignmentMethod ? (
                      <span style={{ ...amc, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{j.assignmentMethod}</span>
                    ) : "—"}
                  </td>
                  <td style={TD_STYLE}>
                    {j.assignedTechnician?.name || (
                      <span style={{ color: "#f59e0b", fontWeight: 600 }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: "center" }}>{j.dispatchAttempts || 0}</td>
                  <td style={TD_STYLE}>{formatDate(j.createdAt)}</td>
                  <td style={TD_STYLE}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(!j.assignedTechnician || j.dispatchStatus === "no_tech_found") && (
                        <button
                          onClick={() => retryDispatch(j._id || j.id)}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #6366f1", background: "#eef2ff", color: "#4338ca", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => { setOverrideModal(j); setSelectedTech(""); setOverrideError(""); }}
                        style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #f59e0b", background: "#fffbeb", color: "#b45309", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        {j.assignedTechnician ? "Reassign" : "Override"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          />
        )}
      </Card>

      {/* Override Modal */}
      {overrideModal && (
        <Modal open={true} onClose={() => setOverrideModal(null)} title={`Assign Technician — ${overrideModal.customerName}`}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{overrideModal.serviceName || overrideModal.title}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{overrideModal.location || "—"}</div>
            </div>
            <div>
              <label style={LABEL_STYLE}>Select Technician</label>
              <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} style={{ ...INPUT_STYLE, width: "100%", marginTop: 6 }}>
                <option value="">-- Choose technician --</option>
                {technicians.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.availabilityStatus || "OFFLINE"}) ★{t.rating || 5}
                  </option>
                ))}
              </select>
            </div>
            {overrideError && <div style={{ color: "#ef4444", fontSize: 13 }}>{overrideError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setOverrideModal(null)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleOverride} disabled={overriding} style={primaryButton}>{overriding ? "Assigning..." : "Assign Technician"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANCELLATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function CancellationsPage() {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [penaltyAmt, setPenaltyAmt] = useState("");
  const [processing, setProcessing] = useState(false);
  const showToast = useToast();

  async function loadAll() {
    setLoading(true);
    try {
      const [p, h, pen] = await Promise.allSettled([
        apiFetch("/api/v2/cancellations/pending"),
        apiFetch("/api/v2/cancellations/history"),
        apiFetch("/api/v2/cancellations/technician-penalties"),
      ]);
      if (p.status === "fulfilled") setPending(p.value?.data || []);
      if (h.status === "fulfilled") setHistory(h.value?.data || []);
      if (pen.status === "fulfilled") setPenalties(pen.value?.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    if (!actionModal) return;
    setProcessing(true);
    try {
      await apiFetch(`/api/v2/cancellations/admin/${actionModal._id || actionModal.id}`, {
        method: "POST",
        body: { action, adminNote, penaltyAmount: parseFloat(penaltyAmt) || 0 },
      });
      showToast(action === "approve" ? "✅ Cancellation approved" : "❌ Cancellation rejected");
      setActionModal(null);
      setAdminNote("");
      setPenaltyAmt("");
      loadAll();
    } catch (err) {
      showToast(err.message, { duration: 4000 });
    } finally {
      setProcessing(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader title="🚫 Cancellations" subtitle="Review customer cancellation requests & technician penalties" />

      <div style={{ display: "flex", gap: 8 }}>
        {[{ id: "pending", label: `Pending (${pending.length})` }, { id: "history", label: "History" }, { id: "penalties", label: "Tech Penalties" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={pillButton(tab === t.id)}>{t.label}</button>
        ))}
      </div>

      {loading && <Card style={{ padding: 20, color: "#64748b" }}>Loading...</Card>}

      {/* Pending Requests */}
      {!loading && tab === "pending" && (
        pending.length === 0 ? (
          <Card style={{ padding: 40, textAlign: "center", color: "#64748b" }}>✅ No pending cancellation requests</Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 16 }}>
            {pending.map((j) => (
              <Card key={j._id} style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{j.customerName || j.client?.name}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{j.serviceName || j.title}</div>
                  </div>
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>PENDING</span>
                </div>
                <div style={{ background: "#fef9c3", padding: 10, borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>Customer Reason:</div>
                  <div style={{ fontSize: 13 }}>{j.cancellation?.reason || "No reason provided"}</div>
                </div>
                {j.assignedTechnician && (
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Assigned to: <strong>{j.assignedTechnician?.name}</strong></div>
                )}
                <button
                  onClick={() => { setActionModal(j); setAdminNote(""); setPenaltyAmt(""); }}
                  style={{ width: "100%", ...primaryButton, padding: "8px" }}
                >
                  Review & Decide
                </button>
              </Card>
            ))}
          </div>
        )
      )}

      {/* History */}
      {!loading && tab === "history" && (
        <Card style={{ padding: 0 }}>
          {history.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>No cancellation history</div>
          ) : (
            <TableWrapper
              headers={["Customer", "Service", "Cancelled By", "Reason", "Decision", "Penalty", "Date"]}
              rows={history.map((j) => (
                <tr key={j._id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={TD_STYLE}>{j.customerName || j.client?.name || "—"}</td>
                  <td style={TD_STYLE}>{j.serviceName || j.title || "—"}</td>
                  <td style={TD_STYLE}>
                    <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: j.cancellation?.cancelledBy === "technician" ? "#fee2e2" : "#ede9fe", color: j.cancellation?.cancelledBy === "technician" ? "#991b1b" : "#5b21b6" }}>
                      {j.cancellation?.cancelledBy || "unknown"}
                    </span>
                  </td>
                  <td style={{ ...TD_STYLE, maxWidth: 180 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.cancellation?.reason || "—"}</div>
                  </td>
                  <td style={TD_STYLE}>
                    <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: j.cancellation?.approvedByAdmin ? "#d1fae5" : "#fee2e2", color: j.cancellation?.approvedByAdmin ? "#065f46" : "#991b1b" }}>
                      {j.cancellation?.approvedByAdmin === true ? "Approved" : "Rejected"}
                    </span>
                  </td>
                  <td style={{ ...TD_STYLE, color: "#dc2626", fontWeight: 700 }}>
                    {j.cancellation?.penaltyAmount > 0 ? `₹${j.cancellation.penaltyAmount}` : "—"}
                  </td>
                  <td style={TD_STYLE}>{formatDate(j.cancellation?.cancelledAt || j.updatedAt)}</td>
                </tr>
              ))}
            />
          )}
        </Card>
      )}

      {/* Tech Penalties */}
      {!loading && tab === "penalties" && (
        <Card style={{ padding: 0 }}>
          {penalties.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>No penalty records</div>
          ) : (
            <TableWrapper
              headers={["Technician", "Phone", "Penalty Points", "Performance Score", "Total ₹", "Recent Reason"]}
              rows={penalties.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={TD_STYLE}><div style={{ fontWeight: 700 }}>{t.name}</div></td>
                  <td style={TD_STYLE}>{t.phone}</td>
                  <td style={{ ...TD_STYLE, color: t.penaltyPoints > 3 ? "#dc2626" : "#475569", fontWeight: 700 }}>{t.penaltyPoints}</td>
                  <td style={TD_STYLE}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${t.performanceScore}%`, background: t.performanceScore >= 80 ? "#10b981" : "#ef4444", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{t.performanceScore}%</span>
                    </div>
                  </td>
                  <td style={{ ...TD_STYLE, color: "#dc2626", fontWeight: 700 }}>₹{t.totalPenaltyAmount}</td>
                  <td style={{ ...TD_STYLE, fontSize: 11, color: "#64748b" }}>{t.penalties?.[0]?.reason?.substring(0, 50) || "—"}</td>
                </tr>
              ))}
            />
          )}
        </Card>
      )}

      {/* Action Modal */}
      {actionModal && (
        <Modal open={true} onClose={() => setActionModal(null)} title="Review Cancellation Request">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{actionModal.serviceName || actionModal.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Customer: {actionModal.customerName}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Reason: {actionModal.cancellation?.reason || "Not provided"}</div>
            </div>
            <div>
              <label style={LABEL_STYLE}>Admin Note</label>
              <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} style={{ ...INPUT_STYLE, width: "100%", marginTop: 6, resize: "none" }} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Customer Penalty ₹ (optional)</label>
              <input type="number" value={penaltyAmt} onChange={(e) => setPenaltyAmt(e.target.value)} placeholder="0" style={{ ...INPUT_STYLE, width: "100%", marginTop: 6 }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setActionModal(null)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", cursor: "pointer" }}>Close</button>
              <button onClick={() => handleAction("reject")} disabled={processing} style={{ ...rejectButton, padding: "8px 16px" }}>Reject</button>
              <button onClick={() => handleAction("approve")} disabled={processing} style={{ ...approveButton, padding: "8px 16px" }}>Approve</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TECHNICIAN PERFORMANCE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function TechPerformancePage() {
  const { data: users, loading, error, refresh } = useApiData("/api/v2/admin/users");
  const { data: jobs } = useApiData("/api/v2/admin/jobs");
  const [editingTech, setEditingTech] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const showToast = useToast();

  const technicians = useMemo(() => (Array.isArray(users) ? users : []).filter((u) => u.role === "technician"), [users]);

  const techStats = useMemo(() => technicians.map((tech) => {
    const tJobs = (Array.isArray(jobs) ? jobs : []).filter((j) =>
      j.assignedTechnician?._id === tech._id ||
      j.assignedTechnician === tech._id ||
      j.technicianId === tech._id
    );
    return {
      ...tech,
      totalJobs: tJobs.length,
      completed: tJobs.filter((j) => ["completed", "payment_done", "closed"].includes(j.status)).length,
      active: tJobs.filter((j) => ["assigned", "in_progress", "started"].includes(j.status)).length,
      totalRevenue: tJobs
        .filter((j) => j.status === "completed")
        .reduce((acc, j) => acc + (j.totalAmount || j.amount || j.price || 0), 0),
    };
  }).sort((a, b) => b.completed - a.completed), [technicians, jobs]);

  async function save() {
    if (!editingTech) return;
    setSaving(true);
    try {
      const pin = typeof editForm.pincodeCoverage === "string"
        ? editForm.pincodeCoverage.split(",").map((s) => s.trim()).filter(Boolean)
        : editForm.pincodeCoverage || [];
      const cat = typeof editForm.serviceCategories === "string"
        ? editForm.serviceCategories.split(",").map((s) => s.trim()).filter(Boolean)
        : editForm.serviceCategories || [];
      await apiFetch(`/api/v2/admin/users/${editingTech._id}`, {
        method: "PUT",
        body: { ...editForm, pincodeCoverage: pin, serviceCategories: cat },
      });
      showToast("Dispatch profile saved!");
      setEditingTech(null);
      await refresh();
    } catch (err) {
      showToast(err.message, { duration: 4000 });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader title="🏆 Technician Performance" subtitle="Dispatch profiles, metrics & earnings tracker" />

      {loading && <Card style={{ padding: 20 }}>Loading...</Card>}
      {error && <Card style={{ padding: 20, color: "#ef4444" }}>{error}</Card>}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16 }}>
          {techStats.map((tech) => (
            <Card key={tech._id} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  {tech.profilePhoto ? (
                    <img src={tech.profilePhoto} alt={tech.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <Avatar initials={(tech.name || "T").substring(0, 2).toUpperCase()} size={48} gradient="linear-gradient(135deg,#6366f1,#06b6d4)" />
                  )}
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: tech.availabilityStatus === "ONLINE" ? "#10b981" : tech.availabilityStatus === "BUSY" ? "#f59e0b" : "#94a3b8", border: "2px solid #fff" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{tech.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{tech.phone}</div>
                  <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: tech.availabilityStatus === "ONLINE" ? "#d1fae5" : "#f1f5f9", color: tech.availabilityStatus === "ONLINE" ? "#065f46" : "#475569" }}>
                    {tech.availabilityStatus || "OFFLINE"}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#6366f1" }}>★ {tech.rating?.toFixed(1) || "5.0"}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
                {[{ l: "Done", v: tech.completed, c: "#10b981" }, { l: "Active", v: tech.active, c: "#f59e0b" }, { l: "Revenue", v: `₹${(tech.totalRevenue || 0).toLocaleString()}`, c: "#6366f1" }].map((s, i) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, color: s.c, fontSize: 15 }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Performance bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Performance Score</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{tech.performanceScore || 100}%</span>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${tech.performanceScore || 100}%`, background: (tech.performanceScore || 100) >= 80 ? "#10b981" : "#ef4444", borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>

              {tech.pincodeCoverage?.length > 0 && (
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                  📍 {tech.pincodeCoverage.slice(0, 4).join(", ")}{tech.pincodeCoverage.length > 4 ? ` +${tech.pincodeCoverage.length - 4}` : ""}
                </div>
              )}
              {tech.serviceCategories?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                  {tech.serviceCategories.slice(0, 3).map((c, i) => (
                    <span key={i} style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600 }}>{c}</span>
                  ))}
                </div>
              )}
              {tech.penaltyPoints > 0 && (
                <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontSize: 12, color: "#be123c", fontWeight: 700 }}>
                  ⚠️ {tech.penaltyPoints} penalty point(s)
                </div>
              )}

              <button
                onClick={() => {
                  setEditingTech(tech);
                  setEditForm({
                    availabilityStatus: tech.availabilityStatus || "OFFLINE",
                    serviceCategories: (tech.serviceCategories || []).join(", "),
                    pincodeCoverage: (tech.pincodeCoverage || []).join(", "),
                    rating: tech.rating || 5,
                    specialty: tech.specialty || "",
                  });
                }}
                style={{ width: "100%", ...primaryButton, padding: "8px", fontSize: 13 }}
              >
                Edit Dispatch Profile
              </button>
            </Card>
          ))}
        </div>
      )}

      {editingTech && (
        <Modal open={true} onClose={() => setEditingTech(null)} title={`Dispatch Profile — ${editingTech.name}`}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={LABEL_STYLE}>Availability</label>
              <select value={editForm.availabilityStatus} onChange={(e) => setEditForm({ ...editForm, availabilityStatus: e.target.value })} style={{ ...INPUT_STYLE, width: "100%", marginTop: 6 }}>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="BUSY">BUSY</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Specialty</label>
              <input value={editForm.specialty} onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} placeholder="e.g. CCTV Installation" style={{ ...INPUT_STYLE, width: "100%", marginTop: 6 }} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Service Categories (comma-separated)</label>
              <input value={editForm.serviceCategories} onChange={(e) => setEditForm({ ...editForm, serviceCategories: e.target.value })} placeholder="cctv-installation, cctv-repair, networking" style={{ ...INPUT_STYLE, width: "100%", marginTop: 6 }} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Pincode Coverage (comma-separated)</label>
              <textarea value={editForm.pincodeCoverage} onChange={(e) => setEditForm({ ...editForm, pincodeCoverage: e.target.value })} rows={3} style={{ ...INPUT_STYLE, width: "100%", marginTop: 6, resize: "none" }} placeholder="560001, 560002, 560045..." />
            </div>
            <div>
              <label style={LABEL_STYLE}>Rating (0–5)</label>
              <input type="number" min="0" max="5" step="0.1" value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) })} style={{ ...INPUT_STYLE, width: "100%", marginTop: 6 }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingTech(null)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", cursor: "pointer" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={primaryButton}>{saving ? "Saving..." : "Save Profile"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
