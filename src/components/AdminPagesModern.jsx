import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from 'next/dynamic';
import { io } from 'socket.io-client';
import { PlusIcon, EditIcon, TrashIcon, KeyIcon } from "./Icons";
import { PageHeader, SearchFilter, Card, TableWrapper, Avatar, StatusBadge, ActionBtn, StarRating, SectionHeader, useToast, Modal } from "./UI";
import AllApplicationsPage from './admission/AllApplicationsPage';
import AdmissionStudentProfilesPage from './admission/StudentProfilesPage';
import AdmissionPaymentStatusPage from './admission/PaymentStatusPage';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { MONTHLY_TREND, SERVICE_DIST, TECH_PERF } from "../lib/data";

const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false });


function useApiData(url, initial = []) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(url, { credentials: "include" });
      let payload;
      try { payload = await res.json(); } catch { payload = {}; }
      if (!res.ok) {
        throw new Error(payload.message || `Request failed (${res.status})`);
      }
      setData(payload.data ?? payload ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [url]);

  return { data, setData, loading, error, refresh: load };
}

export function CustomersPage() {
  const { data: leads, setData: setLeads, loading, error, refresh: refreshLeads } = useApiData("/api/v2/admin/leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [groupByPincode, setGroupByPincode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", pincode: "", status: "Active" });
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const url = editingId ? `/api/v2/admin/leads/${editingId}` : "/api/v2/admin/leads"; // Changed to leads list for POST
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to save lead");
      
      await refreshLeads(); // Refresh to ensure DB state
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", email: "", phone: "", pincode: "", status: "Active" });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(lead) {
    setEditingId(lead._id || lead.id);
    setForm({ name: lead.name, email: lead.email, phone: lead.phone, pincode: lead.pincode, status: lead.status || "Active" });
    setShowForm(true);
  }

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (lead.name || "").toLowerCase().includes(query) ||
      (lead.email || "").toLowerCase().includes(query) ||
      (lead.phone || "").toLowerCase().includes(query) ||
      String(lead.pincode || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
    const plan = lead.plan || lead.service || "";
    const matchesService = serviceFilter === "All" || plan.toLowerCase().includes(serviceFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesService;
  }), [leads, searchQuery, serviceFilter, statusFilter]);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/v2/admin/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
      await refreshLeads(); // Persists state
    } catch (err) {
      alert(err.message);
    }
  }

  const rows = filteredLeads.map((lead, index) => leadRow(lead, index, handleDelete, startEdit));

  return (
    <div className="font-[family-name:var(--font-geist-sans)] max-w-[1400px] mx-auto">
      <PageHeader title="Lead Management" subtitle={`${filteredLeads.length} leads available`} actions={<ActionBtn icon={<PlusIcon />} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({name: "", email: "", phone: "", pincode: "", status: "Active"}); }} label={showForm ? "Close Form" : "Add Lead"} primary />} />
      
      {showForm && (
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <SectionHeader title={editingId ? "Edit Lead" : "Add New Lead"} />
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Full Name" value={form.name} onChange={(v) => setForm({...form, name: v})} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({...form, email: v})} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({...form, phone: v})} />
            <Field label="Pincode" value={form.pincode} onChange={(v) => setForm({...form, pincode: v})} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={LABEL_STYLE}>Status</label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} style={INPUT_STYLE}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#f43f5e", fontSize: 12 }}>{formError}</span>
              <button type="submit" disabled={saving} style={primaryButton}>{saving ? "Saving..." : (editingId ? "Update Lead" : "Create Lead")}</button>
            </div>
          </form>
        </Card>
      )}

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        serviceFilter={serviceFilter}
        onServiceChange={setServiceFilter}
        groupByPincode={groupByPincode}
        onGroupToggle={() => setGroupByPincode((value) => !value)}
        placeholder="Search by name, email, phone or pincode..."
      />
      <DataCard loading={loading} error={error} empty={!filteredLeads.length} emptyText="No leads found.">
        <TableWrapper headers={["Customer", "Contact", "Plan", "Pincode", "Date", "Status", "Actions"]} rows={rows} />
      </DataCard>
    </div>
  );
}

