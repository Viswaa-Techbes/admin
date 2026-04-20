import React, { useEffect, useMemo, useState } from "react";
import { PlusIcon } from "./Icons";
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
  const { data: leads, loading, error } = useApiData("/api/leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [groupByPincode, setGroupByPincode] = useState(false);

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

  const groupedRows = filteredLeads.reduce((acc, lead) => {
    const key = lead.pincode || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(lead);
    return acc;
  }, {});

  const rows = groupByPincode
    ? Object.entries(groupedRows).flatMap(([pin, bucket]) => [
        <tr key={`group-${pin}`} style={{ background: "#f8fafc" }}>
          <td colSpan="6" style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#475569" }}>
            Pincode {pin} • {bucket.length} leads
          </td>
        </tr>,
        ...bucket.map((lead, index) => leadRow(lead, index)),
      ])
    : filteredLeads.map((lead, index) => leadRow(lead, index));

  return (
    <div className="font-[family-name:var(--font-geist-sans)] max-w-[1400px] mx-auto">
      <PageHeader title="Lead Management" subtitle={`${filteredLeads.length} leads available`} actions={<ActionBtn icon={<PlusIcon />} label="Add Lead" primary />} />
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
        <TableWrapper headers={["Customer", "Contact", "Plan", "Pincode", "Date", "Status"]} rows={rows} />
      </DataCard>
    </div>
  );
}

function leadRow(lead, index) {
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
    </tr>
  );
}

export function TechniciansPage() {
  const { data: technicians, loading, error } = useApiData("/api/admin/technicians");
  return (
    <div>
      <PageHeader title="Technician Management" subtitle={`${technicians.length} technicians in the system`} />
      <DataCard loading={loading} error={error} empty={!technicians.length} emptyText="No technicians found yet.">
        <TableWrapper
          headers={["Technician", "Specialty", "Status", "Location", "Joined"]}
          rows={technicians.map((tech) => (
            <tr key={tech.id} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={TD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar initials={(tech.name || "?").charAt(0)} size={34} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{tech.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{tech.email}</div>
                  </div>
                </div>
              </td>
              <td style={TD_STYLE}>{tech.specialty || "General service"}</td>
              <td style={TD_STYLE}><StatusBadge status={tech.status} /></td>
              <td style={TD_STYLE}>{tech.lat && tech.lng ? `${tech.lat.toFixed(3)}, ${tech.lng.toFixed(3)}` : "Not shared"}</td>
              <td style={TD_STYLE}>{formatDate(tech.createdAt)}</td>
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
    if (statusFilter === "Active") return jobs.filter((job) => job.rawStatus === "inProgress");
    if (statusFilter === "Done") return jobs.filter((job) => ["completed", "pendingApproval"].includes(job.rawStatus));
    if (statusFilter === "Pending Approval") return jobs.filter((job) => job.rawStatus === "pendingApproval");
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
  const { data: attendanceList, loading, error } = useApiData("/api/admin/attendance");

  const total = attendanceList.length;
  const present = attendanceList.filter((u) => u.status === "present").length;
  const absent = total - present;

  return (
    <div>
      <PageHeader title="Daily Attendance Overview" subtitle="Real-time daily login monitoring" />
      <DataCard loading={loading} error={error} empty={!attendanceList.length} emptyText="No attendance data is available.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 20, textAlign: "center", border: "2px solid rgba(59,130,246,0.3)" }}>
            <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Total Technicians</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#3b82f6" }}>{total}</div>
          </Card>
          <Card style={{ padding: 20, textAlign: "center", border: "2px solid rgba(34,197,94,0.3)" }}>
            <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Present Today</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#22c55e" }}>{present}</div>
          </Card>
          <Card style={{ padding: 20, textAlign: "center", border: "2px solid rgba(239,68,68,0.3)" }}>
            <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Absent Today</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#ef4444" }}>{absent}</div>
          </Card>
        </div>
        <TableWrapper
          headers={["Technician", "Status", "Login", "Logout", "Duration"]}
          rows={attendanceList.map((user) => {
            const isPresent = user.status === "present";
            return (
              <tr key={user.technicianId || user.email} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={TD_STYLE}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{user.name || "Unknown"}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{user.email}</div>
                </td>
                <td style={TD_STYLE}>
                  <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: isPresent ? "#dcfce7" : "#fee2e2", color: isPresent ? "#15803d" : "#b91c1c" }}>
                    {isPresent ? "PRESENT" : "ABSENT"}
                  </span>
                </td>
                <td style={TD_STYLE}>{user.loginTime ? new Date(user.loginTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "N/A"}</td>
                <td style={TD_STYLE}>{user.logoutTime ? new Date(user.logoutTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—"}</td>
                <td style={TD_STYLE}>{user.workingHours ? `${user.workingHours} hrs` : "—"}</td>
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
