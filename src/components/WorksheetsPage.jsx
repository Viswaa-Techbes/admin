"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiClient";
import { GridIcon } from "./Icons";

export function WorksheetsPage() {
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  
  // Rejection dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Lightbox overlay state
  const [activePhoto, setActivePhoto] = useState(null);

  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [techSearch, setTechSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchWorksheets();
  }, []);

  const fetchWorksheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const { payload } = await apiFetch("/api/v2/worksheets");
      if (payload.success) {
        setWorksheets(payload.data || []);
      } else {
        throw new Error(payload.message || "Failed to load worksheets");
      }
    } catch (err) {
      setError(err.message || "Error retrieving service worksheets.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jobId) => {
    if (!confirm("Are you sure you want to approve this service worksheet? This will generate the final invoice PDF.")) return;
    try {
      setActionLoading(true);
      const { payload } = await apiFetch(`/api/v2/worksheets/job/${jobId}/approve`, { method: "POST" });
      if (payload.success) {
        alert("Worksheet approved successfully! PDF report has been generated.");
        setSelectedWorksheet(null);
        fetchWorksheets();
      } else {
        throw new Error(payload.message);
      }
    } catch (err) {
      alert("Approval failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      const { payload } = await apiFetch(`/api/v2/worksheets/job/${selectedWorksheet.jobId._id || selectedWorksheet.jobId}/reject`, {
        method: "POST",
        body: { reason: rejectionReason.trim() }
      });
      if (payload.success) {
        alert("Worksheet rejected and sent back to the technician.");
        setShowRejectDialog(false);
        setRejectionReason("");
        setSelectedWorksheet(null);
        fetchWorksheets();
      } else {
        throw new Error(payload.message);
      }
    } catch (err) {
      alert("Rejection failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWorksheets = worksheets.filter((ws) => {
    // Tab filter
    if (activeTab !== "all") {
      if (ws.status !== activeTab) return false;
    }
    // Worksheet Number search
    if (searchTerm && !ws.worksheetNumber?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Booking Number search
    if (bookingSearch && !ws.bookingId?.toLowerCase().includes(bookingSearch.toLowerCase())) {
      return false;
    }
    // Job ID search
    if (jobSearch && !ws.jobId?._id?.toLowerCase().includes(jobSearch.toLowerCase()) && !ws.jobId?.toLowerCase().includes(jobSearch.toLowerCase())) {
      return false;
    }
    // Customer Name search
    if (customerSearch && !ws.customerName?.toLowerCase().includes(customerSearch.toLowerCase())) {
      return false;
    }
    // Technician Name search
    if (techSearch && !ws.technicianId?.name?.toLowerCase().includes(techSearch.toLowerCase())) {
      return false;
    }
    // Date Range search
    if (startDate || endDate) {
      const wsDate = new Date(ws.createdAt);
      if (startDate && wsDate < new Date(startDate)) return false;
      if (endDate) {
        const endLimit = new Date(endDate);
        endLimit.setHours(23, 59, 59, 999);
        if (wsDate > endLimit) return false;
      }
    }
    return true;
  });

  const stats = {
    total: worksheets.length,
    submitted: worksheets.filter(w => w.status === 'submitted').length,
    approved: worksheets.filter(w => w.status === 'approved').length,
    drafts: worksheets.filter(w => w.status === 'draft' || w.status === 'in_progress').length,
  };

  const totalItems = filteredWorksheets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedWorksheets = filteredWorksheets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px", color: "#64748b" }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>Loading Service Worksheets...</div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Top Banner stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <StatCard title="Total Worksheets" value={stats.total} color="#6366f1" />
        <StatCard title="Awaiting Approval" value={stats.submitted} color="#f59e0b" highlight />
        <StatCard title="Approved / Completed" value={stats.approved} color="#10b981" />
        <StatCard title="Drafts / In Progress" value={stats.drafts} color="#94a3b8" />
      </div>

      {/* Main Container */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 16px", gap: "8px", background: "#f8fafc" }}>
          {["all", "submitted", "approved", "draft", "in_progress"].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              style={{
                padding: "16px 12px",
                fontSize: "13px",
                fontWeight: 600,
                color: activeTab === tab ? "#2563eb" : "#64748b",
                borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent",
                background: "none",
                border: "none",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              {tab === "draft" ? "Drafts" : tab === "in_progress" ? "In Progress" : tab}
            </button>
          ))}
        </div>

        {/* Filters and Searches (Phase 10 Requirement) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", padding: "16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Worksheet #</label>
            <input
              type="text"
              placeholder="e.g. WS-000001"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Booking Ref</label>
            <input
              type="text"
              placeholder="e.g. BOOK-1234"
              value={bookingSearch}
              onChange={(e) => { setBookingSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Job ID</label>
            <input
              type="text"
              placeholder="e.g. 64a7c..."
              value={jobSearch}
              onChange={(e) => { setJobSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Customer Name</label>
            <input
              type="text"
              placeholder="Search customer..."
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Technician Name</label>
            <input
              type="text"
              placeholder="Search technician..."
              value={techSearch}
              onChange={(e) => { setTechSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }}
            />
          </div>
        </div>

        {/* Table List */}
        {totalItems === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
            No worksheets found in this category.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Worksheet #</th>
                  <th style={{ padding: "12px 16px" }}>Booking Ref</th>
                  <th style={{ padding: "12px 16px" }}>Customer Name</th>
                  <th style={{ padding: "12px 16px" }}>Service Category</th>
                  <th style={{ padding: "12px 16px" }}>Technician</th>
                  <th style={{ padding: "12px 16px" }}>Grand Total</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ color: "#334155" }}>
                {paginatedWorksheets.map((ws) => (
                  <tr key={ws._id} style={{ borderBottom: "1px solid #f1f5f9", hover: { background: "#f8fafc" } }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{ws.worksheetNumber}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{ws.bookingId}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div>{ws.customerName}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{ws.customerMobile}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ textTransform: "capitalize" }}>{ws.serviceType}</span> — {ws.serviceCategory}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{ws.technicianId?.name || "Unassigned"}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e3a8a" }}>₹{ws.totalCost}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusChip status={ws.status} />
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedWorksheet(ws)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "12px"
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} worksheets
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: currentPage === 1 ? "#f1f5f9" : "#fff",
                  color: currentPage === 1 ? "#94a3b8" : "#334155",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "12px"
                }}
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: currentPage === totalPages ? "#f1f5f9" : "#fff",
                  color: currentPage === totalPages ? "#94a3b8" : "#334155",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "12px"
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review details modal */}
      {selectedWorksheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: "24px" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "800px", maxHeight: "90vh", borderRadius: "24px", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            
            {/* Modal Header */}
            <div style={{ background: "#0f172a", color: "#fff", padding: "20px 24px", display: "flex", justifyItems: "center", justifyContent: "between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Worksheet {selectedWorksheet.worksheetNumber}</h3>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Booking Reference: {selectedWorksheet.bookingId}</span>
              </div>
              <button
                onClick={() => setSelectedWorksheet(null)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", outline: "none" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px", fontSize: "13px" }}>
              
              {/* Customer and Technician Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                  <h4 style={{ fontWeight: 700, color: "#475569", marginBottom: "8px", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>Customer Details</h4>
                  <p style={{ margin: "4px 0" }}><strong>Name:</strong> {selectedWorksheet.customerName}</p>
                  <p style={{ margin: "4px 0" }}><strong>Mobile:</strong> {selectedWorksheet.customerMobile}</p>
                  <p style={{ margin: "4px 0" }}><strong>Address:</strong> {selectedWorksheet.customerAddress}</p>
                </div>

                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                  <h4 style={{ fontWeight: 700, color: "#475569", marginBottom: "8px", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>Technician Details</h4>
                  <p style={{ margin: "4px 0" }}><strong>Name:</strong> {selectedWorksheet.technicianId?.name || "N/A"}</p>
                  <p style={{ margin: "4px 0" }}><strong>Phone:</strong> {selectedWorksheet.technicianId?.phone || "N/A"}</p>
                  <p style={{ margin: "4px 0" }}><strong>Specialty:</strong> {selectedWorksheet.technicianId?.specialty || "N/A"}</p>
                </div>
              </div>

              {/* Service description findings */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                <h4 style={{ fontWeight: 700, color: "#475569", marginBottom: "8px", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>Service Description & Field Observations</h4>
                <div style={{ marginBottom: "12px" }}>
                  <strong style={{ fontSize: "11px", color: "#64748b" }}>Requested Description:</strong>
                  <p style={{ margin: "4px 0 0", color: "#1e293b", background: "#fff", padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>{selectedWorksheet.requestedWorkDescription || "N/A"}</p>
                </div>
                <div>
                  <strong style={{ fontSize: "11px", color: "#64748b" }}>Field Findings:</strong>
                  <p style={{ margin: "4px 0 0", color: "#1e293b", background: "#fff", padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: 500 }}>{selectedWorksheet.technicianObservations || "N/A"}</p>
                </div>
              </div>

              {/* Materials Table */}
              <div>
                <h4 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "12px", fontSize: "14px" }}>Materials Used</h4>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "8px 12px" }}>Item Name</th>
                        <th style={{ padding: "8px 12px" }}>Category</th>
                        <th style={{ padding: "8px 12px", textAlign: "center" }}>Qty</th>
                        <th style={{ padding: "8px 12px" }}>Unit</th>
                        <th style={{ padding: "8px 12px", textAlign: "right" }}>Unit Price</th>
                        <th style={{ padding: "8px 12px", textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedWorksheet.materialsUsed || selectedWorksheet.materialsUsed.length === 0) ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "16px", textAlign: "center", color: "#94a3b8" }}>No materials reported.</td>
                        </tr>
                      ) : (
                        selectedWorksheet.materialsUsed.map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 600 }}>{m.name}</td>
                            <td style={{ padding: "8px 12px" }}>{m.category || m.brand || "-"}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>{m.quantity}</td>
                            <td style={{ padding: "8px 12px" }}>{m.unit || "Piece"}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>₹{m.unitPrice || m.unitCost || 0}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>₹{m.total || m.totalCost || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Photos Gallery */}
              <div>
                <h4 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "12px", fontSize: "14px" }}>Site Photos Gallery</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <PhotoCategoryBox 
                    title="Before Work" 
                    urls={selectedWorksheet.beforePhotos} 
                    onView={setActivePhoto} 
                  />
                  <PhotoCategoryBox 
                    title="During Work" 
                    urls={selectedWorksheet.duringPhotos} 
                    onView={setActivePhoto} 
                  />
                  <PhotoCategoryBox 
                    title="After Work" 
                    urls={selectedWorksheet.afterPhotos} 
                    onView={setActivePhoto} 
                  />
                </div>
              </div>

              {/* Signatures display */}
              <div>
                <h4 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "12px", fontSize: "14px" }}>Signatures</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ border: "1px solid #e2e8f0", padding: "12px", borderRadius: "12px", background: "#f8fafc", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Customer</span>
                    {selectedWorksheet.customerSignatureUrl ? (
                      <img src={selectedWorksheet.customerSignatureUrl} alt="Customer Signature" style={{ height: "60px", margin: "0 auto", objectContain: "contain" }} />
                    ) : (
                      <span style={{ color: "#ef4444", fontSize: "11px" }}>Awaiting customer signature</span>
                    )}
                  </div>
                  <div style={{ border: "1px solid #e2e8f0", padding: "12px", borderRadius: "12px", background: "#f8fafc", textAlign: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Technician</span>
                    {selectedWorksheet.technicianSignatureUrl ? (
                      <img src={selectedWorksheet.technicianSignatureUrl} alt="Technician Signature" style={{ height: "60px", margin: "0 auto", objectContain: "contain" }} />
                    ) : (
                      <span style={{ color: "#ef4444", fontSize: "11px" }}>Awaiting technician signature</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Summary Cost Section */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", maxWidth: "300px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Labour Charges:</span>
                    <strong>₹{selectedWorksheet.labourCost}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Materials Cost:</span>
                    <strong>₹{selectedWorksheet.materialCost}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: "8px", fontSize: "15px" }}>
                    <strong>Total Amount:</strong>
                    <strong style={{ color: "#2563eb" }}>₹{selectedWorksheet.totalCost}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Rejection input dialog inline */}
            {showRejectDialog && (
              <form onSubmit={handleRejectSubmit} style={{ borderTop: "2px solid #ef4444", padding: "20px", background: "#fef2f2" }}>
                <h4 style={{ color: "#991b1b", fontWeight: 700, margin: "0 0 10px" }}>Provide Rejection Feedback</h4>
                <textarea
                  required
                  placeholder="Explain why this worksheet is being rejected (e.g. invalid photo, incorrect serial numbers...)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: "100%", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px", fontSize: "13px", height: "80px", resize: "none", outline: "none", marginBottom: "12px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" onClick={() => setShowRejectDialog(false)} style={{ padding: "6px 12px", border: "none", background: "#e2e8f0", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} style={{ padding: "6px 12px", border: "none", background: "#ef4444", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                    {actionLoading ? "Rejecting..." : "Submit Rejection"}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer Actions */}
            {!showRejectDialog && (
              <div style={{ borderTop: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: "12px", background: "#f8fafc" }}>
                <button
                  type="button"
                  onClick={() => setSelectedWorksheet(null)}
                  style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Close
                </button>
                
                {selectedWorksheet.status === "submitted" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={actionLoading}
                      style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                    >
                      Reject Worksheet
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedWorksheet.jobId._id || selectedWorksheet.jobId)}
                      disabled={actionLoading}
                      style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                    >
                      {actionLoading ? "Approving..." : "Approve Worksheet"}
                    </button>
                  </>
                )}

                {selectedWorksheet.status === "approved" && selectedWorksheet.pdfUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(selectedWorksheet.pdfUrl, "_blank")}
                    style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    Download PDF Report
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Lightbox pop-up image viewer */}
      {activePhoto && (
        <div 
          onClick={() => setActivePhoto(null)} 
          style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
            <span style={{ position: "absolute", top: "-30px", right: 0, color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Close Viewer (✕)</span>
            <img src={activePhoto} alt="Zoomed View" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "8px", objectFit: "contain", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.55)" }} />
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ title, value, color, highlight }) {
  return (
    <div style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "16px",
      border: highlight ? `1.5px solid ${color}` : "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>
      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{title}</span>
      <span style={{ fontSize: "28px", fontWeight: 800, color: color, marginTop: "8px", lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function StatusChip({ status }) {
  const styles = {
    submitted: { bg: "#fef3c7", text: "#d97706" }, // Amber
    approved: { bg: "#d1fae5", text: "#059669" }, // Emerald
    draft: { bg: "#f1f5f9", text: "#475569" }, // Gray
    in_progress: { bg: "#eff6ff", text: "#2563eb" }, // Blue
  };
  const current = styles[status] || styles.draft;
  return (
    <span style={{
      padding: "4px 10px",
      borderRadius: "9999px",
      fontSize: "11px",
      fontWeight: 700,
      background: current.bg,
      color: current.text,
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }}>
      {status === "in_progress" ? "In Progress" : status}
    </span>
  );
}

function PhotoCategoryBox({ title, urls, onView }) {
  const photo = urls && urls.length > 0 ? urls[0] : null;
  return (
    <div style={{ border: "1px solid #e2e8f0", padding: "10px", borderRadius: "12px", background: "#f8fafc", textAlign: "center" }}>
      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>{title}</span>
      {photo ? (
        <div 
          onClick={() => onView(photo)}
          style={{ height: "100px", borderRadius: "8px", overflow: "hidden", cursor: "pointer", background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <img src={photo} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ height: "100px", border: "1px dashed #cbd5e1", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "11px" }}>
          No photo
        </div>
      )}
    </div>
  );
}
