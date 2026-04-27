import React, { useEffect, useMemo, useState } from "react";
import { PlusIcon, EditIcon, TrashIcon } from "./Icons";
import { PageHeader, SearchFilter, Card, TableWrapper, Avatar, StatusBadge, ActionBtn, StarRating, SectionHeader } from "./UI";

function useApiData(url, initial = []) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(url);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to load data");
      setData(payload.data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [url]);

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", mobileNumber: "", password: "", role: "technician" });
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const url = editingId ? `/api/v2/admin/users/${editingId}` : "/api/v2/admin/users";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to save user");
      
      if (!editingId) {
        alert(`User created! Credentials:\nMobile: ${payload.data.mobileNumber}\nPassword: ${payload.data.password}`);
      }
      
      await refreshUsers();
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", mobileNumber: "", password: "", role: "technician" });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(user) {
    setEditingId(user._id || user.id);
    setForm({ name: user.name, mobileNumber: user.mobileNumber, role: user.role, password: "" });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/v2/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      await refreshUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${users.length} active technicians/managers`} actions={<ActionBtn icon={<PlusIcon />} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({name: "", mobileNumber: "", password: "", role: "technician"}); }} label={showForm ? "Close Form" : "Create User"} primary />} />

      {showForm && (
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <SectionHeader title={editingId ? "Edit Staff Account" : "Register New Staff Account"} />
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Full Name" value={form.name} onChange={(v) => setForm({...form, name: v})} />
            <Field label="Mobile Number" value={form.mobileNumber} onChange={(v) => setForm({...form, mobileNumber: v})} />
            {!editingId && <Field label="Password" value={form.password} onChange={(v) => setForm({...form, password: v})} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={LABEL_STYLE}>Role</label>
              <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} disabled={!!editingId} style={INPUT_STYLE}>
                <option value="technician">Technician</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#f43f5e", fontSize: 12 }}>{formError}</span>
              <button type="submit" disabled={saving} style={primaryButton}>{saving ? "Saving..." : (editingId ? "Update Account" : "Create Account")}</button>
            </div>
          </form>
        </Card>
      )}

      <DataCard loading={loading} error={error} empty={!users.length} emptyText="No users found.">
        <TableWrapper
          headers={["Staff Member", "Role", "Specialty / Info", "Status", "Actions"]}
          rows={users.map((u) => (
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
              <td style={TD_STYLE}>{u.specialty || "—"}</td>
              <td style={TD_STYLE}><StatusBadge status={u.status} /></td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button title="Edit" onClick={() => startEdit(u)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}><EditIcon /></button>
                  <button title="Delete" onClick={() => handleDelete(u._id || u.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#f43f5e" }}><TrashIcon /></button>
                </div>
              </td>
            </tr>
          ))}
        />
      </DataCard>
    </div>
  );
}

export function JobsPage() {
  const { data: jobs, loading, error, refresh: refreshJobs } = useApiData("/api/v2/admin/jobs");
  const { data: users } = useApiData("/api/v2/admin/users");
  const technicians = useMemo(() => users.filter(u => u.role === 'technician'), [users]);
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ title: "", customerName: "", customerPhone: "", location: "", technicianId: "", price: "", description: "" });

  const filteredJobs = useMemo(() => {
    if (statusFilter === "All") return jobs;
    return jobs.filter(j => j.status === statusFilter || j.rawStatus === statusFilter);
  }, [jobs, statusFilter]);

  async function handleCreateJob(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const res = await fetch("/api/admin/jobs", { // Using standard jobs creation
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create job");
      await refreshJobs();
      setShowForm(false);
      setForm({ title: "", customerName: "", customerPhone: "", location: "", technicianId: "", price: "", description: "" });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Project Repository" subtitle={`${filteredJobs.length} jobs available`} actions={<ActionBtn icon={<PlusIcon />} onClick={() => setShowForm(!showForm)} label={showForm ? "Close Form" : "Create Project"} primary />} />
      {showForm && (
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <SectionHeader title="Assign New Project" />
          <form onSubmit={handleCreateJob} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Service Name" value={form.title} onChange={(v) => setForm({...form, title: v})} />
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
      <DataCard loading={loading} error={error} empty={!filteredJobs.length} emptyText="No jobs found.">
        <TableWrapper
          headers={["Customer", "Service", "Technician", "Location", "Status", "Created"]}
          rows={filteredJobs.map((job) => (
            <tr key={job._id || job.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}><div style={{ fontWeight: 700, color: "#0f172a" }}>{job.customerName || "Client"}</div></td>
              <td style={TD_STYLE}>{job.title || job.serviceName}</td>
              <td style={TD_STYLE}>{job.assignedTechnician?.name || "Unassigned"}</td>
              <td style={TD_STYLE}>{job.location || job.address}</td>
              <td style={TD_STYLE}><StatusBadge status={job.status} /></td>
              <td style={TD_STYLE}>{formatDate(job.createdAt)}</td>
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

  async function updateRequest(taskId, action) {
    try {
      setBusyId(taskId);
      const res = await fetch(`/api/v2/admin/completion-requests/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed to update request");
      await refresh();
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHeader title="Completion Requests" subtitle={`${requests.length} requests awaiting approval`} />
      <DataCard loading={loading} error={error} empty={!requests.length} emptyText="No pending approval requests.">
        <TableWrapper
          headers={["Customer", "Service", "Technician", "Submitted", "Actions"]}
          rows={requests.map((request) => (
            <tr key={request.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}>{request.customerName}</td>
              <td style={TD_STYLE}>{request.title || request.serviceName}</td>
              <td style={TD_STYLE}>{request.technicianName}</td>
              <td style={TD_STYLE}>{formatDate(request.updatedAt)}</td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={busyId === request.id} onClick={() => updateRequest(request.id, "approve")} style={approveButton}>Approve</button>
                  <button disabled={busyId === request.id} onClick={() => updateRequest(request.id, "reject")} style={rejectButton}>Reject</button>
                </div>
              </td>
            </tr>
          ))}
        />
      </DataCard>
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
  const { data: technicians, loading, error } = useApiData("/api/v2/admin/tracking");
  return (
    <div>
      <PageHeader title="Live Tracking" subtitle="Real-time technician monitoring" />
      <DataCard loading={loading} error={error} empty={!technicians.length} emptyText="No tracking data.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <Card style={{ minHeight: 460, padding: 24, background: "#0f172a" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {technicians.map((tech) => (
                <div key={tech.technicianId} style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ color: "#fff", fontWeight: 700 }}>{tech.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>{tech.lat.toFixed(4)}, {tech.lng.toFixed(4)}</div>
                  <div style={{ color: tech.isOnline ? "#4ade80" : "#94a3b8", fontSize: 11 }}>{tech.isOnline ? "Online" : "Offline"}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <SectionHeader title="Staff List" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {technicians.map((tech) => (
                <div key={tech.technicianId} style={{ display: "flex", justifyContent: "space-between", padding: 12, borderRadius: 12, background: "#f8fafc" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{tech.name}</div>
                  <StatusBadge status={tech.isOnline ? "Available" : "Offline"} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </DataCard>
    </div>
  );
}

export function AttendancePage() {
  const { data: attendanceList, loading, error } = useApiData("/api/v2/attendance/today");

  return (
    <div>
      <PageHeader title="Daily Attendance" subtitle={`Tracking staff presence for today: ${new Date().toLocaleDateString()}`} />
      
      <DataCard loading={loading} error={error} empty={!attendanceList.length} emptyText="No staff members found.">
        <TableWrapper
          headers={["Staff Member", "Role", "Date", "Status", "Login Time", "Logout Time", "Work Hours"]}
          rows={attendanceList.map((record) => {
            const isPresent = record.status === "present";
            return (
              <tr key={record.id || record.userId} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={TD_STYLE}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{record.name}</div>
                </td>
                <td style={TD_STYLE}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{record.role}</div>
                </td>
                <td style={TD_STYLE}>{record.date}</td>
                <td style={TD_STYLE}>
                  <span style={{ 
                    padding: "4px 10px", 
                    borderRadius: 99, 
                    fontSize: 11, 
                    fontWeight: 700, 
                    background: isPresent ? "#dcfce7" : "#fee2e2", 
                    color: isPresent ? "#15803d" : "#b91c1c" 
                  }}>
                    {record.status.toUpperCase()}
                  </span>
                </td>
                <td style={TD_STYLE}>{record.loginTime ? new Date(record.loginTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td style={TD_STYLE}>{record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td style={TD_STYLE}>{record.workingHours || 0} hrs</td>
              </tr>
            );
          })}
        />
      </DataCard>
    </div>
  );
}

export function ServicesPage() { return <PlaceholderPage title="Services" />; }
export function PaymentsPage() {
  const { data: requests, loading, error, refresh } = useApiData("/api/v2/admin/payment-requests");
  const [busyId, setBusyId] = useState("");

  async function updateRequest(jobId, action) {
    try {
      setBusyId(jobId);
      const res = await fetch(`/api/v2/admin/payment-requests/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed to update payment request");
      await refresh();
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHeader title="Payment Verification" subtitle={`${requests.length} payments awaiting confirmation`} />
      <DataCard loading={loading} error={error} empty={!requests.length} emptyText="No pending payment verifications.">
        <TableWrapper
          headers={["Customer", "Service", "Technician", "Amount", "Status", "Actions"]}
          rows={requests.map((request) => (
            <tr key={request.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{request.customerName}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{request.customerPhone}</div>
              </td>
              <td style={TD_STYLE}>{request.serviceName}</td>
              <td style={TD_STYLE}>{request.technicianName}</td>
              <td style={TD_STYLE}><div style={{ fontWeight: 700, color: "#0f172a" }}>₹{request.amount}</div></td>
              <td style={TD_STYLE}><StatusBadge status={request.paymentStatus} /></td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={busyId === request.id} onClick={() => updateRequest(request.id, "approve")} style={approveButton}>Approve</button>
                  <button disabled={busyId === request.id} onClick={() => updateRequest(request.id, "reject")} style={rejectButton}>Reject</button>
                </div>
              </td>
            </tr>
          ))}
        />
      </DataCard>
    </div>
  );
}
export function NotificationsPage() { return <PlaceholderPage title="Notifications" />; }
export function ReportsPage() { return <PlaceholderPage title="Reports" />; }
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
