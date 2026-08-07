"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiClient";
import { PageHeader, Card, StatusBadge, useToast, Modal } from "./UI";
import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from "./Icons";

export function AmcManagementPage() {
  const toast = useToast();
  const [stats, setStats] = useState({
    activeCustomers: 0,
    expiringThisMonth: 0,
    expiredCount: 0,
    upcomingVisits: 0,
    completedVisits: 0,
    missedVisits: 0,
    renewalPending: 0,
    renewalCompleted: 0,
  });
  const [contracts, setContracts] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals state
  const [viewContract, setViewContract] = useState(null);
  const [editContract, setEditContract] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    address: "",
    amcPlan: "Silver",
    startDate: new Date().toISOString().substring(0, 10),
  });

  const [editForm, setEditForm] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    amcPlan: "Silver",
    status: "Active",
    assignedEngineer: "",
  });

  // Load stats and contracts
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, contractsRes, techsRes] = await Promise.all([
        apiFetch("/api/v2/amc/dashboard"),
        apiFetch(`/api/v2/amc/contracts?status=${statusFilter === "All" ? "" : statusFilter}&search=${search}`),
        apiFetch("/api/v2/admin/users"),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (contractsRes.success) setContracts(contractsRes.data);
      if (techsRes.success) {
        const usersList = techsRes.data?.data ?? techsRes.data ?? [];
        setTechnicians(usersList.filter(u => u.role === "technician"));
      }
    } catch (err) {
      toast.show("Error fetching AMC details: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiFetch("/api/v2/amc/purchase", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.success) {
        toast.show("AMC Contract created successfully!", "success");
        setShowCreateModal(false);
        loadData();
      } else {
        toast.show(res.message || "Failed to create AMC", "error");
      }
    } catch (err) {
      toast.show(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiFetch(`/api/v2/amc/contracts/${editContract._id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      if (res.success) {
        toast.show("AMC Contract updated successfully!", "success");
        setEditContract(null);
        loadData();
      } else {
        toast.show(res.message || "Failed to update AMC", "error");
      }
    } catch (err) {
      toast.show(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this AMC contract?")) return;
    try {
      const res = await apiFetch(`/api/v2/amc/contracts/${id}`, {
        method: "DELETE",
      });
      if (res.success) {
        toast.show("Contract deleted.", "success");
        loadData();
      }
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  const handleQuickStatus = async (id, status) => {
    try {
      const res = await apiFetch(`/api/v2/amc/contracts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        toast.show(`Contract status updated to ${status}`, "success");
        loadData();
      }
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  const handleScheduleVisit = async (id, dateStr) => {
    if (!dateStr) return;
    try {
      const res = await apiFetch(`/api/v2/amc/contracts/${id}/schedule`, {
        method: "POST",
        body: JSON.stringify({ visitDate: dateStr }),
      });
      if (res.success) {
        toast.show("Checkup visit scheduled!", "success");
        // refresh details
        const updated = await apiFetch(`/api/v2/amc/contracts/${id}`);
        if (updated.success) setViewContract(updated.data);
        loadData();
      }
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  const handleRescheduleVisit = async (contractId, visitId, dateStr) => {
    if (!dateStr) return;
    try {
      const res = await apiFetch(`/api/v2/amc/contracts/${contractId}/reschedule`, {
        method: "POST",
        body: JSON.stringify({ visitId, newDate: dateStr }),
      });
      if (res.success) {
        toast.show("Visit rescheduled!", "success");
        const updated = await apiFetch(`/api/v2/amc/contracts/${contractId}`);
        if (updated.success) setViewContract(updated.data);
        loadData();
      }
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  const handleCancelVisit = async (contractId, visitId, remarks = "Cancelled by Admin") => {
    try {
      const res = await apiFetch(`/api/v2/amc/contracts/${contractId}/cancel-visit`, {
        method: "POST",
        body: JSON.stringify({ visitId, status: "Cancelled", remarks }),
      });
      if (res.success) {
        toast.show("Visit cancelled.", "success");
        const updated = await apiFetch(`/api/v2/amc/contracts/${contractId}`);
        if (updated.success) setViewContract(updated.data);
        loadData();
      }
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  const handleRenew = async (id) => {
    if (!window.confirm("Renew this AMC contract by 1 year?")) return;
    try {
      const res = await apiFetch(`/api/v2/amc/contracts/${id}/renew`, {
        method: "POST",
      });
      if (res.success) {
        toast.show("Contract renewed by 1 year!", "success");
        loadData();
      }
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "#1e293b" }}>
      <PageHeader 
        title="AMC (Annual Maintenance Contract) Management" 
        subtitle="Manage AMC Customers, dedicated engineers, scheduling, checkups, and renewals."
      />

      {/* KPI Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        <Card style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Active AMC Customers</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b" }}>{stats.activeCustomers}</div>
        </Card>
        <Card style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #eab308" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Expiring This Month</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#eab308" }}>{stats.expiringThisMonth}</div>
        </Card>
        <Card style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Expired AMC</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#ef4444" }}>{stats.expiredCount}</div>
        </Card>
        <Card style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Upcoming Visits</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981" }}>{stats.upcomingVisits}</div>
        </Card>
        <Card style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #6366f1" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Completed Visits</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#6366f1" }}>{stats.completedVisits}</div>
        </Card>
        <Card style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: "4px solid #f97316" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Renewal Pending</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#f97316" }}>{stats.renewalPending}</div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input 
            type="text" 
            placeholder="Search by customer name, phone, contract code..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", minWidth: "300px", fontSize: "14px" }}
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px" }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <button 
          onClick={() => {
            setForm({
              customerId: "",
              customerName: "",
              customerPhone: "",
              address: "",
              amcPlan: "Silver",
              startDate: new Date().toISOString().substring(0, 10),
            });
            setShowCreateModal(true);
          }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontWeight: 600, border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)" }}
        >
          <PlusIcon /> Create AMC Record
        </button>
      </div>

      {/* Customer List */}
      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
              <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Contract Code</th>
              <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Customer</th>
              <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Plan & Duration</th>
              <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Visits Completed</th>
              <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Dedicated Engineer</th>
              <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Status</th>
              <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "#64748b", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading AMC Contracts...</td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No AMC records found.</td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr key={c._id} style={{ borderBottom: "1px solid #f1f5f9", hover: { background: "#fafafa" } }}>
                  <td style={{ padding: "16px 20px", fontWeight: 600 }}>{c.contractId}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 600 }}>{c.customerName}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{c.customerPhone}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px", fontSize: "12px" }}>{c.amcPlan}</span>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      Exp: {new Date(c.expiryDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", fontWeight: 600 }}>
                    {c.completedVisits} / {c.totalVisits} visits
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{c.remainingVisits} remaining</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {c.assignedEngineer ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.assignedEngineer.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{c.assignedEngineer.mobileNumber}</div>
                      </div>
                    ) : (
                      <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: 500 }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button 
                        onClick={() => setViewContract(c)} 
                        title="View Visits Timeline"
                        style={{ background: "#f1f5f9", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "inline-flex" }}
                      >
                        <EyeIcon />
                      </button>
                      <button 
                        onClick={() => {
                          setEditContract(c);
                          setEditForm({
                            customerName: c.customerName,
                            customerPhone: c.customerPhone,
                            address: c.address,
                            amcPlan: c.amcPlan,
                            status: c.status,
                            assignedEngineer: c.assignedEngineer?._id || "",
                          });
                        }} 
                        title="Edit AMC"
                        style={{ background: "#f1f5f9", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "inline-flex" }}
                      >
                        <EditIcon />
                      </button>
                      <button 
                        onClick={() => handleRenew(c._id)} 
                        title="Renew 1 Year"
                        style={{ background: "#ecfdf5", color: "#10b981", border: "1px solid #d1fae5", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                      >
                        Renew
                      </button>
                      {c.status === "Active" ? (
                        <button 
                          onClick={() => handleQuickStatus(c._id, "Suspended")} 
                          title="Suspend Contract"
                          style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #ffedd5", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                        >
                          Suspend
                        </button>
                      ) : c.status === "Suspended" ? (
                        <button 
                          onClick={() => handleQuickStatus(c._id, "Active")} 
                          title="Activate Contract"
                          style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #dbeafe", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                        >
                          Activate
                        </button>
                      ) : null}
                      <button 
                        onClick={() => handleDelete(c._id)} 
                        title="Delete AMC Record"
                        style={{ background: "#fef2f2", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "inline-flex" }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <Modal title="Create AMC Contract Record" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Customer Name</label>
              <input 
                type="text" 
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Customer Phone</label>
                <input 
                  type="text" 
                  required
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>AMC Plan</label>
                <select 
                  value={form.amcPlan}
                  onChange={(e) => setForm({ ...form, amcPlan: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Silver">Silver (4 Visits/yr)</option>
                  <option value="Gold">Gold (6 Visits/yr)</option>
                  <option value="Diamond">Diamond (12 Visits/yr)</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Address</label>
              <input 
                type="text" 
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Start Date</label>
              <input 
                type="date" 
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                {submitting ? "Submitting..." : "Submit Record"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editContract && (
        <Modal title={`Edit AMC Record: ${editContract.contractId}`} onClose={() => setEditContract(null)}>
          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Customer Name</label>
              <input 
                type="text" 
                required
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Customer Phone</label>
                <input 
                  type="text" 
                  required
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Plan</label>
                <select 
                  value={editForm.amcPlan}
                  onChange={(e) => setEditForm({ ...editForm, amcPlan: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Address</label>
              <input 
                type="text" 
                required
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Status</label>
                <select 
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Dedicated Engineer</label>
                <select 
                  value={editForm.assignedEngineer}
                  onChange={(e) => setEditForm({ ...editForm, assignedEngineer: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.specialty || "Technician"})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button 
                type="button" 
                onClick={() => setEditContract(null)}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW DETAILS & SCHEDULE TIMELINE MODAL */}
      {viewContract && (
        <Modal title={`Contract Visit Schedule & Timeline: ${viewContract.contractId}`} onClose={() => setViewContract(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{viewContract.customerName}</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>{viewContract.address}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "4px 10px", borderRadius: "6px", fontSize: "13px" }}>
                  {viewContract.amcPlan} Plan
                </span>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#ef4444" }}>Expires: {new Date(viewContract.expiryDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Visit Management Section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h5 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#475569" }}>Checkup Visit Schedule Timeline</h5>
                <button 
                  onClick={() => {
                    const d = prompt("Enter visit date (YYYY-MM-DD):");
                    if (d) handleScheduleVisit(viewContract._id, d);
                  }}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                >
                  + Add Extra Checkup Visit
                </button>
              </div>

              {/* Visits list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {viewContract.visits.map((v, idx) => (
                  <div key={v._id || idx} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: v.status === "Completed" ? "#f0fdf4" : v.status === "Cancelled" ? "#fef2f2" : "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: v.status === "Completed" ? "#d1fae5" : v.status === "Cancelled" ? "#fee2e2" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px" }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px" }}>
                          Checkup Date: {new Date(v.visitDate).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{v.remarks || "No comments."}</div>
                        {v.completionDetails && v.completionDetails.completedAt && (
                          <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 500, marginTop: "2px" }}>
                            Completed on: {new Date(v.completionDetails.completedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: v.status === "Completed" ? "#16a34a" : v.status === "Cancelled" ? "#ef4444" : "#2563eb" }}>
                        {v.status.toUpperCase()}
                      </span>
                      {v.status === "Scheduled" && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button 
                            onClick={() => {
                              const d = prompt("Enter new date (YYYY-MM-DD):", new Date(v.visitDate).toISOString().substring(0, 10));
                              if (d) handleRescheduleVisit(viewContract._id, v._id, d);
                            }}
                            style={{ padding: "4px 8px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
                          >
                            Reschedule
                          </button>
                          <button 
                            onClick={() => handleCancelVisit(viewContract._id, v._id)}
                            style={{ padding: "4px 8px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setViewContract(null)}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
