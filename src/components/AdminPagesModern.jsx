import React, { useEffect, useMemo, useState } from "react";
import { PlusIcon, EditIcon, TrashIcon } from "./Icons";
import { PageHeader, SearchFilter, Card, TableWrapper, Avatar, StatusBadge, ActionBtn, StarRating, SectionHeader } from "./UI";

function useApiData(url, initial = []) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(url);
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.message || "Failed to load data");
        if (!ignore) {
          setData(payload.data || payload.users || []);
          setError("");
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [url]);

  return { data, setData, loading, error };
}

export function CustomersPage() {
  const { data: leads, setData: setLeads, loading, error } = useApiData("/api/leads");
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
      const url = editingId ? `/api/v2/admin/leads/${editingId}` : "/api/leads";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to save lead");
      if (editingId) {
        setLeads(leads.map(l => (l._id || l.id) === editingId ? { ...l, ...payload.data } : l));
      } else {
        setLeads([payload.data, ...leads]);
      }
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
      setLeads(leads.filter(l => (l._id || l.id) !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const groupedRows = filteredLeads.reduce((acc, lead) => {
    const key = lead.pincode || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(lead);
    return acc;
  }, {});

  const rows = groupByPincode
    ? Object.entries(groupedRows).flatMap(([pin, bucket]) => [
        <tr key={`group-${pin}`} style={{ background: "#f8fafc" }}>
          <td colSpan="7" style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#475569" }}>
            Pincode {pin} • {bucket.length} leads
          </td>
        </tr>,
        ...bucket.map((lead, index) => leadRow(lead, index, handleDelete)),
      ])
    : filteredLeads.map((lead, index) => leadRow(lead, index, handleDelete));

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
      <DataCard loading={loading} error={error} empty={!filteredLeads.length} emptyText="No leads found for the selected filters.">
        <TableWrapper headers={["Customer", "Contact", "Plan", "Pincode", "Date", "Status", "Actions"]} rows={rows} />
      </DataCard>
    </div>
  );
}

function leadRow(lead, index, onDelete) {
  const id = lead._id || lead.id;
  return (
    <tr key={lead._id || lead.id || `${lead.email}-${index}`} style={{ borderBottom: "1px solid #f8fafc" }}>
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
          <button title="Edit" onClick={() => startEdit(lead)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}><EditIcon /></button>
          <button title="Delete" onClick={() => onDelete(id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#f43f5e" }}><TrashIcon /></button>
        </div>
      </td>
    </tr>
  );
}

export function TechniciansPage() {
  const { data: users, setData: setUsers, loading, error } = useApiData("/api/admin/users");
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
      const url = editingId ? `/api/v2/admin/update-user/${editingId}` : "/api/v2/admin/create-user";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to save user");
      
      if (editingId) {
        setUsers(users.map(u => u.id === editingId ? { ...u, ...payload.data } : u));
        alert("User updated successfully!");
      } else {
        alert(`User created! Credentials:\nMobile: ${payload.data.mobileNumber}\nPassword: ${payload.data.password}`);
        setUsers([payload.data, ...users]);
      }
      
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
    setEditingId(user.id);
    setForm({ name: user.name, mobileNumber: user.mobileNumber, role: user.role, password: "" });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/v2/admin/delete-user/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <PageHeader 
        title="User Management" 
        subtitle={`${users.length} active technicians/managers`} 
        actions={<ActionBtn icon={<PlusIcon />} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({name: "", mobileNumber: "", password: "", role: "technician"}); }} label={showForm ? "Close Form" : "Create User"} primary />} 
      />

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
            <tr key={u.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar initials={(u.name || "?").charAt(0)} size={34} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{u.mobileNumber}</div>
                  </div>
                </div>
              </td>
              <td style={TD_STYLE}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: u.role === "manager" ? "#6366f1" : "#64748b" }}>{u.role}</span>
              </td>
              <td style={TD_STYLE}>{u.specialty || "—"}</td>
              <td style={TD_STYLE}><StatusBadge status={u.status} /></td>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button title="Edit" onClick={() => startEdit(u)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}><EditIcon /></button>
                  <button title="Delete" onClick={() => handleDelete(u.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#f43f5e" }}><TrashIcon /></button>
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
  const { data: jobs, setData: setJobs, loading, error } = useApiData("/api/admin/jobs");
  const { data: technicians } = useApiData("/api/admin/technicians");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ serviceName: "", customerName: "", customerPhone: "", address: "", technicianId: "", price: "", time: "", description: "" });

  const filteredJobs = useMemo(() => {
    if (statusFilter === "All") return jobs;
    if (statusFilter === "Active") return jobs.filter((job) => ["started", "work_uploaded", "completion_requested"].includes(job.rawStatus));
    if (statusFilter === "Done") return jobs.filter((job) => ["completed", "payment_done", "approved_by_manager", "payment_pending"].includes(job.rawStatus));
    if (statusFilter === "Pending Approval") return jobs.filter((job) => job.rawStatus === "completion_requested" || job.rawStatus === "work_uploaded");
    return jobs.filter((job) => job.status === statusFilter);
  }, [jobs, statusFilter]);

  async function handleCreateJob(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: form.price ? Number(form.price) : 0 }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to create job");
      setJobs((current) => [payload.data, ...current]);
      setShowForm(false);
      setForm({ serviceName: "", customerName: "", customerPhone: "", address: "", technicianId: "", price: "", time: "", description: "" });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Project Repository" subtitle={`${filteredJobs.length} jobs in the selected lane`} actions={<ActionBtn icon={<PlusIcon />} label={showForm ? "Close Form" : "Create Project"} primary />} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {["All", "Assigned", "Active", "Done", "Pending Approval"].map((status) => (
          <button key={status} onClick={() => setStatusFilter(status)} style={pillButton(statusFilter === status)}>{status}</button>
        ))}
      </div>
      <button onClick={() => setShowForm((value) => !value)} style={{ ...pillButton(showForm), marginBottom: 16 }}>
        {showForm ? "Hide Create Project" : "Open Create Project"}
      </button>
      {showForm ? (
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <SectionHeader title="Assign New Project" />
          <form onSubmit={handleCreateJob} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <Field label="Service Name" value={form.serviceName} onChange={(value) => setForm((current) => ({ ...current, serviceName: value }))} />
            <Field label="Customer Name" value={form.customerName} onChange={(value) => setForm((current) => ({ ...current, customerName: value }))} />
            <Field label="Customer Phone" value={form.customerPhone} onChange={(value) => setForm((current) => ({ ...current, customerPhone: value }))} />
            <Field label="Address" value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} />
            <Field label="Price" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} />
            <Field label="Schedule" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={LABEL_STYLE}>Technician</label>
              <select value={form.technicianId} onChange={(event) => setForm((current) => ({ ...current, technicianId: event.target.value }))} style={INPUT_STYLE}>
                <option value="">Unassigned</option>
                {technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
              </select>
            </div>
            <Field label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#dc2626" }}>{formError}</span>
              <button type="submit" disabled={saving} style={primaryButton}>{saving ? "Creating..." : "Create Project"}</button>
            </div>
          </form>
        </Card>
      ) : null}
      <DataCard loading={loading} error={error} empty={!filteredJobs.length} emptyText="No jobs found for this lane.">
        <TableWrapper
          headers={["Customer", "Service", "Technician", "Location", "Status", "Created"]}
          rows={filteredJobs.map((job) => (
            <tr key={job.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}><div style={{ fontWeight: 700, color: "#0f172a" }}>{job.customerName || "Client"}</div><div style={{ fontSize: 12, color: "#64748b" }}>{job.customerPhone || "No phone"}</div></td>
              <td style={TD_STYLE}>{job.serviceName}</td>
              <td style={TD_STYLE}>{job.technicianName || "Unassigned"}</td>
              <td style={TD_STYLE}>{job.address}</td>
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
  const { data: requests, setData: setRequests, loading, error } = useApiData("/api/admin/completion-requests");
  const [busyId, setBusyId] = useState("");

  async function updateRequest(taskId, action) {
    try {
      setBusyId(taskId);
      const res = await fetch(`/api/admin/completion-requests/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to update request");
      setRequests((current) => current.filter((item) => item.id !== taskId));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHeader title="Completion Requests" subtitle={`${requests.length} requests awaiting approval`} />
      <DataCard loading={loading} error={error} empty={!requests.length} emptyText="No pending approval requests right now.">
        <TableWrapper
          headers={["Customer", "Service", "Technician", "Submitted", "Actions"]}
          rows={requests.map((request) => (
            <tr key={request.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}>{request.customerName || "Client"}</td>
              <td style={TD_STYLE}>{request.serviceName}</td>
              <td style={TD_STYLE}>{request.technicianName || "Unassigned"}</td>
              <td style={TD_STYLE}>{formatDate(request.updatedAt || request.createdAt)}</td>
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
  const { data: reviews, loading, error } = useApiData("/api/admin/reviews");
  return (
    <div>
      <PageHeader title="Technician Reviews" subtitle={`${reviews.length} feedback entries from completed work`} />
      <DataCard loading={loading} error={error} empty={!reviews.length} emptyText="No reviews available yet.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {reviews.map((review) => (
            <Card key={review.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{review.technicianName}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{review.serviceName || "General feedback"}</div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginBottom: 10 }}>{review.comment || "No written feedback provided."}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{review.clientName || "Anonymous"} • {formatDate(review.createdAt)}</div>
            </Card>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

export function TrackingPage() {
  const { data: technicians, loading, error } = useApiData("/api/admin/tracking");
  return (
    <div>
      <PageHeader title="Live Tracking" subtitle="Real-time technician location monitoring" />
      <DataCard loading={loading} error={error} empty={!technicians.length} emptyText="No technician tracking data is available.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <Card style={{ minHeight: 460, padding: 24, background: "linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)" }}>
            <div style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 18 }}>Location feed</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {technicians.map((tech) => (
                <div key={tech.id} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(148,163,184,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ color: "#fff", fontWeight: 700 }}>{tech.name}</div>
                    <span style={{ color: "#93c5fd", fontSize: 12 }}>{tech.isOnline ? "Online" : "Offline"}</span>
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: 12, marginBottom: 6 }}>{tech.specialty || "Field technician"}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>{tech.lat && tech.lng ? `${tech.lat.toFixed(4)}, ${tech.lng.toFixed(4)}` : "Location not available"}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <SectionHeader title="Status Feed" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {technicians.map((tech) => (
                <div key={tech.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{tech.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{tech.phoneNumber || tech.email}</div>
                  </div>
                  <StatusBadge status={tech.status} />
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
  const [filterMode, setFilterMode] = useState("day"); // day, month, year
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (filterMode === "day") params.append("date", selectedDate);
    if (filterMode === "month") {
      params.append("month", selectedMonth);
      params.append("year", selectedYear);
    }
    if (filterMode === "year") params.append("year", selectedYear);
    return `/api/v2/attendance?${params.toString()}`;
  }, [filterMode, selectedDate, selectedMonth, selectedYear]);

  const { data: attendanceList, loading, error } = useApiData(apiUrl);

  return (
    <div>
      <PageHeader title="Attendance Reporting" subtitle="View and filter staff attendance records" />
      
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["day", "month", "year"].map((m) => (
              <button key={m} onClick={() => setFilterMode(m)} style={pillButton(filterMode === m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {filterMode === "day" && (
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={INPUT_STYLE} />
          )}

          {filterMode === "month" && (
            <div style={{ display: "flex", gap: 8 }}>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={INPUT_STYLE}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ ...INPUT_STYLE, width: 80 }} />
            </div>
          )}

          {filterMode === "year" && (
            <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ ...INPUT_STYLE, width: 100 }} />
          )}
        </div>
      </Card>

      <DataCard loading={loading} error={error} empty={!attendanceList.length} emptyText="No attendance records found for this period.">
        <TableWrapper
          headers={["Technician", "Role", "Date", "Status", "Login", "Logout", "Work Hours"]}
          rows={attendanceList.map((record, idx) => {
            const isPresent = record.status === "present";
            return (
              <tr key={record.userId + record.date + idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={TD_STYLE}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{record.name}</div>
                </td>
                <td style={TD_STYLE}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{record.role}</div>
                </td>
                <td style={TD_STYLE}>{record.date}</td>
                <td style={TD_STYLE}>
                  <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: isPresent ? "#dcfce7" : "#fee2e2", color: isPresent ? "#15803d" : "#b91c1c" }}>
                    {record.status.toUpperCase()}
                  </span>
                </td>
                <td style={TD_STYLE}>{record.loginTime ? new Date(record.loginTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td style={TD_STYLE}>{record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td style={TD_STYLE}>{record.workingHours} hrs</td>
              </tr>
            );
          })}
        />
      </DataCard>
    </div>
  );
}

export function ServicesPage() {
  return <PlaceholderPage title="Services" subtitle="Service catalog UI still uses placeholder content. Manager functions now live in jobs, requests, reviews, tracking, and dashboard." />;
}

export function PaymentsPage() {
  const { data: requests, setData: setRequests, loading, error } = useApiData("/api/admin/payment-requests");
  const [busyId, setBusyId] = useState("");

  async function updateRequest(jobId, action) {
    try {
      setBusyId(jobId);
      const res = await fetch(`/api/admin/payment-requests/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to update payment request");
      setRequests((current) => current.filter((item) => item.id !== jobId));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHeader title="Payment Requests" subtitle={`${requests.length} payment confirmations awaiting admin approval`} />
      <DataCard loading={loading} error={error} empty={!requests.length} emptyText="No payment confirmations are waiting right now.">
        <TableWrapper
          headers={["Customer", "Service", "Amount", "Technician", "Payment", "Actions"]}
          rows={requests.map((request) => (
            <tr key={request.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{request.customerName || "Client"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{request.customerPhone || "No phone"}</div>
              </td>
              <td style={TD_STYLE}>{request.title || request.serviceName || "Service Job"}</td>
              <td style={TD_STYLE}>INR {Number(request.amount || request.price || 0).toFixed(2)}</td>
              <td style={TD_STYLE}>{request.technicianName || "Unassigned"}</td>
              <td style={TD_STYLE}>
                <div>{request.paymentId || "Awaiting capture id"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{request.paymentStatus || "pending"}</div>
              </td>
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

export function NotificationsPage() {
  return <PlaceholderPage title="Notifications" subtitle="Notifications are still placeholder-only. Use dashboard, requests, and reviews for live operational updates." />;
}

export function ReportsPage() {
  return <PlaceholderPage title="Reports & Analytics" subtitle="Analytics remain placeholder content. Core manager functionality is now data-backed in the admin workflow pages." />;
}

export function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  async function submit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = await res.json();
    setStatus({ type: res.ok ? "success" : "error", message: payload.message || (res.ok ? "Password updated." : "Unable to update password.") });
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account security and admin actions" />
      <Card style={{ padding: 20, maxWidth: 720 }}>
        <SectionHeader title="Change Password" />
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <Field label="Current Password" type="password" value={currentPassword} onChange={setCurrentPassword} />
          <Field label="New Password" type="password" value={newPassword} onChange={setNewPassword} />
          {status.message ? <div style={{ color: status.type === "success" ? "#15803d" : "#b91c1c", fontSize: 12 }}>{status.message}</div> : null}
          <div><button type="submit" style={primaryButton}>Update Password</button></div>
        </form>
      </Card>
    </div>
  );
}

function PlaceholderPage({ title, subtitle }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card style={{ padding: 24, color: "#64748b" }}>
        The operational manager module features now live in the dashboard, service requests, completion requests, technician reviews, and live tracking pages.
      </Card>
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
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} style={INPUT_STYLE} />
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function pillButton(active) {
  return { padding: "6px 14px", borderRadius: 999, border: "1px solid #e2e8f0", background: active ? "#6366f1" : "#fff", color: active ? "#fff" : "#64748b", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
}

const LABEL_STYLE = { fontSize: 12, fontWeight: 700, color: "#475569" };
const INPUT_STYLE = { padding: "10px 12px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none", fontSize: 13 };
const TD_STYLE = { padding: "12px 14px", fontSize: 12.5, color: "#475569", verticalAlign: "top" };
const primaryButton = { border: "none", borderRadius: 12, background: "#4f46e5", color: "#fff", fontWeight: 700, padding: "10px 16px", cursor: "pointer" };
const approveButton = { border: "none", borderRadius: 10, background: "#dcfce7", color: "#15803d", fontWeight: 700, padding: "8px 12px", cursor: "pointer" };
const rejectButton = { border: "none", borderRadius: 10, background: "#fee2e2", color: "#b91c1c", fontWeight: 700, padding: "8px 12px", cursor: "pointer" };
