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
  const [savingPrices, setSavingPrices] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [converting, setConverting] = useState(false);

  // Form edit states inside modal
  const [adminNotes, setAdminNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("");

  // Pricing edit states for requested items
  const [pricingItems, setPricingItems] = useState([]);
  const [gstRate, setGstRate] = useState(18);
  const [validityDays, setValidityDays] = useState(15);
  const [whatsappResult, setWhatsappResult] = useState(null);

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
      setQuoteStatus(selectedQuote.status || "quotation_requested");
      setGstRate(selectedQuote.gstRate || 18);
      setValidityDays(selectedQuote.validityDays || 15);
      setWhatsappResult(null);

      // Initialize pricing items from quote
      const initialItems = (selectedQuote.items || []).map(item => ({
        _id: item._id,
        productName: item.productName,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice : "",
        lineTotal: item.lineTotal || 0,
      }));
      setPricingItems(initialItems);
    }
  }, [selectedQuote]);

  // Automatic calculation of Subtotal, GST, and Final Amount
  const calculatedPricing = useMemo(() => {
    let subtotal = 0;
    const computedItems = pricingItems.map(item => {
      const price = parseFloat(item.unitPrice) || 0;
      const lineTotal = Math.round(item.quantity * price * 100) / 100;
      subtotal += lineTotal;
      return { ...item, lineTotal };
    });

    const parsedGstRate = parseFloat(gstRate) || 0;
    const gstAmount = Math.round(((subtotal * parsedGstRate) / 100) * 100) / 100;
    const finalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    return {
      items: computedItems,
      subtotal,
      gstAmount,
      finalAmount,
    };
  }, [pricingItems, gstRate]);

  // Handle unit price change for a specific item
  const handleUnitPriceChange = (index, val) => {
    setPricingItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], unitPrice: val };
      return copy;
    });
  };

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

  // Save Pricing Calculation to Backend
  async function handleSavePricing(asDraft = true) {
    if (!selectedQuote) return;
    setSavingPrices(true);
    try {
      const res = await fetch(`/api/v2/admin/quotes/${selectedQuote._id}/price`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: calculatedPricing.items.map(it => ({
            productName: it.productName,
            quantity: it.quantity,
            unitPrice: parseFloat(it.unitPrice) || 0,
          })),
          gstRate,
          validityDays,
          adminNotes,
          saveAsDraft: asDraft,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to save pricing");

      await refreshQuotes();
      setSelectedQuote(payload.data);
      toast.show("Pricing Saved", "Quotation pricing and calculations saved.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPrices(false);
    }
  }

  // Send Final Quotation to Customer (with WhatsApp Notification)
  async function handleSendQuotation() {
    if (!selectedQuote) return;
    if (calculatedPricing.finalAmount <= 0) {
      alert("Please enter unit prices so that Final Amount is greater than 0 before sending.");
      return;
    }

    if (!window.confirm(`Send Quotation #${selectedQuote.requestId} (Total: ₹${calculatedPricing.finalAmount.toLocaleString('en-IN')}) to customer via WhatsApp?`)) {
      return;
    }

    setSendingQuote(true);
    try {
      // 1. Ensure latest prices are saved first
      await fetch(`/api/v2/admin/quotes/${selectedQuote._id}/price`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: calculatedPricing.items.map(it => ({
            productName: it.productName,
            quantity: it.quantity,
            unitPrice: parseFloat(it.unitPrice) || 0,
          })),
          gstRate,
          validityDays,
          adminNotes,
        }),
      });

      // 2. Dispatch Send Quotation + WhatsApp
      const res = await fetch(`/api/v2/admin/quotes/${selectedQuote._id}/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Failed to send quotation");

      await refreshQuotes();
      setSelectedQuote(payload.data?.quote || selectedQuote);
      setWhatsappResult(payload.data);

      toast.show("Quotation Sent", `Quotation sent to ${selectedQuote.fullName}. WhatsApp notification dispatched.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingQuote(false);
    }
  }

  // Update administrative notes / status
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
    if (!window.confirm("Convert this Quote Request into an authoritative Job Booking?")) return;

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

  const openWhatsApp = (phone, name, requestId, amount) => {
    const text = encodeURIComponent(
      `Hi ${name}, I am contacting you regarding your TechBes Quotation #${requestId}${amount ? ` for ₹${amount}` : ''}.`
    );
    window.open(`https://wa.me/91${phone.replace(/[^\d]/g, '').slice(-10)}?text=${text}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader 
        title="Quotation Management" 
        subtitle={`${filteredQuotes.length} active quotation requests`} 
      />

      {/* FILTER PANEL CARD */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          
          {/* Search bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>SEARCH REQUESTS</span>
            <input 
              type="text" 
              placeholder="ID, Name, Mobile, Area..."
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
              {["All", "CCTV", "Networking", "Web Designing", "Website Development"].map(opt => (
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
              {[
                "All",
                "quotation_requested",
                "quotation_draft",
                "quotation_sent",
                "quotation_accepted",
                "payment_pending",
                "paid",
                "converted_to_order",
                "cancelled"
              ].map(opt => (
                <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>AREA / LOCALITY</span>
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

          {/* Staff Filter */}
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
                <option key={t._id} value={t._id}>{t.name} ({t.role})</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>REQUEST DATE</span>
            <input 
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                borderRadius: 10, fontSize: 12, outline: "none", color: "#475569"
              }}
            />
          </div>

        </div>

        {(searchQuery || statusFilter !== "All" || categoryFilter !== "All" || areaFilter !== "All" || staffFilter !== "All" || dateFilter) && (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button 
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
                setCategoryFilter("All");
                setAreaFilter("All");
                setStaffFilter("All");
                setDateFilter("");
              }}
              style={{ 
                background: "none", border: "none", color: "#3b82f6", 
                fontSize: 11, fontWeight: 700, cursor: "pointer" 
              }}
            >
              ✕ Clear All Filters
            </button>
          </div>
        )}
      </Card>

      {/* QUOTES LIST TABLE */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 600 }}>
            Loading Quotation Requests...
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            No quotation requests match your filter criteria.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>REQUEST ID</th>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>CUSTOMER</th>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>SERVICE</th>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>MOBILE</th>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>AREA / LOCALITY</th>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>STATUS</th>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>ASSIGNED STAFF</th>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>CREATED DATE</th>
                <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap", textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((q) => {
                const createdDate = new Date(q.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                });

                return (
                  <tr key={q._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 750, color: "#1e293b", whiteSpace: "nowrap" }}>
                      <span style={{ fontFamily: "monospace", color: "#3b82f6" }}>{q.requestId}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>
                      {q.fullName}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#334155", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 650 }}>{q.serviceCategory}</span>
                      {q.subcategory && <div style={{ fontSize: 10, color: "#64748b" }}>{q.subcategory}</div>}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                      {q.mobile}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                      {q.locality || q.address || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <StatusBadge status={q.status} />
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                      {q.assignedTo?.name || "Unassigned"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                      {createdDate}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <button 
                        onClick={() => {
                          setSelectedQuote(q);
                          setShowDetailModal(true);
                        }}
                        style={{
                          background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff",
                          border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 11.5,
                          fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
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

      {/* INSPECT & PRICING MODAL */}
      {showDetailModal && selectedQuote && (
        <Modal onClose={() => setShowDetailModal(false)} title={`Quotation Management - ${selectedQuote.requestId}`}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 20, minWidth: 850, maxHeight: "82vh", overflowY: "auto" }}>
            
            {/* LEFT COLUMN: CUSTOMER SPECS, VOICE NOTE & PRICING TABLE */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Customer Profile Card */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h4 style={{ margin: 0, fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>Customer Information</h4>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button 
                      onClick={() => makeCall(selectedQuote.mobile)}
                      style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                    >
                      📞 Call
                    </button>
                    <button 
                      onClick={() => openWhatsApp(selectedQuote.mobile, selectedQuote.fullName, selectedQuote.requestId, calculatedPricing.finalAmount)}
                      style={{ background: "#25d366", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                  <div><strong style={{ color: "#64748b" }}>Name:</strong> <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.fullName}</span></div>
                  <div><strong style={{ color: "#64748b" }}>Mobile:</strong> <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.mobile}</span></div>
                  <div><strong style={{ color: "#64748b" }}>Email:</strong> <span>{selectedQuote.email || "—"}</span></div>
                  <div><strong style={{ color: "#64748b" }}>Category:</strong> <span style={{ color: "#3b82f6", fontWeight: 700 }}>{selectedQuote.serviceCategory} {selectedQuote.subcategory ? `(${selectedQuote.subcategory})` : ''}</span></div>
                  <div><strong style={{ color: "#64748b" }}>Status:</strong> <span style={{ fontWeight: 700, color: "#1e293b" }}><StatusBadge status={selectedQuote.status} /></span></div>
                  <div><strong style={{ color: "#64748b" }}>Preferred Date:</strong> <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.preferredVisitDate ? new Date(selectedQuote.preferredVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : (selectedQuote.preferredDate || "Flexible")}</span></div>
                  <div><strong style={{ color: "#64748b" }}>Preferred Time:</strong> <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.preferredVisitTime || selectedQuote.preferredTimeSlot || selectedQuote.preferredTime || "Flexible / Any Time"}</span></div>
                  <div style={{ gridColumn: "span 2" }}><strong style={{ color: "#64748b" }}>Address:</strong> <span>{selectedQuote.address} (Locality: {selectedQuote.locality}, PIN: {selectedQuote.pincode || "—"})</span></div>
                  
                  {/* Google maps link */}
                  {(selectedQuote.googleMapsUrl || (selectedQuote.latitude && selectedQuote.longitude)) && (
                    <div style={{ gridColumn: "span 2", marginTop: 4 }}>
                      <a 
                        href={selectedQuote.googleMapsUrl || `https://www.google.com/maps?q=${selectedQuote.latitude},${selectedQuote.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#2563eb", fontWeight: 700, fontSize: 11, textDecoration: "underline" }}
                      >
                        📍 Open Google Maps Location Link
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Images Gallery */}
              {selectedQuote.images && selectedQuote.images.length > 0 && (
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>
                    Uploaded Site / Layout Photos ({selectedQuote.images.length})
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {selectedQuote.images.map((imgUrl, idx) => (
                      <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", border: "1.5px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                        <img src={imgUrl} alt={`Upload ${idx + 1}`} style={{ width: 84, height: 84, objectFit: "cover", display: "block" }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Requirements & Voice Note Player */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>Requirements & Voice Message</h4>
                
                <p style={{ margin: "0 0 10px 0", color: "#334155", background: "#fff", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, lineHeight: 1.4 }}>
                  {selectedQuote.additionalRequirements || "No written additional requirements provided."}
                </p>

                {/* Voice Note Audio Player */}
                {selectedQuote.voiceNote?.url ? (
                  <div style={{ background: "#eff6ff", padding: 12, borderRadius: 12, border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🎙️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>
                        Customer Voice Note ({selectedQuote.voiceNote.duration ? `${selectedQuote.voiceNote.duration}s` : 'Recorded Audio'})
                      </div>
                      <audio controls src={selectedQuote.voiceNote.url} style={{ width: "100%", height: 32 }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                    No voice note was recorded with this request.
                  </div>
                )}
              </div>

              {/* AUTHORITATIVE PRICING TABLE (PART 8 & 9) */}
              <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "2px solid #3b82f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>
                      💰 Quotation Pricing Engine
                    </h4>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                      Enter Per Unit Price for each requested item. Backend calculates line totals, GST, and final amount.
                    </p>
                  </div>
                </div>

                {/* Items pricing table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569" }}>Requested Item</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", color: "#475569", width: 80 }}>Qty</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", color: "#475569", width: 140 }}>Unit Price (₹)</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", color: "#475569", width: 120 }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedPricing.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px", fontWeight: 650, color: "#1e293b" }}>
                          {item.productName}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center", fontWeight: 700, color: "#3b82f6" }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Enter rate"
                            value={item.unitPrice}
                            onChange={e => handleUnitPriceChange(idx, e.target.value)}
                            style={{
                              width: 110, height: 32, padding: "0 8px", textAlign: "right",
                              border: "1px solid #93c5fd", borderRadius: 8, fontSize: 12, fontWeight: 700,
                              color: "#1e293b", background: "#f0f9ff"
                            }}
                          />
                        </td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 750, color: "#0f172a" }}>
                          ₹{item.lineTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals & GST Section */}
                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569" }}>
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{calculatedPricing.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#475569" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>GST Rate (%):</span>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={gstRate}
                        onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
                        style={{ width: 60, height: 26, padding: "0 6px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 11, textAlign: "center" }}
                      />
                    </div>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{calculatedPricing.gstAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid #cbd5e1", margin: "4px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    <span>Final Quotation Amount:</span>
                    <span style={{ color: "#2563eb" }}>₹{calculatedPricing.finalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Pricing Action Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => handleSavePricing(true)}
                    disabled={savingPrices}
                    style={{
                      flex: 1, height: 38, background: "#f1f5f9", color: "#334155",
                      border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    {savingPrices ? "Saving..." : "Save Pricing Draft"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendQuotation}
                    disabled={sendingQuote || calculatedPricing.finalAmount <= 0}
                    style={{
                      flex: 1.5, height: 38, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff",
                      border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(37,99,235,0.3)"
                    }}
                  >
                    {sendingQuote ? "Sending via WhatsApp..." : "🚀 Send Quotation to Customer"}
                  </button>
                </div>

                {/* WhatsApp delivery result notice */}
                {whatsappResult && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 11 }}>
                    <div style={{ color: "#166534", fontWeight: 700, marginBottom: 4 }}>
                      ✓ Quotation status updated to 'Quotation Sent'!
                    </div>
                    {whatsappResult.whatsappSent ? (
                      <div style={{ color: "#15803d" }}>✓ WhatsApp notification delivered successfully via carrier gateway.</div>
                    ) : (
                      <div>
                        <span style={{ color: "#854d0e" }}>WhatsApp automated API is in test/fallback mode. </span>
                        {whatsappResult.clickToChatUrl && (
                          <a 
                            href={whatsappResult.clickToChatUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: "#2563eb", fontWeight: 700, textDecoration: "underline", marginLeft: 4 }}
                          >
                            Click here to open WhatsApp Web / App
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: ADMINISTRATIVE CONTROLS */}
            <form onSubmit={handleUpdateQuoteDetails} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>Workflow & Assignment</h4>
                
                {/* Status selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>CURRENT STATUS</label>
                  <select
                    value={quoteStatus}
                    onChange={e => setQuoteStatus(e.target.value)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 600, color: "#475569"
                    }}
                  >
                    {[
                      "quotation_requested",
                      "quotation_draft",
                      "quotation_sent",
                      "quotation_accepted",
                      "payment_pending",
                      "paid",
                      "converted_to_order",
                      "cancelled",
                      "expired"
                    ].map(opt => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Validity Days */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>VALIDITY (DAYS)</label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={e => setValidityDays(parseInt(e.target.value, 10) || 15)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", color: "#475569"
                    }}
                  />
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
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>INTERNAL ADMIN NOTES</label>
                  <textarea
                    rows={4}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Enter phone call discussion or discount terms..."
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
                  {savingNotes ? "Saving Changes..." : "Save Admin Notes"}
                </button>
              </div>

              {/* CONVERT TO ORDER BUTTON (PART 15) */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase" }}>
                  Fulfillment & Job Conversion
                </h4>
                {selectedQuote.orderNumber ? (
                  <div style={{ padding: 10, borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", fontSize: 12 }}>
                    <span style={{ color: "#065f46", fontWeight: 700 }}>✓ Converted to Order:</span>
                    <div style={{ fontFamily: "monospace", fontWeight: 800, color: "#047857", marginTop: 2 }}>
                      {selectedQuote.orderNumber}
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleConvertQuote}
                    disabled={converting}
                    style={{
                      width: "100%", background: "#059669", color: "#fff",
                      border: "none", borderRadius: 10, height: 38, fontSize: 12, fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {converting ? "Converting to Job..." : "⚡ Convert to Job Order"}
                  </button>
                )}
              </div>
            </form>

          </div>
        </Modal>
      )}

    </div>
  );
}
