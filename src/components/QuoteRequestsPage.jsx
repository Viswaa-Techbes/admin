"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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

  const load = useCallback(async () => {
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
  }, [url]);

  useEffect(() => { 
    load(); 
  }, [load]);

  return { data, setData, loading, error, refresh: load };
}

export function QuoteRequestsPage() {
  const toast = useToast();
  
  // API Data
  const { data: quotes, loading, error, refresh: refreshQuotes } = useApiData("/api/v2/admin/quotes");
  const { data: users } = useApiData("/api/v2/admin/users");
  
  // Filter technicians / engineers
  const technicians = useMemo(
    () => users.filter(u => u.role === 'technician' || u.role === 'manager'), 
    [users]
  );

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
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [savingNotes, setSavingNotes] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [converting, setConverting] = useState(false);

  // Form edit states inside modal
  const [adminNotes, setAdminNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("");

  // Pricing edit states for requested items (Excel-Style Builder)
  const [pricingItems, setPricingItems] = useState([]);
  const [gstRate, setGstRate] = useState(18);
  const [validityDays, setValidityDays] = useState(15);
  const [quoteTerms, setQuoteTerms] = useState("");
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
      setFollowUpDate(
        selectedQuote.followUpDate 
          ? new Date(selectedQuote.followUpDate).toISOString().split('T')[0] 
          : ""
      );
      setQuoteStatus(selectedQuote.status || "quotation_requested");
      setGstRate(typeof selectedQuote.gstRate === 'number' ? selectedQuote.gstRate : 18);
      setValidityDays(selectedQuote.validityDays || 15);
      setQuoteTerms(
        selectedQuote.terms || 
        "1. 50% advance on order confirmation, balance on completion.\n2. 1-Year manufacturer warranty on cameras & active equipment.\n3. Physical damage and electrical surges excluded from warranty.\n4. Quote valid for 15 days from date of issue."
      );
      setWhatsappResult(null);

      // Initialize pricing items from quote
      const initialItems = (selectedQuote.items || []).map(item => ({
        _id: item._id,
        productId: item.productId,
        productName: item.productName || item.name || "Item",
        brand: item.brand || "",
        sku: item.sku || "",
        variant: item.variant || "",
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : 1,
        unitPrice: item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice : "",
        gstRate: typeof item.gstRate === 'number' ? item.gstRate : (selectedQuote.gstRate || 18),
        lineTotal: item.lineTotal || 0,
      }));
      setPricingItems(initialItems);
    }
  }, [selectedQuote]);

  // Handle Inspect Click & Fetch Authoritative Backend Data
  const handleInspectQuote = useCallback(async (q) => {
    if (!q) return;
    setSelectedQuote(q);
    setShowDetailModal(true);
    setLoadingDetail(true);
    setDetailError("");

    const targetId = q._id || q.requestId;
    try {
      const { payload } = await apiFetch(`/api/v2/admin/quotes/${encodeURIComponent(targetId)}`);
      if (payload && (payload.data || payload._id || payload.requestId)) {
        const fullQuote = payload.data || payload;
        setSelectedQuote(fullQuote);
      }
    } catch (err) {
      console.warn("Could not fetch full quote details from backend:", err.message);
      setDetailError(err.message || "Failed to fetch updated quote details.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Check URL query parameters on initial load (e.g. ?id=QT-2026-00001 or ?inspect=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("id") || params.get("inspect") || params.get("requestId");
    if (targetId) {
      // Find in existing quotes or fetch directly
      const matched = quotes.find(q => q.requestId === targetId || q._id === targetId);
      if (matched) {
        handleInspectQuote(matched);
      } else {
        handleInspectQuote({ requestId: targetId });
      }
    }
  }, [quotes, handleInspectQuote]);

  // Automatic calculation of Subtotal, GST, and Final Amount
  const calculatedPricing = useMemo(() => {
    let subtotal = 0;
    const computedItems = pricingItems.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const lineTotal = Math.round(qty * price * 100) / 100;
      subtotal += lineTotal;
      return { ...item, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal };
    });

    const parsedGstRate = parseFloat(gstRate) || 0;
    const gstAmount = Math.round(((subtotal * parsedGstRate) / 100) * 100) / 100;
    const finalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    return {
      items: computedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount,
      finalAmount,
    };
  }, [pricingItems, gstRate]);

  // Line item manipulation handlers (Excel-Style Builder)
  const handleItemFieldChange = (index, field, val) => {
    setPricingItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddLineItem = (name = "", qty = 1, unitPrice = "") => {
    setPricingItems(prev => [
      ...prev,
      {
        productName: name,
        quantity: qty,
        unitPrice: unitPrice,
        lineTotal: 0,
      }
    ]);
  };

  const handleRemoveLineItem = (index) => {
    setPricingItems(prev => prev.filter((_, i) => i !== index));
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
          String(q.subcategory || "").toLowerCase().includes(query) ||
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
        const assignedId = q.assignedTo?._id || q.assignedTo;
        if (staffFilter === "Unassigned") {
          if (assignedId) return false;
        } else {
          if (assignedId !== staffFilter) return false;
        }
      }

      // 6. Created Date
      if (dateFilter) {
        const qDate = new Date(q.createdAt).toISOString().split('T')[0];
        if (qDate !== dateFilter) return false;
      }

      return true;
    });
  }, [quotes, searchQuery, statusFilter, categoryFilter, areaFilter, staffFilter, dateFilter]);

  // Save Pricing Draft (Server-side authoritative calculation)
  async function handleSavePricing(asDraft = true) {
    if (!selectedQuote) return;
    const targetId = selectedQuote._id || selectedQuote.requestId;
    setSavingPrices(true);
    try {
      const itemsPayload = calculatedPricing.items
        .map(it => ({
          productName: (it.productName || "Item").trim(),
          quantity: parseFloat(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
        }))
        .filter(it => it.productName.length > 0);

      const { payload } = await apiFetch(`/api/v2/admin/quotes/${encodeURIComponent(targetId)}/price`, {
        method: "POST",
        body: {
          items: itemsPayload,
          gstRate: parseFloat(gstRate) || 0,
          validityDays: parseInt(validityDays, 10) || 15,
          adminNotes,
          terms: quoteTerms,
          saveAsDraft: asDraft,
        },
      });

      await refreshQuotes();
      setSelectedQuote(payload.data || payload);
      toast.show("Pricing Saved", "Quotation pricing draft updated successfully.");
    } catch (err) {
      alert(err.message || "Failed to save pricing");
    } finally {
      setSavingPrices(false);
    }
  }

  // Download Authoritative Quotation PDF
  async function handleDownloadPdf(quote) {
    if (!quote || downloadingPdf) return;
    const targetId = quote._id || quote.requestId;
    setDownloadingPdf(true);
    try {
      // First ensure any pending price edits are saved so the PDF reflects latest numbers
      if (calculatedPricing.finalAmount > 0) {
        const itemsPayload = calculatedPricing.items
          .map(it => ({
            productName: (it.productName || "Item").trim(),
            quantity: parseFloat(it.quantity) || 1,
            unitPrice: parseFloat(it.unitPrice) || 0,
          }))
          .filter(it => it.productName.length > 0);

        await apiFetch(`/api/v2/admin/quotes/${encodeURIComponent(targetId)}/price`, {
          method: "POST",
          body: {
            items: itemsPayload,
            gstRate: parseFloat(gstRate) || 0,
            validityDays: parseInt(validityDays, 10) || 15,
            adminNotes,
            terms: quoteTerms,
          },
        });
      }

      const res = await fetch(`/api/v2/admin/quotes/${encodeURIComponent(targetId)}/pdf`, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!res.ok) {
        let errMsg = "Failed to generate quotation PDF";
        try {
          const json = await res.json();
          errMsg = json.message || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TechBes_Quotation_${quote.requestId || targetId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.show("PDF Generated", `Quotation PDF #${quote.requestId || targetId} downloaded successfully.`);
    } catch (err) {
      alert(err.message || "Failed to download quotation PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }

  // Send Final Quotation to Customer (with PDF Generation & WhatsApp Notification)
  async function handleSendQuotation() {
    if (!selectedQuote || sendingQuote) return;
    if (calculatedPricing.finalAmount <= 0) {
      alert("Please enter unit prices so that Final Amount is greater than 0 before sending.");
      return;
    }

    const rawPhone = String(selectedQuote.mobile || selectedQuote.whatsapp || "").replace(/[^\d]/g, "");
    if (!rawPhone || rawPhone.length < 10) {
      alert("Customer mobile number is missing or invalid. Please verify the customer phone number.");
      return;
    }

    if (!window.confirm(`Generate PDF & Send Quotation #${selectedQuote.requestId} (Total: ₹${calculatedPricing.finalAmount.toLocaleString('en-IN')}) to customer via WhatsApp?`)) {
      return;
    }

    const targetId = selectedQuote._id || selectedQuote.requestId;
    setSendingQuote(true);
    try {
      const itemsPayload = calculatedPricing.items
        .map(it => ({
          productName: (it.productName || "Item").trim(),
          quantity: parseFloat(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
        }))
        .filter(it => it.productName.length > 0);

      // 1. Ensure latest prices & terms are saved first
      await apiFetch(`/api/v2/admin/quotes/${encodeURIComponent(targetId)}/price`, {
        method: "POST",
        body: {
          items: itemsPayload,
          gstRate: parseFloat(gstRate) || 0,
          validityDays: parseInt(validityDays, 10) || 15,
          adminNotes,
          terms: quoteTerms,
        },
      });

      // 2. Dispatch Send Quotation + PDF Generation + WhatsApp
      const { payload } = await apiFetch(`/api/v2/admin/quotes/${encodeURIComponent(targetId)}/send`, {
        method: "POST",
        body: {},
      });

      await refreshQuotes();
      setSelectedQuote(payload.data?.quote || payload.data || selectedQuote);
      setWhatsappResult(payload.data);

      if (payload.data?.whatsappSent) {
        toast.show("Quotation Sent", `Quotation PDF sent directly to ${selectedQuote.fullName} via WhatsApp carrier gateway.`);
      } else {
        toast.show("PDF Ready", `Quotation PDF generated. Click 'Download PDF + Open WhatsApp' to send.`);
      }
    } catch (err) {
      alert(err.message || "Failed to send quotation");
    } finally {
      setSendingQuote(false);
    }
  }


  // Update administrative notes / status
  async function handleUpdateQuoteDetails(e) {
    if (e) e.preventDefault();
    if (!selectedQuote) return;

    const targetId = selectedQuote._id || selectedQuote.requestId;
    setSavingNotes(true);
    try {
      const { payload } = await apiFetch(`/api/v2/admin/quotes/${encodeURIComponent(targetId)}`, {
        method: "PUT",
        body: {
          adminNotes,
          assignedTo: assignedTo || null,
          followUpDate: followUpDate || null,
          status: quoteStatus,
        },
      });

      await refreshQuotes();
      setSelectedQuote(payload.data || payload);
      toast.show("Success", "Quote workflow and assignment updated successfully.");
    } catch (err) {
      alert(err.message || "Failed to update details");
    } finally {
      setSavingNotes(false);
    }
  }

  // Convert Quote request to job booking
  async function handleConvertQuote() {
    if (!selectedQuote) return;
    if (!window.confirm(`Convert Quotation #${selectedQuote.requestId} into an authoritative Job Order?`)) return;

    const targetId = selectedQuote._id || selectedQuote.requestId;
    setConverting(true);
    try {
      const { payload } = await apiFetch(`/api/v2/admin/quotes/${encodeURIComponent(targetId)}/convert`, {
        method: "POST",
      });

      await refreshQuotes();
      if (payload.data?.quote) {
        setSelectedQuote(payload.data.quote);
      } else {
        setShowDetailModal(false);
      }
      toast.show("Booking Created", `Successfully converted to Job: ${payload.data?.orderNumber || payload.data?.job?._id || ''}`);
    } catch (err) {
      alert(err.message || "Failed to convert quote request");
    } finally {
      setConverting(false);
    }
  }

  const makeCall = (phone) => {
    if (!phone) return;
    window.open(`tel:${phone}`, "_self");
  };

  const openWhatsApp = (phone, name, requestId, amount) => {
    if (!phone) return;
    const text = encodeURIComponent(
      `Hi ${name || 'Customer'}, I am contacting you regarding your TechBes Quotation #${requestId || ''}${amount ? ` for ₹${amount.toLocaleString('en-IN')}` : ''}.`
    );
    window.open(`https://wa.me/91${phone.replace(/[^\d]/g, '').slice(-10)}?text=${text}`, "_blank");
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 60px" }}>
      
      {/* PAGE HEADER */}
      <PageHeader 
        title="Quotation Requests & Leads"
        subtitle={`${filteredQuotes.length} active quotation requests found`} 
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              type="button" 
              onClick={refreshQuotes}
              style={{
                background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10,
                padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#475569",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              🔄 Refresh List
            </button>
          </div>
        }
      />

      {/* ERROR NOTICE IF LIST FAILS */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
          padding: "12px 16px", marginBottom: 20, color: "#b91c1c", fontSize: 13,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div><strong>Error loading quotes:</strong> {error}</div>
          <button 
            type="button"
            onClick={refreshQuotes}
            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* FILTER CONTROLS CARD */}
      <Card style={{ padding: 18, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 12, alignItems: "center" }}>
          
          {/* 1. Search Query */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
              SEARCH REQUESTS
            </label>
            <input 
              type="text"
              placeholder="Search by ID, Name, Phone, Locality..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1",
                borderRadius: 10, fontSize: 12, outline: "none", background: "#f8fafc"
              }}
            />
          </div>

          {/* 2. Status Filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
              STATUS
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                width: "100%", height: 38, padding: "0 8px", border: "1px solid #cbd5e1",
                borderRadius: 10, fontSize: 12, outline: "none", background: "#f8fafc", color: "#334155"
              }}
            >
              <option value="All">All Statuses</option>
              <option value="quotation_requested">Quotation Requested</option>
              <option value="quotation_draft">Quotation Draft</option>
              <option value="quotation_sent">Quotation Sent</option>
              <option value="quotation_accepted">Quotation Accepted</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="converted_to_order">Converted to Order</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* 3. Category Filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
              CATEGORY
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                width: "100%", height: 38, padding: "0 8px", border: "1px solid #cbd5e1",
                borderRadius: 10, fontSize: 12, outline: "none", background: "#f8fafc", color: "#334155"
              }}
            >
              <option value="All">All Categories</option>
              <option value="CCTV">CCTV Surveillance</option>
              <option value="Networking">Networking</option>
              <option value="Website Development">Website / Web Designing</option>
            </select>
          </div>

          {/* 4. Locality Filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
              LOCALITY / AREA
            </label>
            <select
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              style={{
                width: "100%", height: 38, padding: "0 8px", border: "1px solid #cbd5e1",
                borderRadius: 10, fontSize: 12, outline: "none", background: "#f8fafc", color: "#334155"
              }}
            >
              {uniqueAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* 5. Assigned Staff Filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
              ASSIGNED TO
            </label>
            <select
              value={staffFilter}
              onChange={e => setStaffFilter(e.target.value)}
              style={{
                width: "100%", height: 38, padding: "0 8px", border: "1px solid #cbd5e1",
                borderRadius: 10, fontSize: 12, outline: "none", background: "#f8fafc", color: "#334155"
              }}
            >
              <option value="All">All Staff</option>
              <option value="Unassigned">Unassigned</option>
              {technicians.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* 6. Date Filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
              DATE CREATED
            </label>
            <input 
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                width: "100%", height: 38, padding: "0 8px", border: "1px solid #cbd5e1",
                borderRadius: 10, fontSize: 12, outline: "none", background: "#f8fafc", color: "#334155"
              }}
            />
          </div>

        </div>

        {/* Clear Filters Button */}
        {(searchQuery || statusFilter !== "All" || categoryFilter !== "All" || areaFilter !== "All" || staffFilter !== "All" || dateFilter) && (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button 
              type="button"
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
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 600 }}>
            Loading Quotation Requests from database...
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 700, color: "#475569" }}>No quotation requests found</div>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>REQUEST ID</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>CUSTOMER</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 750, color: "#475569", whiteSpace: "nowrap" }}>CATEGORY &amp; SERVICE</th>
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
                  const createdDate = q.createdAt ? new Date(q.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  }) : "—";

                  return (
                    <tr key={q._id || q.requestId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 750, color: "#1e293b", whiteSpace: "nowrap" }}>
                        <span style={{ fontFamily: "monospace", color: "#2563eb", fontWeight: 800 }}>
                          {q.requestId || q._id}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>
                        {q.fullName || "Unnamed Customer"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#334155", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{q.serviceCategory || "CCTV"}</span>
                        {q.subcategory && <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>{q.subcategory}</div>}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                        {q.mobile || "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                        {q.locality || q.address || "—"}
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <StatusBadge status={q.status} />
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                        {q.assignedTo?.name || (typeof q.assignedTo === 'string' ? q.assignedTo : "Unassigned")}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                        {createdDate}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <button 
                          type="button"
                          onClick={() => handleInspectQuote(q)}
                          style={{
                            background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff",
                            border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12,
                            fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 4px rgba(59,130,246,0.25)",
                            display: "inline-flex", alignItems: "center", gap: 5
                          }}
                        >
                          🔍 Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* INSPECT & PRICING MODAL / DRAWER */}
      {showDetailModal && selectedQuote && (
        <Modal 
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)} 
          title={`Quotation Inspection — #${selectedQuote.requestId || selectedQuote._id}`}
          width="min(1100px, 98%)"
        >
          {/* Top action header: Back button & Status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #e2e8f0" }}>
            <button 
              type="button"
              onClick={() => setShowDetailModal(false)}
              style={{
                background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1",
                borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6
              }}
            >
              ← Back to Quote Requests
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedQuote)}
                disabled={downloadingPdf || calculatedPricing.finalAmount <= 0}
                style={{
                  background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
                  borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6
                }}
              >
                📄 {downloadingPdf ? "Generating PDF..." : "Download Quotation PDF"}
              </button>
              <span style={{ fontSize: 11, color: "#64748b" }}>Status:</span>
              <StatusBadge status={selectedQuote.status} />
              {loadingDetail && (
                <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="spinner" style={{ display: "inline-block", width: 10, height: 10, border: "2px solid #93c5fd", borderTopColor: "#2563eb", borderRadius: "50%" }} />
                  Updating...
                </span>
              )}
            </div>
          </div>

          {/* API Error Banner if Fetch had an issue */}
          {detailError && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
              padding: "10px 14px", marginBottom: 14, color: "#92400e", fontSize: 12,
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div><strong>Notice:</strong> {detailError} (Displaying cached list record)</div>
              <button 
                type="button"
                onClick={() => handleInspectQuote(selectedQuote)}
                style={{ background: "#d97706", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                Retry
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: 20, maxHeight: "78vh", overflowY: "auto", paddingRight: 4 }}>
            
            {/* LEFT COLUMN: CUSTOMER SPECS, SPECIFICATIONS & PRICING */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {(() => {
                const cat = (selectedQuote.serviceCategory || "CCTV").toLowerCase();
                const isWebQuote = cat.includes("web") || cat.includes("website");
                const isNetworkQuote = cat.includes("network");
                const isCctvQuote = !isWebQuote && !isNetworkQuote;

                // Web extractions
                const webExistingUrlItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("existing website url:")
                );
                const webExistingUrl = webExistingUrlItem 
                  ? webExistingUrlItem.productName.replace(/existing website url:\s*/i, "").trim() 
                  : "";

                const webFeaturesItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("core features:")
                );
                const webFeaturesList = [
                  ...(Array.isArray(selectedQuote.features) ? selectedQuote.features : []),
                  ...(webFeaturesItem ? webFeaturesItem.productName.replace(/core features:\s*/i, "").split(";").map(s => s.trim()) : [])
                ].filter(Boolean);

                const webHostingItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("domain & hosting:")
                );
                const webHostingText = webHostingItem 
                  ? webHostingItem.productName.replace(/domain & hosting:\s*/i, "").trim()
                  : "";

                const webEcommerceItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("e-commerce scope:")
                );
                const webEcommerceText = webEcommerceItem 
                  ? webEcommerceItem.productName.replace(/e-commerce scope:\s*/i, "").trim()
                  : "";

                // Reference URLs extraction from text
                const extractUrls = (text) => {
                  if (!text) return [];
                  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|in|co\.in|org|net|io|co)[^\s]*)/gi;
                  const matches = text.match(urlRegex) || [];
                  return matches.map(u => u.trim());
                };
                const detectedUrls = Array.from(new Set([
                  ...(webExistingUrl ? [webExistingUrl] : []),
                  ...extractUrls(selectedQuote.additionalRequirements),
                  ...extractUrls(selectedQuote.message)
                ]));

                // Networking extractions
                const networkCablingItems = (selectedQuote.items || []).filter(it => 
                  it.productName?.toLowerCase().includes("cabling") ||
                  it.productName?.toLowerCase().includes("lan point")
                );
                const networkWifiItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("wi-fi scope:")
                );
                const networkTroubleshootItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("troubleshooting focus:")
                );
                const networkEquipmentItems = (selectedQuote.items || []).filter(it => 
                  !it.productName?.toLowerCase().includes("cabling") &&
                  !it.productName?.toLowerCase().includes("lan point") &&
                  !it.productName?.toLowerCase().includes("wi-fi scope:") &&
                  !it.productName?.toLowerCase().includes("troubleshooting focus:")
                );

                // CCTV extractions
                const cctvCameraItems = (selectedQuote.items || []).filter(it => 
                  it.productName?.toLowerCase().includes("camera") ||
                  it.productName?.toLowerCase().includes("dome") ||
                  it.productName?.toLowerCase().includes("bullet") ||
                  it.productName?.toLowerCase().includes("ptz")
                );
                const cctvRecorderItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("nvr") ||
                  it.productName?.toLowerCase().includes("dvr") ||
                  it.productName?.toLowerCase().includes("recorder")
                );
                const cctvStorageItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("hard drive") ||
                  it.productName?.toLowerCase().includes("hdd") ||
                  it.productName?.toLowerCase().includes("sd card")
                );
                const cctvCablingItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("cable") ||
                  it.productName?.toLowerCase().includes("cabling")
                );
                const cctvFittingItem = (selectedQuote.items || []).find(it => 
                  it.productName?.toLowerCase().includes("fitting") ||
                  it.productName?.toLowerCase().includes("alignment")
                );
                const cctvAccessoriesItems = (selectedQuote.items || []).filter(it => 
                  it.productName?.toLowerCase().includes("rack") ||
                  it.productName?.toLowerCase().includes("mount") ||
                  it.productName?.toLowerCase().includes("power supply")
                );

                return (
                  <>
                    {/* 1. Customer Profile Card */}
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                          👤 Customer &amp; Contact Details
                        </h4>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button 
                            type="button"
                            onClick={() => makeCall(selectedQuote.mobile)}
                            style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            📞 Call
                          </button>
                          <button 
                            type="button"
                            onClick={() => openWhatsApp(selectedQuote.mobile, selectedQuote.fullName, selectedQuote.requestId, calculatedPricing.finalAmount)}
                            style={{ background: "#25d366", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            💬 WhatsApp
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                        <div><strong style={{ color: "#64748b" }}>Full Name:</strong> <span style={{ color: "#1e293b", fontWeight: 700 }}>{selectedQuote.fullName || "—"}</span></div>
                        <div><strong style={{ color: "#64748b" }}>Mobile Number:</strong> <span style={{ color: "#1e293b", fontWeight: 700 }}>{selectedQuote.mobile || "—"}</span></div>
                        <div><strong style={{ color: "#64748b" }}>Email:</strong> <span>{selectedQuote.email || "—"}</span></div>
                        <div><strong style={{ color: "#64748b" }}>Company:</strong> <span>{selectedQuote.companyName || "—"}</span></div>
                        {!isWebQuote ? (
                          <div>
                            <strong style={{ color: "#64748b" }}>{isNetworkQuote ? "Premises Type:" : "Property Type:"}</strong>{" "}
                            <span style={{ color: "#1e293b", fontWeight: 650 }}>{selectedQuote.propertyType || (isNetworkQuote ? "Commercial / Office" : "Standard Site")}</span>
                          </div>
                        ) : (
                          <div>
                            <strong style={{ color: "#64748b" }}>Service Delivery:</strong>{" "}
                            <span style={{ color: "#2563eb", fontWeight: 700 }}>100% Digital / Remote Consultation</span>
                          </div>
                        )}
                        <div><strong style={{ color: "#64748b" }}>Created At:</strong> <span>{selectedQuote.createdAt ? new Date(selectedQuote.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</span></div>
                      </div>
                    </div>

                    {/* 2. Service-Specific Scope & Specifications Card */}
                    {isWebQuote && (
                      <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #bfdbfe" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <h4 style={{ margin: 0, fontSize: 12, color: "#1e40af", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                            🌐 Website Design &amp; Development Scope
                          </h4>
                          <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                            Digital Project
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginBottom: 12 }}>
                          <div>
                            <strong style={{ color: "#64748b" }}>Service Category:</strong>{" "}
                            <span style={{ color: "#2563eb", fontWeight: 800 }}>Web Designing</span>
                          </div>
                          <div>
                            <strong style={{ color: "#64748b" }}>Website Project Type:</strong>{" "}
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedQuote.subcategory || selectedQuote.service || "Business Website"}</span>
                          </div>
                        </div>

                        <div style={{ background: "#fff", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                          {/* Business / Scope requirements */}
                          <div>
                            <strong style={{ color: "#475569", display: "block", marginBottom: 2 }}>Project Requirements &amp; Scope:</strong>
                            <div style={{ color: "#1e293b", background: "#f8fafc", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", lineHeight: 1.5 }}>
                              {selectedQuote.additionalRequirements || selectedQuote.requirementType || "Custom business website design, responsive layouts, and engineering consultation."}
                            </div>
                          </div>

                          {/* Domain & Hosting */}
                          {webHostingText && (
                            <div>
                              <strong style={{ color: "#64748b" }}>Domain &amp; Cloud Hosting:</strong>{" "}
                              <span style={{ color: "#0f172a", fontWeight: 600 }}>{webHostingText}</span>
                            </div>
                          )}

                          {/* Core Interactive Features */}
                          {webFeaturesList.length > 0 && (
                            <div>
                              <strong style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Requested Features &amp; Integrations:</strong>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {webFeaturesList.map((feat, idx) => (
                                  <span key={idx} style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "1px solid #bfdbfe" }}>
                                    ✓ {feat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* E-Commerce Scope */}
                          {webEcommerceText && (
                            <div>
                              <strong style={{ color: "#64748b" }}>E-Commerce Catalog &amp; Cart Scope:</strong>{" "}
                              <span style={{ color: "#0f172a", fontWeight: 600 }}>{webEcommerceText}</span>
                            </div>
                          )}

                          {/* Reference / Existing URLs */}
                          {detectedUrls.length > 0 && (
                            <div>
                              <strong style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Reference / Existing Website URLs:</strong>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {detectedUrls.map((u, idx) => (
                                  <a 
                                    key={idx} 
                                    href={u.startsWith("http") ? u : `https://${u}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: "#2563eb", fontWeight: 700, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}
                                  >
                                    🔗 {u}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isNetworkQuote && (
                      <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <h4 style={{ margin: 0, fontSize: 12, color: "#0f766e", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                            🔌 Networking Infrastructure Scope
                          </h4>
                          <span style={{ background: "#ccfbf1", color: "#0f766e", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                            IT &amp; Cabling
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginBottom: 12 }}>
                          <div>
                            <strong style={{ color: "#64748b" }}>Category:</strong>{" "}
                            <span style={{ color: "#0d9488", fontWeight: 800 }}>Networking</span>
                          </div>
                          <div>
                            <strong style={{ color: "#64748b" }}>Service Type:</strong>{" "}
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedQuote.subcategory || selectedQuote.service || "Office Network Setup"}</span>
                          </div>
                        </div>

                        <div style={{ background: "#fff", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <strong style={{ color: "#64748b" }}>Premises Setup Scope:</strong>{" "}
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedQuote.propertyType || "Office / Facility"}</span>
                          </div>

                          {/* Active Network Equipment */}
                          {networkEquipmentItems.length > 0 && (
                            <div>
                              <strong style={{ color: "#475569", display: "block", marginBottom: 4 }}>Active Network Equipment &amp; Racks:</strong>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {networkEquipmentItems.map((item, idx) => (
                                  <div key={idx} style={{ background: "#f0fdfa", padding: "6px 10px", borderRadius: 8, border: "1px solid #99f6e4", color: "#115e59" }}>
                                    <strong>{item.productName}</strong> × {item.quantity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Structured Cabling */}
                          {networkCablingItems.length > 0 && (
                            <div>
                              <strong style={{ color: "#475569", display: "block", marginBottom: 4 }}>Structured Cabling &amp; LAN Points:</strong>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {networkCablingItems.map((item, idx) => (
                                  <span key={idx} style={{ background: "#f8fafc", padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", color: "#334155" }}>
                                    📌 {item.productName} (Qty: {item.quantity})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Wi-Fi Scope */}
                          {networkWifiItem && (
                            <div>
                              <strong style={{ color: "#64748b" }}>Wi-Fi Coverage &amp; AP Standard:</strong>{" "}
                              <span style={{ color: "#0f172a", fontWeight: 600 }}>{networkWifiItem.productName}</span>
                            </div>
                          )}

                          {/* Troubleshooting */}
                          {networkTroubleshootItem && (
                            <div>
                              <strong style={{ color: "#64748b" }}>Diagnostic Scope:</strong>{" "}
                              <span style={{ color: "#0f172a", fontWeight: 600 }}>{networkTroubleshootItem.productName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isCctvQuote && (
                      <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <h4 style={{ margin: 0, fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                            🎥 CCTV Surveillance Specifications
                          </h4>
                          <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                            Surveillance System
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginBottom: 12 }}>
                          <div>
                            <strong style={{ color: "#64748b" }}>Category:</strong>{" "}
                            <span style={{ color: "#2563eb", fontWeight: 800 }}>CCTV</span>
                          </div>
                          <div>
                            <strong style={{ color: "#64748b" }}>Service Type:</strong>{" "}
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedQuote.subcategory || selectedQuote.service || "Install New CCTV"}</span>
                          </div>
                        </div>

                        <div style={{ background: "#fff", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <strong style={{ color: "#64748b" }}>Site Property Type:</strong>{" "}
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedQuote.propertyType || "Residential / Commercial"}</span>
                          </div>

                          {/* Camera Hardware Breakdown */}
                          {cctvCameraItems.length > 0 && (
                            <div>
                              <strong style={{ color: "#475569", display: "block", marginBottom: 4 }}>Camera Hardware Breakdown:</strong>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {cctvCameraItems.map((item, idx) => (
                                  <div key={idx} style={{ background: "#eff6ff", padding: "6px 10px", borderRadius: 8, border: "1px solid #bfdbfe", color: "#1e40af" }}>
                                    <strong>{item.productName}</strong> × {item.quantity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recorder & Storage */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                              <strong style={{ color: "#64748b" }}>Recorder (NVR/DVR):</strong>{" "}
                              <span style={{ color: "#0f172a", fontWeight: 600 }}>{cctvRecorderItem ? cctvRecorderItem.productName : (selectedQuote.recorder || "Included in package / Not specified")}</span>
                            </div>
                            <div>
                              <strong style={{ color: "#64748b" }}>Surveillance Storage:</strong>{" "}
                              <span style={{ color: "#0f172a", fontWeight: 600 }}>{cctvStorageItem ? cctvStorageItem.productName : (selectedQuote.storage || "Included in package / Not specified")}</span>
                            </div>
                          </div>

                          {/* Cabling & Fitting */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                              <strong style={{ color: "#64748b" }}>Cabling Specs:</strong>{" "}
                              <span style={{ color: "#0f172a", fontWeight: 600 }}>{cctvCablingItem ? cctvCablingItem.productName : "Standard Coaxial / Cat6"}</span>
                            </div>
                            <div>
                              <strong style={{ color: "#64748b" }}>Installation Service:</strong>{" "}
                              <span style={{ color: "#0f172a", fontWeight: 600 }}>{cctvFittingItem ? `${cctvFittingItem.productName} (Qty: ${cctvFittingItem.quantity})` : "Professional Fitting & Alignment"}</span>
                            </div>
                          </div>

                          {/* Accessories */}
                          {cctvAccessoriesItems.length > 0 && (
                            <div>
                              <strong style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Racks &amp; Mounting:</strong>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {cctvAccessoriesItems.map((item, idx) => (
                                  <span key={idx} style={{ background: "#f8fafc", padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1" }}>
                                    ✓ {item.productName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. Schedule & Location Card */}
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                      <h4 style={{ margin: "0 0 10px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                        {isWebQuote ? "🗓️ Consultation Schedule &amp; Client Location" : "📍 Service Schedule &amp; Site Address"}
                      </h4>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                        <div>
                          <strong style={{ color: "#64748b" }}>{isWebQuote ? "Preferred Consultation Date:" : "Preferred Visit Date:"}</strong>{" "}
                          <span style={{ color: "#1e293b", fontWeight: 700 }}>
                            {selectedQuote.preferredVisitDate 
                              ? new Date(selectedQuote.preferredVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : (selectedQuote.preferredDate || "Flexible / ASAP")}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: "#64748b" }}>{isWebQuote ? "Preferred Discussion Slot:" : "Preferred Time Slot:"}</strong>{" "}
                          <span style={{ color: "#1e293b", fontWeight: 700 }}>
                            {selectedQuote.preferredVisitTime || selectedQuote.preferredTimeSlot || "Flexible / Any Time"}
                          </span>
                        </div>

                        {isWebQuote ? (
                          <>
                            <div style={{ gridColumn: "span 2" }}>
                              <strong style={{ color: "#64748b" }}>Discussion Mode:</strong>{" "}
                              <span style={{ color: "#2563eb", fontWeight: 700 }}>Google Meet / Phone Consultation (No physical site visit needed)</span>
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                              <strong style={{ color: "#64748b" }}>Client / Billing Address:</strong>{" "}
                              <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.address || selectedQuote.locality || "Remote Delivery / Client Address Not Provided"}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ gridColumn: "span 2" }}>
                              <strong style={{ color: "#64748b" }}>Full Service Address:</strong>{" "}
                              <span style={{ color: "#1e293b", fontWeight: 600 }}>{selectedQuote.address || "—"}</span>
                            </div>
                            <div>
                              <strong style={{ color: "#64748b" }}>Locality / Area:</strong>{" "}
                              <span>{selectedQuote.locality || "—"}</span>
                            </div>
                            <div>
                              <strong style={{ color: "#64748b" }}>Pincode:</strong>{" "}
                              <span>{selectedQuote.pincode || "—"}</span>
                            </div>
                            {(selectedQuote.googleMapsUrl || (selectedQuote.latitude && selectedQuote.longitude)) && (
                              <div style={{ gridColumn: "span 2", marginTop: 4 }}>
                                <a 
                                  href={selectedQuote.googleMapsUrl || `https://www.google.com/maps?q=${selectedQuote.latitude},${selectedQuote.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    color: "#2563eb", fontWeight: 700, fontSize: 11, textDecoration: "none",
                                    display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff",
                                    padding: "4px 10px", borderRadius: 6, border: "1px solid #bfdbfe"
                                  }}
                                >
                                  📍 Open Pin on Google Maps ({selectedQuote.latitude ? `${selectedQuote.latitude}, ${selectedQuote.longitude}` : 'View Location'})
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* 4. Additional Requirements & Voice Note Player */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  📝 Additional Requirements &amp; Audio Note
                </h4>
                
                <p style={{ margin: "0 0 10px 0", color: "#334155", background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {selectedQuote.additionalRequirements || selectedQuote.message || "No additional written requirements specified by customer."}
                </p>

                {/* Voice Note Audio Player */}
                {selectedQuote.voiceNote?.url ? (
                  <div style={{ background: "#eff6ff", padding: 12, borderRadius: 12, border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>🎙️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>
                        Customer Voice Note ({selectedQuote.voiceNote.duration ? `${selectedQuote.voiceNote.duration}s` : 'Recorded Audio'})
                      </div>
                      <audio controls src={selectedQuote.voiceNote.url} style={{ width: "100%", height: 32 }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                    No voice note audio was recorded for this quotation request.
                  </div>
                )}

                {/* Uploaded Photos Gallery */}
                {Array.isArray(selectedQuote.images) && selectedQuote.images.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #e2e8f0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                      Attached Layout / Site Photos ({selectedQuote.images.length}):
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {selectedQuote.images.map((imgUrl, idx) => (
                        <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", border: "1.5px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                          <img src={imgUrl} alt={`Upload ${idx + 1}`} style={{ width: 72, height: 72, objectFit: "cover", display: "block" }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. ADMIN QUOTATION BUILDER (EXCEL-STYLE SPREADSHEET ENTRY) */}
              <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "2px solid #2563eb", boxShadow: "0 6px 18px rgba(37,99,235,0.1)" }}>
                {/* Header Banner */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dbeafe", color: "#1d4ed8", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>
                      ⚡ Prepare Quotation / Create Quote
                    </div>
                    <h4 style={{ margin: 0, fontSize: 14, color: "#0f172a", fontWeight: 800 }}>
                      📊 Excel-Style Quotation Builder
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#64748b" }}>
                      Manually enter line items, unit rates, quantities, and terms. Amounts recalculate automatically.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Quote Validity:</span>
                    <input 
                      type="number"
                      min="1"
                      max="180"
                      value={validityDays}
                      onChange={e => setValidityDays(Math.max(1, parseInt(e.target.value, 10) || 15))}
                      style={{ width: 55, height: 28, padding: "0 6px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 11, fontWeight: 700, textAlign: "center" }}
                    />
                    <span style={{ fontSize: 11, color: "#64748b" }}>days</span>
                  </div>
                </div>

                {/* Excel-Style Table */}
                <div style={{ overflowX: "auto", border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc", marginBottom: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 620 }}>
                    <thead>
                      <tr style={{ background: "#e2e8f0", borderBottom: "1.5px solid #cbd5e1", color: "#334155", textAlign: "left" }}>
                        <th style={{ padding: "8px 10px", width: 36, textAlign: "center", fontSize: 11, fontWeight: 800 }}>#</th>
                        <th style={{ padding: "8px 10px", fontWeight: 800, color: "#1e293b" }}>Particulars / Item Description</th>
                        <th style={{ padding: "8px 10px", width: 75, textAlign: "center", fontWeight: 800 }}>Qty</th>
                        <th style={{ padding: "8px 10px", width: 130, textAlign: "right", fontWeight: 800 }}>Per Unit (₹)</th>
                        <th style={{ padding: "8px 10px", width: 125, textAlign: "right", fontWeight: 800 }}>Amount (₹)</th>
                        <th style={{ padding: "8px 8px", width: 44, textAlign: "center", fontWeight: 800 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedPricing.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", background: "#fff" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>No quotation line items added yet.</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>Click &quot;➕ Add Line Item&quot; or choose a preset below to build the quotation.</div>
                          </td>
                        </tr>
                      ) : (
                        calculatedPricing.items.map((item, idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe", borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#64748b", fontSize: 11 }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: "6px 8px" }}>
                              <input 
                                type="text"
                                placeholder="Enter item description, service deliverable, equipment, or AMC scope..."
                                value={item.productName}
                                onChange={e => handleItemFieldChange(idx, "productName", e.target.value)}
                                style={{
                                  width: "100%", height: 32, padding: "0 8px", border: "1px solid #cbd5e1",
                                  borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#1e293b", background: "#fff",
                                  boxSizing: "border-box"
                                }}
                              />
                            </td>
                            <td style={{ padding: "6px 6px", textAlign: "center" }}>
                              <input 
                                type="number"
                                min="1"
                                step="any"
                                value={item.quantity}
                                onChange={e => handleItemFieldChange(idx, "quantity", e.target.value)}
                                style={{
                                  width: "100%", height: 32, padding: "0 6px", border: "1px solid #cbd5e1",
                                  borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#1d4ed8",
                                  textAlign: "center", background: "#fff", boxSizing: "border-box"
                                }}
                              />
                            </td>
                            <td style={{ padding: "6px 6px", textAlign: "right" }}>
                              <input 
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0.00"
                                value={item.unitPrice}
                                onChange={e => handleItemFieldChange(idx, "unitPrice", e.target.value)}
                                style={{
                                  width: "100%", height: 32, padding: "0 8px", border: "1px solid #93c5fd",
                                  borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#1e293b",
                                  textAlign: "right", background: "#eff6ff", boxSizing: "border-box"
                                }}
                              />
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, color: "#0f172a", fontSize: 12 }}>
                              ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "6px 4px", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                title="Remove line item"
                                style={{
                                  background: "#fee2e2", border: "1px solid #fecaca", color: "#dc2626",
                                  cursor: "pointer", width: 28, height: 28, borderRadius: 6,
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 12
                                }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Quick Addition Toolbar */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => handleAddLineItem("", 1, "")}
                    style={{
                      padding: "6px 12px", background: "#2563eb", color: "#fff", border: "none",
                      borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5
                    }}
                  >
                    ➕ Add Line Item
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLineItem("Service Charges", 1, "")}
                    style={{
                      padding: "6px 10px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1",
                      borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    + Service Charges
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLineItem("Installation & Fitting Charges", 1, "")}
                    style={{
                      padding: "6px 10px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1",
                      borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    + Installation Labour
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLineItem("PVC Box & Accessories", 1, "")}
                    style={{
                      padding: "6px 10px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1",
                      borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    + PVC Box & Accessories
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLineItem("Miscellaneous / Cabling", 1, "")}
                    style={{
                      padding: "6px 10px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1",
                      borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    + Miscellaneous
                  </button>
                </div>

                {/* Tax Configuration & Summary Card */}
                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 12, border: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                  {/* Tax Rate Selector */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Tax Rate (GST):</span>
                      {[0, 5, 12, 18, 28].map(rate => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setGstRate(rate)}
                          style={{
                            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                            border: gstRate === rate ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            background: gstRate === rate ? "#eff6ff" : "#fff",
                            color: gstRate === rate ? "#1d4ed8" : "#475569",
                            cursor: "pointer"
                          }}
                        >
                          {rate === 0 ? "0% (Exempt)" : `${rate}%`}
                        </button>
                      ))}
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 4 }}>
                        <span style={{ fontSize: 10, color: "#64748b" }}>Custom:</span>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={gstRate}
                          onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
                          style={{ width: 48, height: 24, padding: "0 4px", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 11, textAlign: "center", fontWeight: 700 }}
                        />
                        <span style={{ fontSize: 11, color: "#64748b" }}>%</span>
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "2px 0" }} />

                  {/* Calculations breakdown */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569" }}>
                    <span>Items Taxable Subtotal:</span>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>
                      ₹{calculatedPricing.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569" }}>
                    <span>GST ({gstRate}%):</span>
                    <span style={{ fontWeight: 700, color: "#d97706" }}>
                      + ₹{calculatedPricing.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#0f172a", paddingTop: 4, borderTop: "1px dashed #cbd5e1" }}>
                    <span>Grand Total:</span>
                    <span style={{ color: "#2563eb", fontSize: 17 }}>
                      ₹{calculatedPricing.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Terms and Conditions Section */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                    📜 Quotation Terms &amp; Conditions:
                  </label>
                  <textarea 
                    rows={3}
                    value={quoteTerms}
                    onChange={e => setQuoteTerms(e.target.value)}
                    placeholder="Enter quotation terms and conditions (e.g. 1. 50% advance on confirmation. 2. 1-Year hardware warranty...)"
                    style={{
                      width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 8,
                      fontSize: 11, lineHeight: 1.5, color: "#1e293b", background: "#fff", boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* Pricing Action Buttons */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleSavePricing(true)}
                    disabled={savingPrices}
                    style={{
                      flex: 1, minWidth: 140, height: 40, background: "#f8fafc", color: "#1e293b",
                      border: "1.5px solid #cbd5e1", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    {savingPrices ? "Saving Draft..." : "💾 Save Draft"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedQuote)}
                    disabled={downloadingPdf || calculatedPricing.finalAmount <= 0}
                    style={{
                      flex: 1, minWidth: 140, height: 40, background: "#f0fdf4", color: "#166534",
                      border: "1.5px solid #bbf7d0", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5
                    }}
                  >
                    📄 {downloadingPdf ? "Generating PDF..." : "Download PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendQuotation}
                    disabled={sendingQuote || calculatedPricing.finalAmount <= 0}
                    style={{
                      flex: 1.4, minWidth: 190, height: 40, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff",
                      border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(37,99,235,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}
                  >
                    {sendingQuote ? (
                      <>
                        <span className="spinner" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%" }} />
                        Sending via WhatsApp...
                      </>
                    ) : (
                      "🚀 Send via WhatsApp"
                    )}
                  </button>
                </div>

                {/* WhatsApp delivery result notice */}
                {whatsappResult && (
                  <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: whatsappResult.whatsappSent ? "#f0fdf4" : "#eff6ff", border: `1.5px solid ${whatsappResult.whatsappSent ? "#bbf7d0" : "#bfdbfe"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                      <div style={{ color: whatsappResult.whatsappSent ? "#166534" : "#1e40af", fontWeight: 800, fontSize: 13 }}>
                        {whatsappResult.whatsappSent ? "✓ Quotation Delivered via WhatsApp Gateway" : "📄 Professional PDF Generated &amp; WhatsApp Link Ready"}
                      </div>
                      <span style={{ fontSize: 11, background: "#fff", padding: "2px 8px", borderRadius: 6, fontWeight: 700, color: "#475569", border: "1px solid #cbd5e1" }}>
                        Status: QUOTATION SENT
                      </span>
                    </div>

                    {whatsappResult.whatsappSent ? (
                      <div style={{ color: "#15803d", fontSize: 12, lineHeight: 1.5 }}>
                        Official quotation PDF was verified, and the notification was confirmed delivered to the customer (+91 {selectedQuote.mobile}) via carrier gateway.
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
                        <p style={{ margin: "0 0 10px 0" }}>
                          Automated WhatsApp gateway is in fallback/sandbox mode. The TechBes quotation PDF has been generated. Use the button below to download the PDF and open WhatsApp Web/App to attach it with one click:
                        </p>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={async () => {
                              await handleDownloadPdf(selectedQuote);
                              if (whatsappResult.clickToChatUrl) {
                                window.open(whatsappResult.clickToChatUrl, "_blank", "noopener,noreferrer");
                              }
                            }}
                            style={{
                              padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none",
                              borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                              boxShadow: "0 2px 4px rgba(37,99,235,0.25)"
                            }}
                          >
                            📥 Download PDF + Open WhatsApp
                          </button>
                          {whatsappResult.clickToChatUrl && (
                            <a 
                              href={whatsappResult.clickToChatUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: "#2563eb", fontWeight: 700, textDecoration: "underline", fontSize: 12 }}
                            >
                              Open WhatsApp Only →
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: ADMINISTRATIVE CONTROLS & ASSIGNMENT */}
            <form onSubmit={handleUpdateQuoteDetails} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  ⚙️ Workflow &amp; Assignment
                </h4>
                
                {/* Status selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>CURRENT WORKFLOW STATUS</label>
                  <select
                    value={quoteStatus}
                    onChange={e => setQuoteStatus(e.target.value)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 650, color: "#334155"
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
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Validity Days */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>QUOTE VALIDITY (DAYS)</label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={e => setValidityDays(parseInt(e.target.value, 10) || 15)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", color: "#334155", background: "#fff"
                    }}
                  />
                </div>

                {/* Assigned staff */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>
                    {((selectedQuote.serviceCategory || "").toLowerCase().includes("web"))
                      ? "ASSIGN PROJECT MANAGER / WEB CONSULTANT (OPTIONAL)"
                      : ((selectedQuote.serviceCategory || "").toLowerCase().includes("network"))
                      ? "ASSIGN NETWORK ENGINEER / TECHNICIAN"
                      : "ASSIGN CCTV FIELD TECHNICIAN"}
                  </label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", background: "#fff", fontWeight: 600, color: "#334155"
                    }}
                  >
                    <option value="">{((selectedQuote.serviceCategory || "").toLowerCase().includes("web")) ? "Unassigned (Remote / In-house)" : "Unassigned"}</option>
                    {technicians.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.role})</option>
                    ))}
                  </select>
                  {((selectedQuote.serviceCategory || "").toLowerCase().includes("web")) && (
                    <span style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>
                      Note: Website projects do not require an on-site field technician visit.
                    </span>
                  )}
                </div>

                {/* Follow up date */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>NEXT FOLLOW UP DATE</label>
                  <input 
                    type="date"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    style={{
                      height: 38, padding: "0 8px", border: "1px solid #cbd5e1", 
                      borderRadius: 10, fontSize: 12, outline: "none", color: "#334155", background: "#fff"
                    }}
                  />
                </div>

                {/* Internal Admin notes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>INTERNAL ADMIN NOTES</label>
                  <textarea
                    rows={4}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Enter customer call notes, inspection findings, or discount discussions..."
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
                  {savingNotes ? "Saving Workflow..." : "Save Workflow & Notes"}
                </button>
              </div>

              {/* CONVERT TO ORDER BUTTON */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#1e293b", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  ⚡ Order Conversion
                </h4>
                {selectedQuote.orderNumber ? (
                  <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0", fontSize: 12 }}>
                    <span style={{ color: "#065f46", fontWeight: 700 }}>✓ Converted to Active Order:</span>
                    <div style={{ fontFamily: "monospace", fontWeight: 800, color: "#047857", marginTop: 4, fontSize: 13 }}>
                      {selectedQuote.orderNumber}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: "0 0 10px 0", fontSize: 11, color: "#64748b" }}>
                      Once the client approves, click below to convert this quotation into an active Job Order.
                    </p>
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
                      {converting ? "Converting to Job Order..." : "⚡ Convert to Job Order"}
                    </button>
                  </div>
                )}
              </div>

              {/* Close Action in Drawer Bottom */}
              <button 
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={{
                  width: "100%", height: 38, background: "#fff", color: "#64748b",
                  border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer"
                }}
              >
                Close Inspection
              </button>
            </form>

          </div>
        </Modal>
      )}

    </div>
  );
}
