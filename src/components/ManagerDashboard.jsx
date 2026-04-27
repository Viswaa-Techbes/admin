import React, { useEffect, useState } from "react";
import { Card, StatusBadge, SectionHeader, TableWrapper } from "./UI";
import * as Icons from "./Icons";

const STAT_META = [
  { key: "totalLeads", label: "Total Leads", icon: <Icons.UsersIcon />, color: "#6366f1", bg: "#eef2ff" },
  { key: "totalJobs", label: "Total Jobs", icon: <Icons.BriefcaseIcon />, color: "#3b82f6", bg: "#eff6ff" },
  { key: "completedJobs", label: "Completed Jobs", icon: <Icons.GridIcon />, color: "#10b981", bg: "#ecfdf5" },
  { key: "activeTechnicians", label: "Active Technicians", icon: <Icons.WrenchIcon />, color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "pendingRequests", label: "Approval Queue", icon: <Icons.BellIcon />, color: "#f43f5e", bg: "#fff1f2" },
  { key: "paymentApprovals", label: "Payment Queue", icon: <Icons.CreditCardIcon />, color: "#0f766e", bg: "#ecfeff" },
];

export function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard");
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.message || "Failed to load dashboard");
        }
        if (!ignore) {
          setData(payload.data);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const summary = data?.summary || {};
  const recentJobs = data?.recentJobs || [];
  const liveTechnicians = data?.liveTechnicians || [];
  const pendingRequests = data?.pendingRequests || [];
  const recentReviews = data?.recentReviews || [];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 20 }}>
        {STAT_META.map((item) => (
          <Card key={item.key} style={{ padding: 18, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: item.bg, color: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon}
              </div>
              <div style={{ padding: "4px 8px", borderRadius: 8, background: "#f8fafc", fontSize: 10, fontWeight: 700, color: "#64748b" }}>LIVE</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>
              {loading ? "..." : summary[item.key] ?? 0}
            </div>
            <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{item.label}</div>
          </Card>
        ))}
      </div>

      {error ? <Card style={{ padding: 20, marginBottom: 16, color: "#b91c1c" }}>{error}</Card> : null}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: 20 }}>
          <SectionHeader title="Manager Actions" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <ActionCard title="Completion Requests" subtitle={`${pendingRequests.length} jobs are waiting for approval`} color="#8b5cf6" onClick={() => onNavigate?.("requests")} />
            <ActionCard title="Assign New Project" subtitle="Create and dispatch a service request" color="#1d4ed8" onClick={() => onNavigate?.("jobs")} />
            <ActionCard title="Payment Requests" subtitle={`${data?.paymentRequests?.length || 0} payments are waiting for confirmation`} color="#0f766e" onClick={() => onNavigate?.("payments")} />
            <ActionCard title="Technician Reviews" subtitle={`${recentReviews.length} latest feedback entries`} color="#f59e0b" onClick={() => onNavigate?.("reviews")} />
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionHeader title="Live Tracking Snapshot" action="Tracking" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(liveTechnicians.length ? liveTechnicians : [{ id: "empty", name: "No technicians online", status: "Offline", specialty: "Waiting for field updates" }]).slice(0, 5).map((tech) => (
              <div key={tech.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{tech.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{tech.specialty || tech.email || "Technician"}</div>
                </div>
                <StatusBadge status={tech.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <SectionHeader title="Recent Service Requests" action="Jobs" />
          <TableWrapper
            headers={["Customer", "Service", "Technician", "Status", "Created"]}
            rows={recentJobs.map((job) => (
              <tr key={job.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={TD_STYLE}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{job.customerName || "Client"}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{job.location}</div>
                </td>
                <td style={TD_STYLE}>{job.title}</td>
                <td style={TD_STYLE}>{job.technicianName || "Unassigned"}</td>
                <td style={TD_STYLE}><StatusBadge status={job.status} /></td>
                <td style={TD_STYLE}>{formatDate(job.createdAt)}</td>
              </tr>
            ))}
          />
          {!loading && recentJobs.length === 0 ? <EmptyText text="No service requests available yet." /> : null}
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionHeader title="Recent Reviews" action="Reviews" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentReviews.length ? recentReviews.slice(0, 5).map((review) => (
              <div key={review.id} style={{ padding: "14px 16px", borderRadius: 14, background: "#fff7ed", border: "1px solid #fed7aa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412" }}>{review.technicianName}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ea580c" }}>{review.rating}/5</div>
                </div>
                <div style={{ fontSize: 12, color: "#7c2d12", marginBottom: 4 }}>{review.comment || "No written feedback"}</div>
                <div style={{ fontSize: 11, color: "#9a3412" }}>{review.clientName || "Anonymous"} • {formatDate(review.createdAt)}</div>
              </div>
            )) : <EmptyText text="No review activity yet." />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActionCard({ title, subtitle, color, onClick }) {
  return (
    <button onClick={onClick} style={{ border: "1px solid #e2e8f0", borderRadius: 18, background: "#fff", padding: 18, cursor: "pointer", textAlign: "left", boxShadow: "0 4px 12px rgba(15,23,42,0.04)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
        GO
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{subtitle}</div>
    </button>
  );
}

function EmptyText({ text }) {
  return <div style={{ paddingTop: 16, fontSize: 12, color: "#94a3b8" }}>{text}</div>;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TD_STYLE = { padding: "12px 14px", fontSize: 12.5, color: "#475569", verticalAlign: "top" };
