"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  PageHeader, 
  Card, 
  StatusBadge, 
  useToast, 
  Modal 
} from "./UI";
import { apiFetch } from "../lib/apiClient";

// Custom API helper
function useApiData(url, initial = []) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const { payload } = await apiFetch(url);
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

export function QuoteRequestsPage() {
  const toast = useToast();
  
  // API Data
  const { data: quotes, loading, error, refresh: refreshQuotes } = useApiData("/api/v2/admin/quotes");
  const { data: users } = useApiData("/api/v2/admin/users");
  
  // Filter technicians
  const technicians = useMemo(() => users.filter(u => u.role === 'technician' || u.role === 'manager'), [users]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("All");

  // Selected Quote Detail State
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [converting, setConverting] = useState(false);

  // Form edit states inside drawer
  const [adminNotes, setAdminNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("");

  // Extracted unique values for filter options
  const uniqueAreas = useMemo(() => {
    const areas = quotes.map(q => q.locality).filter(Boolean);
    return ["All", ...new Set(areas)];
  }, [quotes]);

  // Synchronize edit fields when selected quote changes
  useEffect(() => {
    if (selectedQuote) {
      setAdminNotes(selectedQuote.adminNotes || "");
      setAssignedTo(selectedQuote.assignedTo?._id || selectedQuote.assignedTo || "");
      setFollowUpDate(selectedQuote.followUpDate ? new Date(selectedQuote.followUpDate).toISOString().split('T')[0] : "");
      setQuoteStatus(selectedQuote.status || "New");
    }
  }, [selectedQuote]);

  // Client-side filtering logic
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          String(q.requestId || "").toLowerCase().includes(query) ||
          String(q.fullName || "").toLowerCase().includes(query) ||
          String(q.mobile || "").toLowerCase().includes(query) ||
          String(q.email || "").toLowerCase().includes(query) ||
          String(q.locality || "").toLowerCase().includes(query) ||
          String(q.address || "").toLowerCase().includes(query) ||
          String(q.serviceCategory || "").toLowerCase().includes(query) ||
          String(q.companyName || "").toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 2. Status
      if (statusFilter !== "All" && q.status !== statusFilter) return false;

      // 3. Service Category
      if (categoryFilter !== "All" && (q.serviceCategory || "CCTV") !== categoryFilter) return false;

      // 4. Area/Locality
      if (areaFilter !== "All" && q.locality !== areaFilter) return false;

      // 5. Assigned Staff
      if (staffFilter !== "All") {
        const staffId = q.assignedTo?._id || q.assignedTo;
        if (staffId !== staffFilter) return false;
      }

      // 6. Created Date
      if (dateFilter) {
        const qDate = new Date(q.createdAt).toISOString().split('T')[0];
        if (qDate !== dateFilter) return false;
      }

      return true;
    });
  }, [quotes, searchQuery, statusFilter, categoryFilter, areaFilter, staffFilter, dateFilter]);

  // Submit updates to quote
  async function handleUpdateQuoteDetails(e) {
    if (e) e.preventDefault();
    if (!selectedQuote) return;

    setSavingNotes(true);
    try {
      const res = await fetch(`/api/v2/admin/quotes/${selectedQuote._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotes,
          assignedTo: assignedTo || null,
          followUpDate: followUpDate || null,
          status: quoteStatus,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to update details");

      // Refresh list and update active detail view
      await refreshQuotes();
      setSelectedQuote(payload.data);
      
      toast.show("Success", "Quote details updated successfully.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingNotes(false);
    }
  }

  // Convert Quote request to booking
  async function handleConvertQuote() {
    if (!selectedQuote) return;
    if (!window.confirm("Convert this Quote Request into a Job Booking?")) return;

    setConverting(true);
    try {
      const res = await fetch(`/api/v2/admin/quotes/${selectedQuote._id}/convert`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to convert quote request");

      await refreshQuotes();
      setShowDetailModal(false);
      
      toast.show("Booking Created", `Successfully converted to Job: ${payload.data?.job?._id || ''}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setConverting(false);
    }
  }

  const makeCall = (phone) => {
    window.open(`tel:${phone}`, "_self");
  };

  const openWhatsApp = (phone, name, requestId) => {
    const text = encodeURIComponent(`Hi ${name}, I am contacting you regarding your TechBes Quote Request #${requestId}.`);
    window.open(`https://wa.me/${phone.replace(/[\s+-]/g, '')}?text=${text}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader 
        title="Quote Requests" 
        subtitle={`${filteredQuotes.length} active requests found`} 
      />

      {/* FILTER PANEL CARD */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          
          {/* Search bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>SEARCH REQUESTS</span>
            <input 
              type="text" 
              placeholder="ID, Name, Mobile, Company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", 
                borderRadius: 10, fontSize: 12, outline: "none", color: "#1e293b", fontWeight: 500
              }}
            />
          </div>

          {/* Service Category Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>SERVICE CATEGORY</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 600, color: "#475569"
              }}
            >
              {["All", "CCTV", "Networking", "Laptop", "Desktop", "Server", "Other"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>STATUS</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 600, color: "#475569"
              }}
            >
              {["All", "New", "Contacted", "Site Survey Scheduled", "Quotation Sent", "Converted", "Closed", "Cancelled"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Locality Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>LOCALITY / AREA</span>
            <select
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              style={{
                height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 600, color: "#475569"
              }}
            >
              {uniqueAreas.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Assigned Staff Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>ASSIGNED STAFF</span>
            <select
              value={staffFilter}
              onChange={e => setStaffFilter(e.target.value)}
              style={{
                height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 600, color: "#475569"
              }}
            >
              <option value="All">All Staff</option>
              {technicians.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>CREATED ON</span>
            <input 
              type="date" 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                borderRadius: 10, fontSize: 12, outline: "none", color: "#475569", fontWeight: 600
              }}
            />
          </div>

        </div>
      </Card>

      {/* REQUESTS LIST DATA TABLE */}
      <Card style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 500 }}>
            Loading quote requests...
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ef4444", fontSize: 13, fontWeight: 500 }}>
            Error: {error}
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 500 }}>
            No Quote Requests found matching current filter parameters.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Request ID", "Customer", "Service", "Mobile", "Area / Locality", "Status", "Assigned Staff", "Created Date", "Action"].map(h => (
                  <th key={h} style={{
                    padding: "14px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, 
                    color: "#475569", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", letterSpacing: ".5px"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((q, idx) => {
                const assignedName = q.assignedTo?.name || "Unassigned";
                const createdDate = new Date(q.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric"
                });

                return (
                  <tr key={q._id} style={{ 
                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0"
                  }}>
                    <td style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>{q.requestId}</td>
                    <td style={{ padding: "14px 18px", fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      {q.fullName}
                      {q.companyName && <span style={{ display: "block", fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{q.companyName}</span>}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 12, fontWeight: 700, color: "#4f46e5" }}>{q.serviceCategory || "CCTV"}</td>
                    <td style={{ padding: "14px 18px", fontSize: 12, color: "#64748b" }}>{q.mobile}</td>
                    <td style={{ padding: "14px 18px", fontSize: 11, color: "#64748b" }}>{q.locality}</td>
                    <td style={{ padding: "14px 18px" }}><StatusBadge status={q.status} /></td>
                    <td style={{ padding: "14px 18px", fontSize: 11, color: "#334155", fontWeight: 600 }}>{assignedName}</td>
                    <td style={{ padding: "14px 18px", fontSize: 11, color: "#64748b" }}>{createdDate}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <button 
                        onClick={() => {
                          setSelectedQuote(q);
                          setShowDetailModal(true);
                        }}
                        style={{
                          background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
                          border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11,
                          fontWeight: 700, cursor: "pointer", shadow: "0 2px 4px rgba(99,102,241,0.2)"
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* INSPECT DETAIL MODAL / DRAWER */}
      {showDetailModal && selectedQuote && (
        <Modal onClose={() => setShowDetailModal(false)} title={`Quote Request Details - ${selectedQuote.requestId}`}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, minWidth: 780, maxHeight: "80vh", overflowY: "auto" }}>
            
            {/* LEFT COLUMN: SPECS & DETAILS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Customer Info */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>Customer Profile</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                  <div><strong style={{ color: "#64748b" }}>Full Name:</strong> <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.fullName}</span></div>
                  <div><strong style={{ color: "#64748b" }}>Mobile Phone:</strong> <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.mobile}</span></div>
                  <div><strong style={{ color: "#64748b" }}>Email:</strong> <span>{selectedQuote.email || "—"}</span></div>
                  <div><strong style={{ color: "#64748b" }}>WhatsApp:</strong> <span>{selectedQuote.whatsapp || "—"}</span></div>
                  {selectedQuote.companyName && (
                    <div style={{ gridColumn: "span 2" }}><strong style={{ color: "#64748b" }}>Company:</strong> <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.companyName}</span></div>
                  )}
                  <div style={{ gridColumn: "span 2" }}><strong style={{ color: "#64748b" }}>Area / Locality:</strong> <span>{selectedQuote.locality} (Pincode: {selectedQuote.pincode || "—"})</span></div>
                  <div style={{ gridColumn: "span 2" }}><strong style={{ color: "#64748b" }}>Full Address:</strong> <span style={{ lineHeight: 1.4 }}>{selectedQuote.address}</span></div>
                  
                  {/* Google maps or location link */}
                  {(selectedQuote.googleMapsUrl || (selectedQuote.latitude && selectedQuote.longitude)) && (
                    <div style={{ gridColumn: "span 2", marginTop: 4 }}>
                      <a 
                        href={selectedQuote.googleMapsUrl || `https://www.google.com/maps?q=${selectedQuote.latitude},${selectedQuote.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#4f46e5", fontWeight: 750, textDecoration: "underline", display: "inline-flex", gap: 4 }}
                      >
                        📍 Open Maps Location Link
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Specifications */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>Requirement Specifications</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                  <div><strong style={{ color: "#64748b" }}>Service Category:</strong> <span style={{ fontWeight: 750, color: "#4f46e5" }}>{selectedQuote.serviceCategory || "CCTV"}</span></div>
                  <div><strong style={{ color: "#64748b" }}>Submission Source:</strong> <span>{selectedQuote.source || "Website"}</span></div>

                  {/* CCTV Specific Details */}
                  {(selectedQuote.serviceCategory || "CCTV") === "CCTV" && (
                    <>
                      <div style={{ gridColumn: "span 2" }}><hr style={{ border: "none", borderTop: "1px solid #e2e8f0" }} /></div>
                      <div><strong style={{ color: "#64748b" }}>CCTV Property:</strong> <span>{selectedQuote.propertyType || "—"}</span></div>
                      <div><strong style={{ color: "#64748b" }}>CCTV Requirement:</strong> <span>{selectedQuote.requirementType || "—"}</span></div>
                      <div><strong style={{ color: "#64748b" }}>Camera Count:</strong> <span>{selectedQuote.cameraCount || "—"}</span></div>
                      <div><strong style={{ color: "#64748b" }}>Camera Placement:</strong> <span>{selectedQuote.cameraRequirement || "—"}</span></div>
                      <div><strong style={{ color: "#64748b" }}>Recorder:</strong> <span>{selectedQuote.recorder || "—"}</span></div>
                      <div><strong style={{ color: "#64748b" }}>Storage:</strong> <span>{selectedQuote.storage || "—"}</span></div>
                      
                      <div style={{ gridColumn: "span 2" }}>
                        <strong style={{ color: "#64748b" }}>Requested Features:</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {(selectedQuote.features || []).length === 0 ? (
                            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No features specified</span>
                          ) : (
                            selectedQuote.features.map(f => (
                              <span key={f} style={{ background: "#e0e7ff", color: "#4338ca", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{f}</span>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div style={{ gridColumn: "span 2" }}>
                    <strong style={{ color: "#64748b" }}>Detailed Requirement / Message:</strong>
                    <p style={{ margin: "4px 0 0 0", color: "#334155", background: "#fff", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", lineHeight: 1.4 }}>
                      {selectedQuote.additionalRequirements || "None provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferred visit details */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>Preferred Visit & Contact Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12 }}>
                  <div>
                    <strong style={{ color: "#64748b", display: "block" }}>Contact via:</strong>
                    <span style={{ fontWeight: 600 }}>{selectedQuote.preferredContact}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#64748b", display: "block" }}>Visit Date:</strong>
                    <span style={{ fontWeight: 600 }}>{selectedQuote.preferredVisitDate ? new Date(selectedQuote.preferredVisitDate).toLocaleDateString("en-IN") : "Flexible"}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#64748b", display: "block" }}>Visit Time:</strong>
                    <span style={{ fontWeight: 600 }}>{selectedQuote.preferredVisitTime || "Anytime"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: ADMINISTRATIVE CONTROLS */}
            <form onSubmit={handleUpdateQuoteDetails} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>Admin Actions</h4>
                
                {/* Status selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>CHANGE STATUS</label>
                  <select
                    value={quoteStatus}
                    onChange={e => setQuoteStatus(e.target.value)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 600, color: "#475569"
                    }}
                  >
                    {["New", "Contacted", "Site Survey Scheduled", "Quotation Sent", "Converted", "Closed", "Cancelled"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Assigned staff */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>ASSIGN STAFF / ENGINEER</label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 600, color: "#475569"
                    }}
                  >
                    <option value="">Select Staff</option>
                    {technicians.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.role})</option>
                    ))}
                  </select>
                </div>

                {/* Follow up date */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>FOLLOW UP DATE</label>
                  <input 
                    type="date"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", color: "#475569"
                    }}
                  />
                </div>

                {/* Admin notes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>ADMIN NOTES</label>
                  <textarea
                    rows={4}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Enter notes about phone discussion, quotes pricing..."
                    style={{
                      padding: 10, border: "1px solid #cbd5e1", borderRadius: 10,
                      fontSize: 12, outline: "none", resize: "none", background: "#fff", color: "#334155"
                    }}
                  />
                </div>

                {/* Save button */}
                <button 
                  type="submit" 
                  disabled={savingNotes}
                  style={{
                    background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
                    border: "none", borderRadius: 10, height: 38, fontSize: 12, fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {savingNotes ? "Saving Changes..." : "Save Details"}
                </button>
              </div>

              {/* CUSTOMER CONTACT & BOOKING CONVERSION PANEL */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 10 }}>
                <h4 style={{ margin: 0, fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>Communications & Conversion</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => makeCall(selectedQuote.mobile)}
                    style={{
                      height: 38, border: "1px solid #6366f1", color: "#4f46e5", background: "#fff",
                      borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                    }}
                  >
                    📞 Call Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(selectedQuote.mobile, selectedQuote.fullName, selectedQuote.requestId)}
                    style={{
                      height: 38, border: "1px solid #10b981", color: "#047857", background: "#fff",
                      borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                    }}
                  >
                    💬 WhatsApp Chat
                  </button>
                </div>

                {/* CONVERT TO BOOKING BUTTON */}
                {selectedQuote.status !== 'Converted to Booking' && selectedQuote.status !== 'Converted' ? (
                  <button
                    type="button"
                    onClick={handleConvertQuote}
                    disabled={converting}
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                      border: "none", borderRadius: 10, height: 42, fontSize: 12, fontWeight: 800,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: "0 4px 10px rgba(16,185,129,0.25)", marginTop: 10
                    }}
                  >
                    {converting ? "Converting to Job Booking..." : "⚡ Convert to Booking"}
                  </button>
                ) : (
                  <div style={{ 
                    background: "rgba(16,185,129,0.08)", color: "#065f46", border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 10, padding: "10px", fontSize: 11, fontWeight: 700, textAlign: "center", marginTop: 10
                  }}>
                    ✓ Already Converted to Booking
                  </div>
                )}
              </div>
            </form>

          </div>
        </Modal>
      )}

    </div>
  );
}