function leadRow(lead, index, onDelete, onEdit) {
  const id = lead._id || lead.id;
  return (
    <tr key={id} style={{ borderBottom: "1px solid #f8fafc" }}>
      <td style={TD_STYLE}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={(lead.name || "?").charAt(0).toUpperCase()} size={36} />
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a" }}>{lead.name || "Anonymous"}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{lead.role || "user"}</div>
          </div>
        </div>
      </td>
      <td style={TD_STYLE}>
        <div>{lead.email}</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{lead.phone}</div>
      </td>
      <td style={TD_STYLE}>{lead.plan || lead.service || "—"}</td>
      <td style={TD_STYLE}>{lead.pincode || "—"}</td>
      <td style={TD_STYLE}>{formatDate(lead.createdAt)}</td>
      <td style={TD_STYLE}><StatusBadge status={lead.status || "Active"} /></td>
      <td style={TD_STYLE}>
        <div style={{ display: "flex", gap: 8 }}>
          <button title="Edit" onClick={() => onEdit(lead)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}><EditIcon /></button>
          <button title="Delete" onClick={() => onDelete(id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#f43f5e" }}><TrashIcon /></button>
        </div>
      </td>
    </tr>
  );
}

export function TechniciansPage() {
  const { data: users, loading, error, refresh: refreshUsers } = useApiData("/api/v2/admin/users");
  const [activeTab, setActiveTab] = useState("member"); // 'member' or 'web_user'
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", mobileNumber: "", password: "", role: "technician", specialty: "", permissions: [] });
  const [formError, setFormError] = useState("");
  const [passwordChangeId, setPasswordChangeId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter(u => (u.userType || 'member') === activeTab);
  }, [users, activeTab]);

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      setUpdatingPassword(true);
      const res = await fetch(`/api/v2/admin/users/${passwordChangeId}/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to update password");
      
      alert("Password updated successfully");
      setPasswordChangeId(null);
      setNewPassword("");
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const url = editingId ? `/api/v2/admin/users/${editingId}` : "/api/v2/admin/users";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userType: 'member' }), // Admin creates members
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to save user");
      
      if (!editingId) {
        alert(`Member created! Credentials:\nMobile: ${payload.data.mobileNumber}\nPassword: ${payload.data.password}`);
      }
      
      await refreshUsers();
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", mobileNumber: "", password: "", role: "technician", specialty: "", permissions: [] });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(user) {
    setEditingId(user._id || user.id);
    setForm({ name: user.name, mobileNumber: user.mobileNumber, role: user.role, password: "", specialty: user.specialty || "", permissions: user.permissions || [] });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/v2/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete user");
      await refreshUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <PageHeader 
        title="User Classification" 
        subtitle={`${filteredUsers.length} ${activeTab === 'member' ? 'members' : 'web users'} found`} 
        actions={activeTab === 'member' && <ActionBtn icon={<PlusIcon />} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({name: "", mobileNumber: "", password: "", role: "technician", specialty: "", permissions: []}); }} label={showForm ? "Close Form" : "Create Member"} primary />} 
      />

      {/* Classification Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, padding: 4, background: "#e2e8f0", borderRadius: 12, width: "fit-content" }}>
        {["member", "web_user"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#1e293b" : "#64748b",
              boxShadow: activeTab === tab ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none"
            }}
          >
            {tab === "member" ? "Members (Staff)" : "Web Users (App)"}
          </button>
        ))}
      </div>

      {showForm && (
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <SectionHeader title={editingId ? "Edit Staff Account" : "Register New Staff Member"} />
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Full Name" value={form.name} onChange={(v) => setForm({...form, name: v})} />
            <Field label="Mobile Number" value={form.mobileNumber} onChange={(v) => setForm({...form, mobileNumber: v})} />
            {!editingId && <Field label="Password" value={form.password} onChange={(v) => setForm({...form, password: v})} />}
            <Field label="Specialty (Optional)" value={form.specialty} onChange={(v) => setForm({...form, specialty: v})} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={LABEL_STYLE}>Role</label>
              <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} style={INPUT_STYLE}>
                <option value="technician">Technician</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="client">Client (App User)</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <label style={LABEL_STYLE}>RBAC Permissions</label>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {["canEditJobs", "canViewReports", "canManageUsers", "canApprovePayments", "canManageAttendance"].map(p => (
                  <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={form.permissions.includes(p)} 
                      onChange={(e) => {
                        const newPerms = e.target.checked ? [...form.permissions, p] : form.permissions.filter(x => x !== p);
                        setForm({...form, permissions: newPerms});
                      }} 
                    />
                    {p === "canEditJobs" ? "EditProjects" : p.replace(/^can/, "")}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#f43f5e", fontSize: 12 }}>{formError}</span>
              <button type="submit" disabled={saving} style={primaryButton}>{saving ? "Saving..." : (editingId ? "Update Account" : "Create Account")}</button>
            </div>
          </form>
        </Card>
      )}

      <DataCard loading={loading} error={error} empty={!filteredUsers.length} emptyText={`No ${activeTab === 'member' ? 'members' : 'web users'} found.`}>
        <TableWrapper
          headers={["User", "Role", "Type", "Status", "Actions"]}
          rows={filteredUsers.map((u) => (
            <tr key={u._id || u.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar initials={(u.name || "?").charAt(0)} size={34} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{u.mobileNumber}</div>
                  </div>
                </div>
              </td>
              <td style={TD_STYLE}><span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: u.role === "manager" ? "#6366f1" : "#64748b" }}>{u.role}</span></td>
              <td style={TD_STYLE}><span style={{ fontSize: 11, fontWeight: 700, color: (u.userType || 'member') === 'member' ? '#0ea5e9' : '#f59e0b' }}>{(u.userType || 'member').replace('_', ' ').toUpperCase()}</span></td>
              <td style={TD_STYLE}><StatusBadge status={u.status} /></td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button title="Change Password" onClick={() => { setPasswordChangeId(u._id || u.id); setNewPassword(""); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#f59e0b" }}><KeyIcon /></button>
                  {activeTab === 'member' && <button title="Edit" onClick={() => startEdit(u)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}><EditIcon /></button>}
                  <button title="Delete" onClick={() => handleDelete(u._id || u.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#f43f5e" }}><TrashIcon /></button>
                </div>
                {passwordChangeId === (u._id || u.id) && (
                  <div style={{ position: "absolute", right: 20, background: "#fff", border: "1px solid #e2e8f0", padding: 12, borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 10 }}>
                    <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>NEW PASSWORD</div>
                      <input 
                        type="text" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="Min 6 chars" 
                        autoFocus
                        style={{ ...INPUT_STYLE, padding: "6px 10px", width: 140 }} 
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="submit" disabled={updatingPassword} style={{ ...primaryButton, padding: "4px 8px", fontSize: 11 }}>{updatingPassword ? "..." : "Save"}</button>
                        <button type="button" onClick={() => setPasswordChangeId(null)} style={{ border: "none", background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
              </td>
            </tr>
          ))}
        />
      </DataCard>
    </div>
  );
}

// ─── Admissions / Course Management Pages ───────────────────────────────────

export function AdmissionsPage({ selectedId, onSelect }) {
  if (selectedId) {
    return <AdmissionDetail id={selectedId} onBack={() => onSelect && onSelect(null)} />;
  }

  return <AllApplicationsPage onView={onSelect} />;
}

function AdmissionDetail({ id, onBack }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState([]);
  const [payments, setPayments] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('aadhaar');
  const [assignCourse, setAssignCourse] = useState('');
  const [assignInternship, setAssignInternship] = useState('');
  const showToast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  function openConfirm(action, message) {
    setConfirmAction({ action, message });
    setConfirmOpen(true);
  }

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/v2/admission/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load application');
      const payload = await res.json();
      setItem(payload.data || payload);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    let active = true;
    async function loadExtras() {
      try {
        setLoadingActivity(true);
        // fetch activity stream (if backend provides)
        const [aRes, pRes, asRes] = await Promise.all([
          fetch(`/api/v2/admission/${id}/activity`, { credentials: 'include' }).catch(() => null),
          fetch(`/api/v2/admission/${id}/payments`, { credentials: 'include' }).catch(() => null),
          fetch(`/api/v2/admission/${id}/assignment/history`, { credentials: 'include' }).catch(() => null),
        ]);
        if (!active) return;
        if (aRes && aRes.ok) { const j = await aRes.json().catch(() => ({})); setActivity(j.data || j || []); }
        if (pRes && pRes.ok) { const j = await pRes.json().catch(() => ({})); setPayments(j.data || j || []); }
        if (asRes && asRes.ok) { const j = await asRes.json().catch(() => ({})); setAssignmentHistory(j.data || j || []); }
      } catch (e) {
        // ignore — extras are best-effort
      } finally { if (active) setLoadingActivity(false); }
    }
    loadExtras();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div>Loading application...</div>;
  if (error) return <div style={{ color: '#b91c1c' }}>{error}</div>;
  if (!item) return <div>Application not found.</div>;

  async function updateStatus(status) {
    try {
      const res = await fetch(`/api/v2/admission/${id}/status`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionStatus: status }) });
      if (!res.ok) throw new Error('Failed to update status');
      await load();
      showToast('Status updated');
    } catch (e) { showToast(e.message || 'Failed', { duration: 4000 }); }
  }

  async function addNote() {
    try {
      const res = await fetch(`/api/v2/admission/${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ internalNote: noteText }) });
      if (!res.ok) throw new Error('Failed to add note');
      setNoteText('');
      await load();
      showToast('Note added');
    } catch (e) { showToast(e.message || 'Failed', { duration: 4000 }); }
  }

  async function uploadDocument() {
    try {
      const res = await fetch(`/api/v2/admission/${id}/documents`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentType: docType, fileUrl: docUrl }) });
      if (!res.ok) throw new Error('Failed to upload document');
      setDocUrl(''); setDocType('aadhaar');
      await load();
      showToast('Document uploaded');
    } catch (e) { showToast(e.message || 'Failed', { duration: 4000 }); }
  }

  async function upsertPayment(e) {
    e.preventDefault();
    try {
      const form = new FormData(e.target);
      const payload = {
        totalFees: Number(form.get('totalFees') || 0),
        paidAmount: Number(form.get('paidAmount') || 0),
        pendingAmount: Number(form.get('pendingAmount') || 0),
        paymentStatus: form.get('paymentStatus') || 'pending',
        adminNote: form.get('adminNote') || ''
      };
      const res = await fetch(`/api/v2/admission/${id}/payment`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to update payment');
        await load();
        showToast('Payment updated');
    } catch (e) { alert(e.message); }
  }

  async function assign() {
    try {
      const res = await fetch(`/api/v2/admission/${id}/assignment`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedCourse: assignCourse, assignedInternship: assignInternship }) });
      if (!res.ok) throw new Error('Failed to assign');
      await load();
      alert('Assignment updated');
    } catch (e) { alert(e.message); }
  }

  return (
    <div>
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: '#fff', padding: 12, boxShadow: '0 2px 8px rgba(2,6,23,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onBack} style={{ marginRight: 8 }}>← Back</button>
            <Avatar initials={(item.fullName||'?').charAt(0).toUpperCase()} size={64} />
            <div>
              <h2 style={{ margin: 0 }}>{item.fullName}</h2>
              <div style={{ color: '#64748b' }}>{item.email} • {item.phone}</div>
              <div style={{ marginTop: 6, color: '#94a3b8' }}>Application ID: {item._id || item.id}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={approveButton} onClick={() => openConfirm('approved', `Approve application for ${item.fullName}?`)}>Approve</button>
              <button style={rejectButton} onClick={() => openConfirm('rejected', `Reject application for ${item.fullName}?`)}>Reject</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>
        <div>
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Personal Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Full Name</strong><div style={{ color: '#64748b' }}>{item.fullName}</div></div>
              <div><strong>DOB</strong><div style={{ color: '#64748b' }}>{item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : '—'}</div></div>
              <div><strong>Gender</strong><div style={{ color: '#64748b' }}>{item.gender || '—'}</div></div>
              <div><strong>Aadhaar</strong><div style={{ color: '#64748b' }}>{item.aadhaarNumber || '—'}</div></div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Address</strong><div style={{ color: '#64748b' }}>{item.address}</div></div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Parent / Emergency" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Father</strong><div style={{ color: '#64748b' }}>{item.fatherName || '—'}</div></div>
              <div><strong>Mother</strong><div style={{ color: '#64748b' }}>{item.motherName || '—'}</div></div>
              <div><strong>Parent Mobile</strong><div style={{ color: '#64748b' }}>{item.parentMobile || '—'}</div></div>
              <div><strong>Emergency</strong><div style={{ color: '#64748b' }}>{item.emergencyContact || '—'}</div></div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Education" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Qualification</strong><div style={{ color: '#64748b' }}>{item.qualification}</div></div>
              <div><strong>College</strong><div style={{ color: '#64748b' }}>{item.collegeName || '—'}</div></div>
              <div><strong>Year</strong><div style={{ color: '#64748b' }}>{item.yearOfPassing || '—'}</div></div>
              <div><strong>Skill Level</strong><div style={{ color: '#64748b' }}>{item.currentSkillLevel || '—'}</div></div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Financial Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Financial Stability</strong><div style={{ color: '#64748b' }}>{item.financialStability}</div></div>
              <div><strong>Monthly Income</strong><div style={{ color: '#64748b' }}>{item.monthlyFamilyIncome || '—'}</div></div>
              <div><strong>EMI Support</strong><div style={{ color: '#64748b' }}>{item.emiSupportRequired ? 'Yes' : 'No'}</div></div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Internal Notes" />
            <div>
              {(item.internalNotes || []).map((n, i) => (
                <div key={i} style={{ padding: 8, borderBottom: '1px solid #eef2ff' }}>
                  <div style={{ fontSize: 13 }}>{n.note}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{n.addedAt ? new Date(n.addedAt).toLocaleString() : ''}</div>
                </div>
              ))}
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add internal note..." style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <button onClick={addNote} style={primaryButton}>Add</button>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card style={{ padding: 12, marginBottom: 16 }}>
            <SectionHeader title="Quick Actions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => showToast('Message sent (placeholder)')} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>Send Message</button>
              <button onClick={() => showToast('Task created (placeholder)')} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>Create Task</button>
              <button onClick={() => showToast('Payment link sent (placeholder)')} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>Send Payment Link</button>
              <button onClick={() => { const data = JSON.stringify(item); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${item._id || 'profile'}.json`; a.click(); showToast('Exported profile'); }} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>Export Profile</button>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Status & Timeline" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StatusBadge status={item.admissionStatus} />
                <div style={{ color: '#64748b' }}>Applied: {formatDate(item.createdAt)}</div>
                <div style={{ color: '#64748b' }}>Last updated: {formatDate(item.updatedAt)}</div>
              </div>

              {/* Status progression */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                {['applied','review','approved','enrolled','completed'].map((s, idx) => {
                  const active = (item.admissionStatus || '').toLowerCase() === s || (['approved','enrolled','completed'].includes(item.admissionStatus) && s==='review' && item.admissionStatus!=='applied');
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 99, background: active ? '#6366f1' : '#e2e8f0' }} />
                      <div style={{ fontSize: 12, color: active ? '#0f172a' : '#94a3b8' }}>{s.replace(/_/g,' ')}</div>
                      {idx < 4 && <div style={{ width: 24, height: 2, background: '#e2e8f0', margin: '0 8px' }} />}
                    </div>
                  );
                })}
              </div>

              {/* Timeline / activity feed */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Activity</div>
                {loadingActivity ? <div style={{ color: '#64748b' }}>Loading activity…</div> : null}
                {!loadingActivity && (activity && activity.length) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activity.map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 99, background: '#06b6d4', marginTop: 6 }} />
                        <div>
                          <div style={{ fontSize: 13 }}>{a.message || a.type || JSON.stringify(a)}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (!loadingActivity ? <div style={{ color: '#94a3b8' }}>No activity recorded.</div> : null)}
              </div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Assignment" />
            <div style={{ display: 'grid', gap: 8 }}>
              <div><strong>Assigned Course</strong><div style={{ color: '#64748b' }}>{item.assignedCourse || '—'}</div></div>
              <div><strong>Assigned Internship</strong><div style={{ color: '#64748b' }}>{item.assignedInternship || '—'}</div></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={assignCourse} onChange={(e) => setAssignCourse(e.target.value)} placeholder="Course code/name" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <input value={assignInternship} onChange={(e) => setAssignInternship(e.target.value)} placeholder="Internship" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={assign} style={primaryButton}>Save Assignment</button>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Payment" />
            <div>
              <div style={{ marginBottom: 8 }}><strong>Total Fees:</strong> {item.payment ? `₹${item.payment.totalFees}` : '—'}</div>
              <div style={{ marginBottom: 8 }}><strong>Paid:</strong> {item.payment ? `₹${item.payment.paidAmount}` : '—'}</div>
              <div style={{ marginBottom: 8 }}><strong>Pending:</strong> {item.payment ? `₹${item.payment.pendingAmount}` : '—'}</div>
              <form onSubmit={upsertPayment} style={{ display: 'grid', gap: 8 }}>
                <input name="totalFees" placeholder="Total Fees" defaultValue={item.payment?.totalFees || ''} style={{ padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <input name="paidAmount" placeholder="Paid Amount" defaultValue={item.payment?.paidAmount || ''} style={{ padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <input name="pendingAmount" placeholder="Pending Amount" defaultValue={item.payment?.pendingAmount || ''} style={{ padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <select name="paymentStatus" defaultValue={item.paymentStatus || 'pending'} style={{ padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="pending">Pending</option>
                </select>
                <textarea name="adminNote" placeholder="Admin note (optional)" style={{ padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <button type="submit" style={primaryButton}>Update Payment</button>
              </form>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Payment Ledger" />
            <div style={{ display: 'grid', gap: 8 }}>
              {payments && payments.length ? payments.map((p) => (
                <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #eef2ff' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.amount ? `₹${p.amount}` : p.description || 'Payment'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.method || p.paymentMethod || ''}</div>
                  </div>
                  <div style={{ color: '#94a3b8' }}>{p.date ? new Date(p.date).toLocaleString() : (p.createdAt ? formatDate(p.createdAt) : '')}</div>
                </div>
              )) : <div style={{ color: '#94a3b8' }}>No payment ledger entries.</div>}
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionHeader title="Assignment History" />
            <div style={{ display: 'grid', gap: 8 }}>
              {assignmentHistory && assignmentHistory.length ? assignmentHistory.map((a, i) => (
                <div key={i} style={{ padding: 8, borderBottom: '1px solid #eef2ff' }}>
                  <div style={{ fontWeight: 700 }}>{a.assignedTo || a.assignedCourse || 'Assigned'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{a.note || a.reason || ''}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.date ? new Date(a.date).toLocaleString() : (a.at ? new Date(a.at).toLocaleString() : '')}</div>
                </div>
              )) : <div style={{ color: '#94a3b8' }}>No assignment history.</div>}
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <SectionHeader title="Documents" />
            <div style={{ display: 'grid', gap: 8 }}>
              {(item.documents || []).map(d => (
                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #eef2ff' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{d.documentType}</div>
                    <div style={{ color: '#64748b' }}>{d.fileUrl}</div>
                  </div>
                  <div><button onClick={() => { setPreviewUrl(d.fileUrl); setPreviewOpen(true); }} style={{ border: 'none', background: 'none', color: '#6366f1', cursor: 'pointer' }}>Preview</button></div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8 }}>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <option value="aadhaar">Aadhaar</option>
                  <option value="resume">Resume</option>
                  <option value="certificate">Certificate</option>
                  <option value="passport_photo">Passport Photo</option>
                  <option value="other">Other</option>
                </select>
                <input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="File URL" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <button onClick={uploadDocument} style={primaryButton}>Upload</button>
              </div>
            </div>
          </Card>

          <Modal open={!!previewOpen} onClose={() => { setPreviewOpen(false); setPreviewUrl(''); }} title="Document Preview">
            <div style={{ minHeight: 240 }}>
              {previewUrl ? <iframe src={previewUrl} style={{ width: '100%', height: 480, border: 0 }} /> : <div>No preview available</div>}
            </div>
          </Modal>

        </div>
      </div>
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={confirmAction?.message || 'Confirm'}>
        <div style={{ marginBottom: 12 }}>{confirmAction?.message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setConfirmOpen(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>Cancel</button>
          <button onClick={async () => { setConfirmOpen(false); if (confirmAction) await updateStatus(confirmAction.action); }} style={primaryButton}>Confirm</button>
        </div>
      </Modal>
    </div>
  );
}

export function StudentProfilesPage() {
  return <AdmissionStudentProfilesPage />;
}

export function AdmissionPaymentsPage() {
  return <AdmissionPaymentStatusPage />;
}

export function CourseAssignmentPage() {
  return (
    <div>
      <PageHeader title="Course Assignment" subtitle="Assign students to courses" />
      <Card>
        <div style={{ padding: 16 }}>Course assignment UI (lists, assign controls) will render here.</div>
      </Card>
    </div>
  );
}

export function InternshipAssignmentPage() {
  return (
    <div>
      <PageHeader title="Internship Assignment" subtitle="Manage internship allocations" />
      <Card>
        <div style={{ padding: 16 }}>Internship assignment UI placeholder.</div>
      </Card>
    </div>
  );
}

export function AdmissionAnalyticsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/v2/admission?limit=1000', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load admissions');
        const payload = await res.json();
        if (!active) return;
        setItems(payload.items || payload || []);
      } catch (e) { if (active) setError(e.message || 'Failed'); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const total = items.length;
  const byStatus = items.reduce((acc, it) => { acc[it.admissionStatus||'unknown'] = (acc[it.admissionStatus||'unknown']||0)+1; return acc; }, {});
  const byCourse = items.reduce((acc, it) => { const k = it.assignedCourse || it.programType || 'Unassigned'; acc[k] = (acc[k]||0)+1; return acc; }, {});
  const revenue = items.reduce((acc, it) => { const p = it.payment || {}; acc.totalFees = (acc.totalFees||0) + (Number(p.totalFees) || 0); acc.paid = (acc.paid||0) + (Number(p.paidAmount) || 0); return acc; }, {});

  const monthly = items.reduce((acc, it) => {
    const m = it.createdAt ? new Date(it.createdAt) : null;
    if (!m) return acc;
    const key = `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`;
    acc[key] = (acc[key]||0) + 1;
    return acc;
  }, {});

  const monthlyData = Object.entries(monthly).sort().map(([k,v]) => ({ month: k, value: v }));
  const statusData = Object.entries(byStatus).map(([k,v]) => ({ name: k, value: v }));
  const courseData = Object.entries(byCourse).map(([k,v]) => ({ name: k, value: v }));

  return (
    <div>
      <PageHeader title="Admission Analytics" subtitle="Key admission metrics" />
      {loading ? <Card style={{ padding: 20 }}>Loading analytics...</Card> : null}
      {error ? <Card style={{ padding: 20, color: '#b91c1c' }}>{error}</Card> : null}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ padding: 16 }}>
            <div style={{ color: '#64748b' }}>Total applications</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{total}</div>
            <div style={{ marginTop: 12 }}>Revenue: <strong>₹{revenue.totalFees || 0}</strong> (Paid ₹{revenue.paid || 0})</div>
          </Card>

          <Card style={{ padding: 16 }}>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} fill="#8884d8">
                    {statusData.map((entry, idx) => <Cell key={idx} fill={['#6366f1','#06b6d4','#f43f5e','#f59e0b'][idx % 4]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function ProjectsPage() {
  const { data: jobs, loading, error, refresh: refreshJobs } = useApiData("/api/v2/admin/jobs");
  const { data: users } = useApiData("/api/v2/admin/users");
  const technicians = useMemo(() => users.filter(u => u.role === 'technician'), [users]);
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ title: "", serviceType: "installation", customerName: "", customerPhone: "", location: "", technicianId: "", price: "", description: "" });
  const [statusSavingId, setStatusSavingId] = useState("");

  const jobStatusOptions = [
    "pending",
    "not_visited",
    "site_visited",
    "assigned",
    "in_progress",
    "started",
    "work_uploaded",
    "completion_requested",
    "approved_by_manager",
    "payment_pending",
    "payment_done",
    "completed",
  ];

  const filteredJobs = useMemo(() => {
    let list = jobs.filter(j => j.serviceType === 'installation' || String(j.title || j.serviceName).toLowerCase().includes('install'));
    if (statusFilter === "All") return list;
    return list.filter(j => j.status === statusFilter || j.rawStatus === statusFilter);
  }, [jobs, statusFilter]);

  async function handleDeleteJob(id) {
    if (!window.confirm("Delete this project?")) return;
    try {
      const res = await fetch(`/api/v2/admin/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      refreshJobs();
    } catch (e) { alert(e.message); }
  }

  async function handleChangeJobStatus(id, status) {
    try {
      setStatusSavingId(id);
      const res = await fetch(`/api/v2/admin/jobs/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || "Failed to update project status");
      await refreshJobs();
    } catch (e) {
      alert(e.message);
    } finally {
      setStatusSavingId("");
    }
  }

  async function handleCreateJob(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const res = await fetch("/api/v2/admin/jobs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to create project");
      await refreshJobs();
      setShowForm(false);
      setForm({ title: "", serviceType: "installation", customerName: "", customerPhone: "", location: "", technicianId: "", price: "", description: "" });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Project Repository" subtitle={`${filteredJobs.length} projects available`} actions={<ActionBtn icon={<PlusIcon />} onClick={() => setShowForm(!showForm)} label={showForm ? "Close Form" : "Create Project"} primary />} />
      {showForm && (
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <SectionHeader title="Assign New Project" />
          <form onSubmit={handleCreateJob} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Service Name" value={form.title} onChange={(v) => setForm({...form, title: v})} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={LABEL_STYLE}>Service Type</label>
              <select value={form.serviceType} onChange={(e) => setForm({...form, serviceType: e.target.value})} style={INPUT_STYLE}>
                <option value="installation">Installation</option>
                <option value="repair">Repair</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Field label="Customer Name" value={form.customerName} onChange={(v) => setForm({...form, customerName: v})} />
            <Field label="Customer Phone" value={form.customerPhone} onChange={(v) => setForm({...form, customerPhone: v})} />
            <Field label="Location" value={form.location} onChange={(v) => setForm({...form, location: v})} />
            <Field label="Price" value={form.price} onChange={(v) => setForm({...form, price: v})} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={LABEL_STYLE}>Technician</label>
              <select value={form.technicianId} onChange={(e) => setForm({...form, technicianId: e.target.value})} style={INPUT_STYLE}>
                <option value="">Unassigned</option>
                {technicians.map((tech) => <option key={tech._id || tech.id} value={tech._id || tech.id}>{tech.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#dc2626" }}>{formError}</span>
              <button type="submit" disabled={saving} style={primaryButton}>{saving ? "Creating..." : "Create Project"}</button>
            </div>
          </form>
        </Card>
      )}
      <DataCard loading={loading} error={error} empty={!filteredJobs.length} emptyText="No projects found.">
        <TableWrapper
          headers={["Customer", "Service", "Technician", "Location", "Status", "Created", "Actions"]}
          rows={filteredJobs.map((job) => (
            <tr key={job._id || job.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}><div style={{ fontWeight: 700, color: "#0f172a" }}>{job.customerName || "Client"}</div></td>
              <td style={TD_STYLE}>{job.title || job.serviceName}</td>
              <td style={TD_STYLE}>{job.assignedTechnician?.name || "Unassigned"}</td>
              <td style={TD_STYLE}>{job.location || job.address}</td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusBadge status={job.status} />
                  <select
                    value={job.status || "pending"}
                    disabled={statusSavingId === (job._id || job.id)}
                    onChange={(e) => handleChangeJobStatus(job._id || job.id, e.target.value)}
                    style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 11, outline: "none", background: "#fff", color: "#334155" }}
                  >
                    {jobStatusOptions.map(status => (
                      <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </td>
              <td style={TD_STYLE}>{formatDate(job.createdAt)}</td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button title="Delete" onClick={() => handleDeleteJob(job._id || job.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#f43f5e" }}><TrashIcon /></button>
                </div>
              </td>
            </tr>
          ))}
        />
      </DataCard>
    </div>
  );
}

export function RequestsPage() {
  const { data: requests, loading, error, refresh } = useApiData("/api/v2/admin/completion-requests");
  const [busyId, setBusyId] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  async function updateRequest(taskId, action) {
    try {
      setBusyId(taskId);
      const res = await fetch(`/api/v2/admin/completion-requests/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.message || "Failed to update request");
      }
      await refresh();
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHeader title="Completion Requests" subtitle={`${requests.length} requests awaiting approval`} />
      <DataCard loading={loading} error={error} empty={!requests.length} emptyText="No pending approval requests.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 }}>
          {requests.map((request) => (
            <Card key={request.id} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{request.customerName}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{request.serviceName}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Technician: {request.technicianName || "—"}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Submitted: {formatDate(request.updatedAt)}</div>
                {request.price && <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Price: ₹{request.price}</div>}
              </div>

              {request.attachments && request.attachments.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: expandedId === request.id ? "#eef2ff" : "#f8fafc",
                      color: expandedId === request.id ? "#6366f1" : "#475569",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all .2s"
                    }}
                  >
                    {expandedId === request.id ? "▼" : "▶"} Images ({request.attachments.length})
                  </button>
                  {expandedId === request.id && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
                      {request.attachments.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedImage(url)}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            borderRadius: 10,
                            background: "#f1f5f9",
                            overflow: "hidden",
                            cursor: "pointer",
                            border: "1px solid #e2e8f0",
                            transition: "all .2s"
                          }}
                        >
                          <img
                            src={url}
                            alt={`Work image ${idx + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e2e8f0' width='100' height='100'/%3E%3Ctext x='50' y='50' textAnchor='middle' dy='.3em' fill='%2394a3b8' fontSize='12'%3EImage%3C/text%3E%3C/svg%3E"}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  disabled={busyId === request.id}
                  onClick={() => updateRequest(request.id, "approve")}
                  style={{ ...approveButton, flex: 1, margin: 0 }}
                >
                  Approve
                </button>
                <button
                  disabled={busyId === request.id}
                  onClick={() => updateRequest(request.id, "reject")}
                  style={{ ...rejectButton, flex: 1, margin: 0 }}
                >
                  Reject
                </button>
              </div>
            </Card>
          ))}
        </div>
      </DataCard>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={selectedImage} alt="Full view" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: "absolute",
                top: -30,
                right: 0,
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 28,
                cursor: "pointer",
                fontWeight: 300
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewsPage() {
  const { data: reviews, loading, error } = useApiData("/api/v2/admin/reviews");
  return (
    <div>
      <PageHeader title="Technician Reviews" subtitle={`${reviews.length} feedback entries`} />
      <DataCard loading={loading} error={error} empty={!reviews.length} emptyText="No reviews available yet.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {reviews.map((review) => (
            <Card key={review.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{review.technicianName}</div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginBottom: 10 }}>{review.comment}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{formatDate(review.createdAt)}</div>
            </Card>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

export function TrackingPage() {
  const { data: initialTechnicians, loading, error, setData: setTechnicians } = useApiData("/api/v2/admin/tracking");
  
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || '', { 
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socket.on('technicianLocationUpdate', (data) => {
      console.log('Socket update received:', data);
      setTechnicians(prev => prev.map(tech => 
        tech.technicianId === data.technicianId 
          ? { 
              ...tech, 
              lat: data.lat ?? tech.lat, 
              lng: data.lng ?? tech.lng, 
              isOnline: data.isOnline ?? tech.isOnline, 
              lastUpdate: new Date() 
            }
          : tech
      ));
    });

    return () => {
      socket.disconnect();
    };
  }, [setTechnicians]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Initializing real-time tracking...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>;

  return (
    <div style={{ height: "calc(100vh - 140px)", display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader 
        title="Fleet Live View" 
        subtitle="Real-time geographic distribution of field technicians" 
        actions={<div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', padding: '6px 12px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Live System Active</span>
        </div>}
      />
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, flex: 1, minHeight: 0 }}>
        <div style={{ position: "relative", height: "100%", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", border: "1px solid #e2e8f0" }}>
          <LiveMap technicians={initialTechnicians} />
          
          {/* Overlay Stats */}
          <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 1000, display: "flex", gap: 10 }}>
             <div style={{ background: "rgba(15, 23, 42, 0.9)", padding: "12px 16px", borderRadius: 16, color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Fleet</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{initialTechnicians.length}</div>
             </div>
             <div style={{ background: "rgba(15, 23, 42, 0.9)", padding: "12px 16px", borderRadius: 16, color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Active Now</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{initialTechnicians.filter(t => t.isOnline).length}</div>
             </div>
          </div>
        </div>

        <Card style={{ display: "flex", flexDirection: "column", padding: 0 }}>
          <div style={{ padding: "20px 20px 10px" }}>
            <SectionHeader title="Staff Monitor" />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {initialTechnicians.map((tech) => (
                <div key={tech.technicianId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 16, background: tech.isOnline ? "#f8fafc" : "#fff", border: tech.isOnline ? "1px solid #e2e8f0" : "1px solid #f1f5f9", transition: "all 0.3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <Avatar initials={tech.name.charAt(0)} size={36} gradient={tech.isOnline ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "linear-gradient(135deg,#94a3b8,#64748b)"} />
                        {tech.isOnline && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#10b981', border: '2px solid #fff' }}></div>}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{tech.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{tech.specialty || "General Tech"}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: tech.isOnline ? "#10b981" : "#94a3b8", textTransform: "uppercase" }}>{tech.isOnline ? "Online" : "Offline"}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, fontFamily: 'monospace' }}>{tech.lat.toFixed(3)}, {tech.lng.toFixed(3)}</div>
                  </div>
                </div>
              ))}
              {initialTechnicians.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>No technicians registered yet.</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AttendancePage() {
  const { data: todayList, loading: loadingToday, error: errorToday, refresh: refreshToday } = useApiData("/api/v2/attendance/today");
  const { data: users } = useApiData("/api/v2/admin/users");
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [view, setView] = useState("table"); 
  const [monthData, setMonthData] = useState([]);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // Auto-refresh today's attendance every 15 seconds
  useEffect(() => {
    const timer = setInterval(refreshToday, 15000);
    return () => clearInterval(timer);
  }, [refreshToday]);

  const currentMonthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });

  const changeMonth = (offset) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(next);
  };

  async function updateAttendance(record, status, date = null) {
    if (record.status === status) return;

    try {
      const uid = record.userId || record._id;
      const res = await fetch(`/api/v2/attendance/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, date })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update attendance");
      }
      await refreshToday();
      if (selectedUser) {
        fetchMonthData(selectedUser._id || selectedUser.id);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  useEffect(() => {
    if (selectedUser && view === "calendar") {
      fetchMonthData(selectedUser._id || selectedUser.id);
    }
  }, [selectedUser, view, viewDate]);

  async function fetchMonthData(uid) {
    try {
      setLoadingMonth(true);
      const res = await fetch(`/api/v2/attendance/range?userId=${uid}&month=${viewDate.getMonth() + 1}&year=${viewDate.getFullYear()}`);
      const payload = await res.json();
      if (res.ok) setMonthData(payload.data || []);
    } finally {
      setLoadingMonth(false);
    }
  }

  return (
    <div>
      <PageHeader 
        title="Attendance Management" 
        subtitle="Daily presence and monthly tracking" 
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setView("table")} style={pillButton(view === "table")}>Table View</button>
            <button onClick={() => setView("calendar")} style={pillButton(view === "calendar")}>Calendar View</button>
          </div>
        }
      />

      {view === "calendar" && (
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <SectionHeader title={`Staff Presence Calendar - ${currentMonthName}`} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => changeMonth(-1)} style={{ ...pillButton(false), padding: "4px 10px" }}>Prev</button>
              <button onClick={() => setViewDate(new Date())} style={{ ...pillButton(false), padding: "4px 10px" }}>Today</button>
              <button onClick={() => changeMonth(1)} style={{ ...pillButton(false), padding: "4px 10px" }}>Next</button>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Select Staff Member</label>
            <select 
              onChange={(e) => {
                const u = users.find(x => (x._id || x.id) === e.target.value);
                setSelectedUser(u);
              }}
              style={{ ...INPUT_STYLE, width: "100%", marginTop: 6 }}
            >
              <option value="">-- Choose User --</option>
              {users.map(u => <option key={u._id || u.id} value={u._id || u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          {selectedUser ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: "#64748b", padding: 8 }}>{d}</div>
              ))}
              {monthData.map((day) => {
                const isToday = day.date === new Date().toISOString().split('T')[0];
                const isFuture = day.status === 'none';
                return (
                  <div 
                    key={day.date} 
                    onClick={() => {
                      if (!isFuture) {
                        const newStatus = day.status === 'present' ? 'absent' : 'present';
                        // Use a dummy record object for the calendar toggle
                        updateAttendance({ userId: selectedUser._id || selectedUser.id, status: day.status }, newStatus, day.date);
                      }
                    }}
                    style={{ 
                      height: 80, 
                      borderRadius: 12, 
                      padding: 8,
                      background: day.status === "present" ? "#dcfce7" : (day.status === "absent" ? "#fee2e2" : "#f8fafc"),
                      border: isToday ? "2px solid #6366f1" : `1px solid ${day.status === "present" ? "#86efac" : (day.status === "absent" ? "#fecaca" : "#e2e8f0")}`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: isFuture ? "default" : "pointer",
                      opacity: isFuture ? 0.6 : 1,
                      boxShadow: isToday ? "0 0 10px rgba(99, 102, 241, 0.2)" : "none"
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: day.status === "present" ? "#166534" : (day.status === "absent" ? "#991b1b" : "#94a3b8") }}>
                        {new Date(day.date).getDate()}
                      </div>
                      {isToday && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: day.status === "present" ? "#15803d" : (day.status === "absent" ? "#b91c1c" : "#94a3b8") }}>
                      {day.status === 'none' ? '—' : day.status}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Select a staff member to view their attendance calendar.</div>
          )}
        </Card>
      )}

      {view === "table" && (
        <DataCard loading={loadingToday} error={errorToday} empty={!todayList.length} emptyText="No staff activity today.">
          <TableWrapper
            headers={["Staff Member", "Role", "Status", "Login", "Logout", "Hours", "Actions"]}
            rows={todayList.map((record) => {
              const isPresent = record.status === "present";
              return (
                <tr key={record.id || record.userId} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={TD_STYLE}><div style={{ fontWeight: 700 }}>{record.name}</div></td>
                  <td style={TD_STYLE}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{record.role}</div></td>
                  <td style={TD_STYLE}>
                    <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: isPresent ? "#dcfce7" : "#fee2e2", color: isPresent ? "#15803d" : "#b91c1c" }}>
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={TD_STYLE}>{record.loginTime ? new Date(record.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                  <td style={TD_STYLE}>{record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                  <td style={TD_STYLE}>{record.workingHours || 0}h</td>
                  <td style={TD_STYLE}>
                    <select 
                      value={record.status} 
                      onChange={(e) => updateAttendance(record, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, outline: "none" }}
                    >
                      <option value="present">Mark Present</option>
                      <option value="absent">Mark Absent</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          />
        </DataCard>
      )}
    </div>
  );
}

export function ServiceRequestsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignModal, setAssignModal] = useState(null); // booking object or null
  const [viewModal, setViewModal] = useState(null); // popup details
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const loadBookings = useCallback(async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) setLoading(true);
      const url = statusFilter === "all" ? "/api/v2/admin/bookings" : `/api/v2/admin/bookings?status=${statusFilter}`;
      const res = await fetch(url, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to load bookings");
      // Filter out installations to keep only repairs/others in Service Requests
      const list = (payload.data || []).filter(j => j.serviceType !== 'installation' && !String(j.title || j.serviceName).toLowerCase().includes('install'));
      setBookings(list);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [statusFilter]);

  async function handleUpdateStatus(id, status) {
    try {
      const res = await fetch(`/api/v2/admin/service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      loadBookings();
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this service request?")) return;
    try {
      const res = await fetch(`/api/v2/admin/service-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete request");
      loadBookings();
    } catch (e) { alert(e.message); }
  }

  useEffect(() => { loadBookings({ showLoading: true }); }, [loadBookings]);

  // Poll every 5 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(loadBookings, 5000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  async function loadTechnicians() {
    if (technicians.length > 0) return;
    const res = await fetch("/api/v2/admin/users");
    const payload = await res.json();
    if (res.ok) setTechnicians((payload.data || []).filter(u => u.role === "technician"));
  }

  function openAssign(booking) {
    setAssignModal(booking);
    setSelectedTech(booking.technicianId || "");
    setAssignError("");
    loadTechnicians();
  }

  async function handleAssign() {
    if (!selectedTech) { setAssignError("Please select a technician"); return; }
    try {
      setAssigning(true);
      setAssignError("");
      const res = await fetch(`/api/v2/admin/bookings/${assignModal.id}/assign`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: selectedTech }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Assignment failed");
      setAssignModal(null);
      await loadBookings();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  const STATUS_COLORS = {
    pending: { bg: "#fef9c3", color: "#854d0e" },
    assigned: { bg: "#dbeafe", color: "#1d4ed8" },
    in_progress: { bg: "#fce7f3", color: "#9d174d" },
    started: { bg: "#fce7f3", color: "#9d174d" },
    completed: { bg: "#dcfce7", color: "#15803d" },
    cancelled: { bg: "#fee2e2", color: "#b91c1c" },
  };

  function StatusChip({ status }) {
    const style = STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#475569" };
    return (
      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: style.bg, color: style.color }}>
        {status?.replace(/_/g, " ")}
      </span>
    );
  }

  const statusOptions = ["all", "pending", "assigned", "in_progress", "completed"];

  return (
    <div>
      <PageHeader
        title="Service Requests"
        subtitle={`${bookings.length} booking${bookings.length !== 1 ? "s" : ""} · auto-refreshes every 5s`}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {statusOptions.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  border: "1px solid",
                  borderColor: statusFilter === s ? "#6366f1" : "#e2e8f0",
                  background: statusFilter === s ? "#6366f1" : "#fff",
                  color: statusFilter === s ? "#fff" : "#64748b",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s === "all" ? "All" : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        }
      />

      {/* View Modal */}
      {viewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>Service Request Details</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div><strong style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>User Name</strong><div style={{ fontSize: 14, fontWeight: 600 }}>{viewModal.customerName}</div></div>
              <div><strong style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Phone</strong><div style={{ fontSize: 14, fontWeight: 600 }}>{viewModal.customerPhone || "—"}</div></div>
              <div><strong style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Service</strong><div style={{ fontSize: 14, fontWeight: 600 }}>{viewModal.serviceName}</div></div>
              <div><strong style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Date & Time</strong><div style={{ fontSize: 14, fontWeight: 600 }}>{viewModal.date || "TBD"} {viewModal.timeSlot || ""}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Address</strong><div style={{ fontSize: 14, fontWeight: 600 }}>{viewModal.address || "—"}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Description</strong><div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>{viewModal.description || "No description provided."}</div></div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
              <button onClick={() => setViewModal(null)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 700, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Assign Technician</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
              <p style={{ margin: "0 0 6px 0" }}><strong style={{ color: "#334155" }}>Service:</strong> {assignModal.serviceName}</p>
              <p style={{ margin: "0 0 6px 0" }}><strong style={{ color: "#334155" }}>Date:</strong> {assignModal.date || "Date TBD"} {assignModal.timeSlot || ""}</p>
              
              <p style={{ margin: "8px 0 4px 0" }}><strong style={{ color: "#334155" }}>Description:</strong></p>
              <div style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "8px",
                color: "#475569"
              }}>
                {assignModal.description || "No description provided"}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Select Technician</label>
              <select
                value={selectedTech}
                onChange={e => setSelectedTech(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 13, outline: "none" }}
              >
                <option value="">-- Choose Technician --</option>
                {technicians.map(t => (
                  <option key={t._id || t.id} value={t._id || t.id}>{t.name} {t.specialty ? `· ${t.specialty}` : ""}</option>
                ))}
              </select>
            </div>

            {assignError && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{assignError}</div>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setAssignModal(null)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button disabled={assigning} onClick={handleAssign} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {assigning ? "Assigning..." : "Assign Technician"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DataCard loading={loading} error={error} empty={!bookings.length} emptyText="No service requests found.">
        <TableWrapper
          headers={["Customer", "Service", "Date & Time", "Status", "Technician", "Assign", "Actions"]}
          rows={bookings.map(booking => (
            <tr key={booking.id} style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer" }} onClick={(e) => { if(e.target.tagName !== 'BUTTON') setViewModal(booking); }}>
              <td style={TD_STYLE}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{booking.customerName}</div>
                {booking.customerPhone && <div style={{ fontSize: 11, color: "#94a3b8" }}>{booking.customerPhone}</div>}
              </td>
              <td style={TD_STYLE}>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{booking.serviceName}</div>
                {booking.address && <div style={{ fontSize: 11, color: "#94a3b8" }}>{booking.address}</div>}
              </td>
              <td style={TD_STYLE}>
                <div style={{ fontWeight: 600 }}>{booking.date || "TBD"}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{booking.timeSlot || ""}</div>
              </td>
              <td style={TD_STYLE}><StatusChip status={booking.status} /></td>
              <td style={TD_STYLE}>
                {booking.technicianName
                  ? <span style={{ color: "#15803d", fontWeight: 600, fontSize: 12 }}>✓ {booking.technicianName}</span>
                  : <span style={{ color: "#94a3b8", fontSize: 12 }}>Unassigned</span>}
              </td>
              <td style={TD_STYLE}>
                <button
                  onClick={(e) => { e.stopPropagation(); openAssign(booking); }}
                  style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: booking.technicianName ? "#f1f5f9" : "#4f46e5", color: booking.technicianName ? "#64748b" : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
                  {booking.technicianName ? "Reassign" : "Assign"}
                </button>
              </td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button title="Approve" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking.id, "approved"); }} style={{ padding: "4px 8px", background: "#dcfce7", color: "#166534", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✓</button>
                  <button title="Reject" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking.id, "rejected"); }} style={{ padding: "4px 8px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✕</button>
                  <button title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(booking.id); }} style={{ padding: "4px 8px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Del</button>
                </div>
              </td>
            </tr>
          ))}
        />
      </DataCard>
    </div>
  );
}

export function ServicesPage() { return <PlaceholderPage title="Services" />; }
export function PaymentsPage() {
  const { data: requests, loading, error, refresh } = useApiData("/api/v2/payment/requests");
  const { data: verifications, loading: vLoading, refresh: vRefresh } = useApiData("/api/v2/admin/payment-requests");
  const [busyId, setBusyId] = useState("");

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      refresh();
      vRefresh();
    }, 10000);
    return () => clearInterval(timer);
  }, [refresh, vRefresh]);

  async function approveRequest(jobId) {
    try {
      setBusyId(jobId);
      const res = await fetch("/api/v2/payment/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error("Failed to approve request");
      await refresh();
      alert("Payment request approved! User can now pay via Razorpay/QR.");
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId("");
    }
  }

  async function verifyPayment(jobId, action) {
    try {
      setBusyId(jobId);
      const res = await fetch(`/api/v2/admin/payment-requests/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed to verify payment");
      await vRefresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHeader title="Payments & Collections" subtitle="Manage technician requests and user payments" />
      
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <SectionHeader title="Technician Payment Requests" />
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Awaiting your approval to generate payment links for users.</p>
        <DataCard loading={loading} error={error} empty={!requests.length} emptyText="No new payment requests from technicians.">
          <TableWrapper
            headers={["Technician", "Customer", "Amount", "Description", "Action"]}
            rows={requests.map((req) => (
              <tr key={req.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={TD_STYLE}><strong>{req.assignedTechnician?.name || "N/A"}</strong></td>
                <td style={TD_STYLE}>{req.customerName}</td>
                <td style={TD_STYLE}><div style={{ fontWeight: 800, color: "#1e293b" }}>₹{req.amount}</div></td>
                <td style={TD_STYLE}><div style={{ fontSize: 12, color: "#64748b" }}>{req.paymentDescription || "Work completed"}</div></td>
                <td style={TD_STYLE}>
                  <button 
                    disabled={busyId === req.id} 
                    onClick={() => approveRequest(req.id)} 
                    style={{ ...approveButton, background: "#10b981" }}
                  >
                    {busyId === req.id ? "..." : "Approve & Link"}
                  </button>
                </td>
              </tr>
            ))}
          />
        </DataCard>
      </Card>

      <Card style={{ padding: 24 }}>
        <SectionHeader title="Manual Payment Verifications" />
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Payments that need manual confirmation (Offline/Bank Transfer).</p>
        <DataCard loading={vLoading} empty={!verifications.length} emptyText="No manual verifications pending.">
          <TableWrapper
            headers={["Customer", "Technician", "Amount", "Status", "Actions"]}
            rows={verifications.map((v) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={TD_STYLE}><strong>{v.customerName}</strong></td>
                <td style={TD_STYLE}>{v.technicianName}</td>
                <td style={TD_STYLE}>₹{v.amount}</td>
                <td style={TD_STYLE}><StatusBadge status={v.paymentStatus} /></td>
                <td style={TD_STYLE}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={busyId === v.id} onClick={() => verifyPayment(v.id, "approve")} style={approveButton}>Confirm</button>
                    <button disabled={busyId === v.id} onClick={() => verifyPayment(v.id, "reject")} style={rejectButton}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          />
        </DataCard>
      </Card>
    </div>
  );
}
export function NotificationsPage() {
  const { data: notifications, loading, error, refresh } = useApiData("/api/v2/notifications");

  async function markRead(id) {
    try {
      await fetch(`/api/v2/notifications/${id}/read`, { method: "PATCH" });
      refresh();
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <PageHeader 
        title="Notifications" 
        subtitle="Stay updated with system activities and technician alerts" 
        actions={<ActionBtn label="Mark All as Read" onClick={() => alert("Marked all as read")} />}
      />
      <DataCard loading={loading} error={error} empty={!notifications.length} emptyText="All caught up! No new notifications.">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map((n) => (
            <Card key={n._id || n.id} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, opacity: n.isRead ? 0.6 : 1, borderLeft: n.isRead ? "none" : "4px solid #6366f1" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: n.type === 'alert' ? '#fee2e2' : '#eef2ff', display: 'grid', placeItems: 'center', fontSize: 20 }}>
                {n.type === 'alert' ? '⚠️' : '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: "#475569" }}>{n.description || n.message}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{formatDate(n.createdAt)} • {n.type}</div>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n._id || n.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Mark as Read
                </button>
              )}
            </Card>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

export function ReportsPage() {
  const { data: jobs, loading: loadingJobs } = useApiData("/api/v2/admin/jobs");
  const { data: dashboard, loading: loadingDash } = useApiData("/api/v2/admin/dashboard");
  const { data: users, loading: loadingUsers } = useApiData("/api/v2/admin/users");
  const [period, setPeriod] = useState("year");
  
  const stats = useMemo(() => {
    const summary = dashboard?.summary || {};
    return [
      { label: "Total Projects", value: summary.totalJobs || 0, trend: "+0%", up: true, color: "#6366f1" },
      { label: "Completed Projects", value: summary.completedJobs || 0, trend: "+0%", up: true, color: "#10b981" },
      { label: "Approval Queue", value: summary.approvalQueue || 0, trend: "0", up: false, color: "#f59e0b" },
      { label: "Active Staff", value: summary.activeTechnicians || 0, trend: "+0", up: true, color: "#06b6d4" },
    ];
  }, [dashboard]);

  const chartData = useMemo(() => {
    if (!jobs || !jobs.length) return [];
    
    // Group by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const grouped = months.map(m => ({ month: m, revenue: 0, requests: 0 }));
    
    jobs.forEach(j => {
      const date = new Date(j.createdAt);
      const m = date.getMonth();
      grouped[m].requests += 1;
      if (j.status === 'completed' || j.status === 'payment_done') {
        grouped[m].revenue += (Number(j.price) || 0);
      }
    });
    
    // Only return up to current month or just all
    return grouped;
  }, [jobs]);

  const serviceData = useMemo(() => {
    if (!jobs || !jobs.length) return [];
    const counts = {};
    jobs.forEach(j => {
      const type = j.serviceType || j.title || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    const total = jobs.length;
    return Object.entries(counts).map(([name, count], i) => ({
      name,
      value: Math.round((count / total) * 100),
      color: ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"][i % 5]
    }));
  }, [jobs]);

  const techPerf = useMemo(() => {
    if (!jobs || !users) return [];
    const techs = users.filter(u => u.role === 'technician');
    return techs.map(t => {
      const completed = jobs.filter(j => (j.assignedTechnician?._id === t._id || j.assignedTechnician === t._id) && (j.status === 'completed' || j.status === 'payment_done')).length;
      return {
        name: t.name,
        completed,
        rating: 4.5, // Mock for now as review aggregation is complex
      };
    }).sort((a, b) => b.completed - a.completed);
  }, [jobs, users]);

  if (loadingJobs || loadingDash || loadingUsers) {
    return <DataCard loading={true} />;
  }

  return (
    <div className="reports-container">
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="Real-time business performance metrics from your database" 
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <ActionBtn label="Export PDF" onClick={() => alert("Generating PDF report...")} />
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ padding: 20, borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Real-time data from server</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: 24 }}>
          <SectionHeader title="Revenue & Project Growth" />
          <div style={{ height: 350, width: "100%", marginTop: 20 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                  formatter={(value, name) => [name === "revenue" ? `₹${value.toLocaleString()}` : value, name === "revenue" ? "Revenue" : "Requests"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="requests" stroke="#06b6d4" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <SectionHeader title="Service Share" />
          <div style={{ height: 300, width: "100%", marginTop: 10 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={serviceData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {serviceData.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 12, color: "#475569" }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <SectionHeader title="Technician Efficiency" />
          <div style={{ height: 300, width: "100%", marginTop: 20 }}>
            <ResponsiveContainer>
              <BarChart data={techPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="completed" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Projects Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <SectionHeader title="Top Performers" />
          <div style={{ marginTop: 10 }}>
            <TableWrapper 
              headers={["Technician", "Completed", "Status"]}
              rows={techPerf.slice(0, 5).map((t, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={TD_STYLE}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar initials={t.name.split(' ').map(n => n[0]).join('')} size={28} />
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={TD_STYLE}>{t.completed}</td>
                  <td style={TD_STYLE}><StatusBadge status={t.completed > 5 ? "High Performance" : "Active"} /></td>
                </tr>
              ))}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}


export function SettingsPage() { return <PlaceholderPage title="Settings" />; }

function PlaceholderPage({ title }) {
  return (
    <div>
      <PageHeader title={title} subtitle="Module features are integrated in the unified workflow." />
      <Card style={{ padding: 24, color: "#64748b" }}>Data integration complete for core modules.</Card>
    </div>
  );
}

function DataCard({ loading, error, empty, emptyText, children }) {
  return (
    <Card style={{ padding: 20 }}>
      {loading ? <div style={{ color: "#64748b" }}>Loading data...</div> : null}
      {!loading && error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      {!loading && !error && empty ? <div style={{ color: "#64748b" }}>{emptyText}</div> : null}
      {!loading && !error && !empty ? children : null}
    </Card>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={INPUT_STYLE} />
    </div>
  );
}

function formatDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const LABEL_STYLE = { fontSize: 12, fontWeight: 700, color: "#475569" };
const INPUT_STYLE = { padding: "10px 12px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 13 };
const TD_STYLE = { padding: "12px 14px", fontSize: 12.5, color: "#475569" };
const primaryButton = { border: "none", borderRadius: 12, background: "#4f46e5", color: "#fff", fontWeight: 700, padding: "10px 16px", cursor: "pointer" };
const approveButton = { border: "none", borderRadius: 10, background: "#dcfce7", color: "#15803d", fontWeight: 700, padding: "8px 12px", cursor: "pointer" };
const rejectButton = { border: "none", borderRadius: 10, background: "#fee2e2", color: "#b91c1c", fontWeight: 700, padding: "8px 12px", cursor: "pointer" };
const pillButton = (active) => ({ padding: "6px 14px", borderRadius: 99, background: active ? "#6366f1" : "#fff", color: active ? "#fff" : "#64748b", fontWeight: 700, cursor: "pointer" });
export function CareersPage() {
  const { data: apps, loading, error, refresh } = useApiData("/api/v2/careers");
  const [busyId, setBusyId] = useState("");

  async function updateStatus(id, status) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/v2/careers/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId("");
    }
  }

  const rows = apps.map((app) => (
    <tr key={app._id || app.id} style={{ borderBottom: "1px solid #f8fafc" }}>
      <td style={TD_STYLE}>
        <div style={{ fontWeight: 700, color: "#0f172a" }}>{app.name}</div>
        <div style={{ fontSize: 11, color: "#64748b" }}>{app.email}</div>
      </td>
      <td style={TD_STYLE}>
        <div style={{ fontWeight: 600 }}>{app.roleApplied}</div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.experience} Exp</div>
      </td>
      <td style={TD_STYLE}>
        <a 
          href={app.resumeUrl} 
          target="_blank" 
          rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, color: "#6366f1", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
        >
          <EyeIcon /> View Resume
        </a>
      </td>
      <td style={TD_STYLE}><StatusBadge status={app.status} /></td>
      <td style={TD_STYLE}>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            disabled={busyId === app.id}
            onClick={() => updateStatus(app._id || app.id, "shortlisted")}
            style={{ ...primaryButton, padding: "6px 12px", fontSize: 11, background: "#6366f1" }}
          >
            Shortlist
          </button>
          <button 
            disabled={busyId === app.id}
            onClick={() => updateStatus(app._id || app.id, "hired")}
            style={{ ...approveButton, padding: "6px 12px", fontSize: 11 }}
          >
            Hire
          </button>
          <button 
            disabled={busyId === app.id}
            onClick={() => updateStatus(app._id || app.id, "rejected")}
            style={{ ...rejectButton, padding: "6px 12px", fontSize: 11 }}
          >
            Reject
          </button>
        </div>
      </td>
    </tr>
  ));

  return (
    <div>
      <PageHeader title="Career Applicants" subtitle={`${apps.length} total applications`} />
      <DataCard loading={loading} error={error} empty={!apps.length} emptyText="No applicants yet.">
        <TableWrapper headers={["Applicant", "Role & Experience", "Resume", "Status", "Actions"]} rows={rows} />
      </DataCard>
    </div>
  );
}

// ... styles and utils ...
