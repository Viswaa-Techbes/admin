"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, StatusBadge, useToast, Modal } from "./UI";
import { PlusIcon, EditIcon, TrashIcon, BuildingIcon, UsersIcon } from "./Icons";
import { apiFetch } from "../lib/apiClient";

export function ApartmentManagementPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("apartments"); // 'apartments' | 'tickets'
  const [apartments, setApartments] = useState([]);
  const [loadingApartments, setLoadingApartments] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [savingApartment, setSavingApartment] = useState(false);

  // Apartment Create/Edit Form
  const [apartmentForm, setApartmentForm] = useState({
    name: "",
    address: { street: "", city: "", state: "", pincode: "" },
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    totalFlats: "",
    notes: "",
  });

  // Association User Form
  const [showAssocUserModal, setShowAssocUserModal] = useState(false);
  const [assocUserForm, setAssocUserForm] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    password: "",
  });
  const [savingAssocUser, setSavingAssocUser] = useState(false);

  // Resident Form
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [residentForm, setResidentForm] = useState({
    flatNumber: "",
    name: "",
    phone: "",
    email: "",
  });
  const [savingResident, setSavingResident] = useState(false);

  // Tickets State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketApartmentFilter, setTicketApartmentFilter] = useState("All");
  const [ticketRaisedByFilter, setTicketRaisedByFilter] = useState("All");
  const [ticketFlatFilter, setTicketFlatFilter] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Load Apartments
  const fetchApartments = async () => {
    try {
      setLoadingApartments(true);
      const { payload } = await apiFetch("/api/v2/apartments");
      setApartments(payload.data || payload || []);
    } catch (err) {
      toast({ title: "Failed to load apartments", description: err.message, type: "error" });
    } finally {
      setLoadingApartments(false);
    }
  };

  // Load Tickets
  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      let query = [];
      if (ticketApartmentFilter !== "All") query.push(`apartmentId=${ticketApartmentFilter}`);
      if (ticketRaisedByFilter !== "All") query.push(`raisedByType=${ticketRaisedByFilter}`);
      if (ticketFlatFilter.trim()) query.push(`flatNumber=${encodeURIComponent(ticketFlatFilter.trim())}`);
      if (ticketStatusFilter !== "All") query.push(`status=${ticketStatusFilter}`);
      
      const queryString = query.length > 0 ? `?${query.join("&")}` : "";
      const { payload } = await apiFetch(`/api/v2/apartments/tickets${queryString}`);
      setTickets(payload.data || payload || []);
    } catch (err) {
      toast({ title: "Failed to load tickets", description: err.message, type: "error" });
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab, ticketApartmentFilter, ticketRaisedByFilter, ticketFlatFilter, ticketStatusFilter]);

  // Handle Save Apartment
  const handleSaveApartment = async (e) => {
    e.preventDefault();
    if (!apartmentForm.name.trim()) {
      toast({ title: "Validation Error", description: "Apartment name is required", type: "error" });
      return;
    }
    try {
      setSavingApartment(true);
      if (selectedApartment && selectedApartment._id) {
        await apiFetch(`/api/v2/apartments/${selectedApartment._id}`, {
          method: "PUT",
          body: JSON.stringify(apartmentForm),
        });
        toast({ title: "Success", description: "Apartment updated successfully", type: "success" });
      } else {
        await apiFetch("/api/v2/apartments", {
          method: "POST",
          body: JSON.stringify(apartmentForm),
        });
        toast({ title: "Success", description: "Apartment created successfully", type: "success" });
      }
      setShowApartmentModal(false);
      setSelectedApartment(null);
      fetchApartments();
    } catch (err) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setSavingApartment(false);
    }
  };

  // Open Edit Apartment
  const handleEditApartment = (apt) => {
    setSelectedApartment(apt);
    setApartmentForm({
      name: apt.name || "",
      address: {
        street: apt.address?.street || "",
        city: apt.address?.city || "",
        state: apt.address?.state || "",
        pincode: apt.address?.pincode || "",
      },
      contactPerson: apt.contactPerson || "",
      contactPhone: apt.contactPhone || "",
      contactEmail: apt.contactEmail || "",
      totalFlats: apt.totalFlats || "",
      notes: apt.notes || "",
    });
    setShowApartmentModal(true);
  };

  // Delete Apartment
  const handleDeleteApartment = async (id, name) => {
    if (!confirm(`Are you sure you want to delete apartment "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/v2/apartments/${id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Apartment deleted successfully", type: "success" });
      fetchApartments();
      if (selectedApartment?._id === id) setSelectedApartment(null);
    } catch (err) {
      toast({ title: "Delete Error", description: err.message, type: "error" });
    }
  };

  // Add Association User
  const handleAddAssocUser = async (e) => {
    e.preventDefault();
    if (!selectedApartment) return;
    try {
      setSavingAssocUser(true);
      await apiFetch(`/api/v2/apartments/${selectedApartment._id}/association-users`, {
        method: "POST",
        body: JSON.stringify(assocUserForm),
      });
      toast({ title: "User Added", description: "Association user registered successfully", type: "success" });
      setShowAssocUserModal(false);
      setAssocUserForm({ name: "", mobileNumber: "", email: "", password: "" });
      // Refresh selected apartment details
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      toast({ title: "Failed to Add User", description: err.message, type: "error" });
    } finally {
      setSavingAssocUser(false);
    }
  };

  // Remove Association User
  const handleRemoveAssocUser = async (userId, name) => {
    if (!confirm(`Remove association access for user "${name}"?`)) return;
    try {
      await apiFetch(`/api/v2/apartments/${selectedApartment._id}/association-users/${userId}`, {
        method: "DELETE",
      });
      toast({ title: "User Removed", description: "Association user removed successfully", type: "success" });
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      toast({ title: "Error", description: err.message, type: "error" });
    }
  };

  // Add Resident
  const handleAddResident = async (e) => {
    e.preventDefault();
    if (!selectedApartment) return;
    try {
      setSavingResident(true);
      await apiFetch(`/api/v2/apartments/${selectedApartment._id}/residents`, {
        method: "POST",
        body: JSON.stringify(residentForm),
      });
      toast({ title: "Resident Added", description: `Flat ${residentForm.flatNumber} resident added`, type: "success" });
      setShowResidentModal(false);
      setResidentForm({ flatNumber: "", name: "", phone: "", email: "" });
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      toast({ title: "Failed to Add Resident", description: err.message, type: "error" });
    } finally {
      setSavingResident(false);
    }
  };

  // Remove Resident
  const handleRemoveResident = async (residentId, flatNumber) => {
    if (!confirm(`Remove resident record for Flat ${flatNumber}?`)) return;
    try {
      await apiFetch(`/api/v2/apartments/${selectedApartment._id}/residents/${residentId}`, {
        method: "DELETE",
      });
      toast({ title: "Resident Removed", description: "Resident removed successfully", type: "success" });
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      toast({ title: "Error", description: err.message, type: "error" });
    }
  };

  // Reply to Ticket
  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const body = { text: replyText.trim() };
      if (replyStatus) body.status = replyStatus;

      const { payload } = await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}/reply`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      toast({ title: "Success", description: "Reply posted to ticket", type: "success" });
      setSelectedTicket(payload.data || payload);
      setReplyText("");
      fetchTickets();
    } catch (err) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <BuildingIcon /> Apartment & Society Management
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Manage apartment complexes, 3 association committee accounts, resident flats, and dedicated ticketing.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              setSelectedApartment(null);
              setApartmentForm({
                name: "",
                address: { street: "", city: "", state: "", pincode: "" },
                contactPerson: "",
                contactPhone: "",
                contactEmail: "",
                totalFlats: "",
                notes: "",
              });
              setShowApartmentModal(true);
            }}
            style={{
              padding: "10px 18px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
            }}
          >
            <PlusIcon /> Add Apartment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("apartments")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "apartments" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "apartments" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "apartments" ? 700 : 500,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Apartment Masters ({apartments.length})
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "tickets" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "tickets" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "tickets" ? 700 : 500,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Society Tickets ({tickets.length})
        </button>
      </div>

      {/* ─── TAB 1: APARTMENTS & RESIDENTS MASTER ─── */}
      {activeTab === "apartments" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedApartment ? "1fr 1.3fr" : "1fr", gap: 24 }}>
          {/* List of Apartments */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#1e293b" }}>
              Registered Apartment Complexes
            </h2>

            {loadingApartments ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading apartments...</div>
            ) : apartments.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                No apartment complexes added yet. Click &quot;Add Apartment&quot; above to create one.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {apartments.map((apt) => {
                  const isSelected = selectedApartment?._id === apt._id;
                  const assocCount = (apt.associationUsers || []).length;
                  const residentCount = (apt.residents || []).length;

                  return (
                    <div
                      key={apt._id}
                      onClick={() => setSelectedApartment(apt)}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        background: isSelected ? "#f8faff" : "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{apt.name}</div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                            {apt.address?.city ? `${apt.address.street || ""}, ${apt.address.city}` : "No address specified"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditApartment(apt);
                            }}
                            title="Edit Apartment"
                            style={{
                              padding: 6,
                              background: "#f1f5f9",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              color: "#475569",
                            }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteApartment(apt._id, apt.name);
                            }}
                            title="Delete Apartment"
                            style={{
                              padding: 6,
                              background: "#fee2e2",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              color: "#dc2626",
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: assocCount === 3 ? "#ecfdf5" : "#eff6ff",
                            color: assocCount === 3 ? "#065f46" : "#1e40af",
                            border: `1px solid ${assocCount === 3 ? "#a7f3d0" : "#bfdbfe"}`,
                          }}
                        >
                          👥 Association: {assocCount} / 3 Users
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          🏠 Residents: {residentCount} Flats
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Apartment Detail: Association Users & Residents */}
          {selectedApartment && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
              <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#2563eb" }}>
                      Complex Dashboard
                    </span>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
                      {selectedApartment.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedApartment(null)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18 }}
                  >
                    ✕
                  </button>
                </div>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                  Contact: {selectedApartment.contactPerson || "N/A"} &bull; {selectedApartment.contactPhone || "N/A"}
                </p>
              </div>

              {/* 1. ASSOCIATION USERS (EXACTLY UP TO 3 USERS) */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                      Association Committee Users (Max 3)
                    </h3>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                      Each apartment association supports exactly 3 login users.
                    </p>
                  </div>
                  {(selectedApartment.associationUsers || []).length < 3 && (
                    <button
                      onClick={() => setShowAssocUserModal(true)}
                      style={{
                        padding: "6px 12px",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add Association User
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(selectedApartment.associationUsers || []).length === 0 ? (
                    <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
                      No association accounts registered yet. Exactly 3 users can be added.
                    </div>
                  ) : (
                    selectedApartment.associationUsers.map((u, idx) => (
                      <div
                        key={u._id || idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "#f8fafc",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                            {u.name || `Association User ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            Phone: {u.mobileNumber || "N/A"} {u.email ? `• ${u.email}` : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAssocUser(u._id, u.name)}
                          style={{
                            padding: "4px 8px",
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: 6,
                            color: "#dc2626",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. RESIDENTS MANAGEMENT */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                      Flat Residents Registry
                    </h3>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                      Residents can raise and view tickets strictly for their assigned flat.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResidentModal(true)}
                    style={{
                      padding: "6px 12px",
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add Flat Resident
                  </button>
                </div>

                <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {(selectedApartment.residents || []).length === 0 ? (
                    <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
                      No residents registered for this complex.
                    </div>
                  ) : (
                    selectedApartment.residents.map((r) => (
                      <div
                        key={r._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "#fff",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, background: "#ecfdf5", color: "#065f46", padding: "2px 6px", borderRadius: 4 }}>
                              Flat {r.flatNumber}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{r.name}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {r.phone} {r.email ? `• ${r.email}` : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveResident(r._id, r.flatNumber)}
                          style={{
                            padding: "4px 8px",
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: 6,
                            color: "#dc2626",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: APARTMENT TICKETS & LABELING (PARTS 18, 19, 21, 22) ─── */}
      {activeTab === "tickets" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedTicket ? "1.2fr 1fr" : "1fr", gap: 24 }}>
          {/* Tickets List & Filters */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            {/* Filter Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Filter by Apartment
                </label>
                <select
                  value={ticketApartmentFilter}
                  onChange={(e) => setTicketApartmentFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="All">All Apartments</option>
                  {apartments.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: 150 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Raised By
                </label>
                <select
                  value={ticketRaisedByFilter}
                  onChange={(e) => setTicketRaisedByFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="All">All Sources</option>
                  <option value="association">Association Committee</option>
                  <option value="resident">Flat Resident</option>
                  <option value="customer">Regular Customer</option>
                </select>
              </div>

              <div style={{ minWidth: 120 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Flat Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={ticketFlatFilter}
                  onChange={(e) => setTicketFlatFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div style={{ minWidth: 130 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Status
                </label>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Tickets Table / List */}
            {loadingTickets ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading society tickets...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                No tickets matching current filters.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tickets.map((t) => {
                  const isAssoc = t.raisedByType === "association";
                  const isResident = t.raisedByType === "resident";

                  return (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTicket(t)}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        border: selectedTicket?._id === t._id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        background: selectedTicket?._id === t._id ? "#f8faff" : "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          {/* PART 22: ADMIN TICKET CLEAR LABELING */}
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, background: "#f1f5f9", color: "#334155", padding: "2px 6px", borderRadius: 4 }}>
                              {t.ticketId || `#${t._id.slice(-6).toUpperCase()}`}
                            </span>

                            {t.apartmentName && (
                              <span style={{ fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 4, border: "1px solid #bfdbfe" }}>
                                Apartment: {t.apartmentName}
                              </span>
                            )}

                            {isAssoc && (
                              <span style={{ fontSize: 11, fontWeight: 700, background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 4, border: "1px solid #93c5fd" }}>
                                Raised By: Association
                              </span>
                            )}

                            {isResident && (
                              <span style={{ fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 4, border: "1px solid #6ee7b7" }}>
                                Raised By: Resident &bull; Flat: {t.flatNumber || "N/A"}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{t.subject}</div>
                          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                            {t.description || t.messages?.[0]?.text || "No description provided"}
                          </div>
                        </div>

                        <div style={{ textAlign: "right", shrink: 0 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: t.status === "Resolved" || t.status === "Closed" ? "#ecfdf5" : "#fffbeb",
                              color: t.status === "Resolved" || t.status === "Closed" ? "#065f46" : "#b45309",
                              border: `1px solid ${t.status === "Resolved" || t.status === "Closed" ? "#a7f3d0" : "#fde68a"}`,
                            }}
                          >
                            {t.status}
                          </span>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                        Reported by: <strong>{t.raisedByName || "User"}</strong> ({t.raisedByPhone || "No Phone"}) &bull; Category: {t.category}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ticket Detail & Reply Panel */}
          {selectedTicket && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, display: "flex", flexDirection: "column", height: "fit-content" }}>
              <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
                      Ticket Details
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: "2px 0 0", color: "#0f172a" }}>
                      {selectedTicket.subject}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#334155", padding: "2px 6px", borderRadius: 4 }}>
                    {selectedTicket.apartmentName || "General Ticket"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, background: selectedTicket.raisedByType === "association" ? "#dbeafe" : "#d1fae5", color: selectedTicket.raisedByType === "association" ? "#1e40af" : "#065f46", padding: "2px 6px", borderRadius: 4 }}>
                    {selectedTicket.raisedByType === "association" ? "Association" : `Resident Flat ${selectedTicket.flatNumber}`}
                  </span>
                </div>
              </div>

              {/* Messages Feed */}
              <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {(selectedTicket.messages || []).map((m, idx) => (
                  <div key={idx} style={{ padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 13, color: "#1e293b", whiteSpace: "pre-wrap" }}>{m.text}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                      {new Date(m.createdAt || selectedTicket.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReplyTicket} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <textarea
                  rows={3}
                  required
                  placeholder="Type official response or update to association / resident..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  >
                    <option value="">Keep Status ({selectedTicket.status})</option>
                    <option value="Open">Set Open</option>
                    <option value="In Progress">Set In Progress</option>
                    <option value="Resolved">Set Resolved</option>
                    <option value="Closed">Set Closed</option>
                  </select>

                  <button
                    type="submit"
                    disabled={sendingReply}
                    style={{
                      padding: "8px 16px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {sendingReply ? "Sending..." : "Post Reply"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT APARTMENT ─── */}
      {showApartmentModal && (
        <Modal
          title={selectedApartment ? "Edit Apartment Complex" : "Add New Apartment Complex"}
          isOpen={showApartmentModal}
          onClose={() => setShowApartmentModal(false)}
        >
          <form onSubmit={handleSaveApartment} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Apartment / Society Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ABCD Apartment"
                value={apartmentForm.name}
                onChange={(e) => setApartmentForm({ ...apartmentForm, name: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kumar (President)"
                  value={apartmentForm.contactPerson}
                  onChange={(e) => setApartmentForm({ ...apartmentForm, contactPerson: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={apartmentForm.contactPhone}
                  onChange={(e) => setApartmentForm({ ...apartmentForm, contactPhone: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. 42, Lakeview Road"
                value={apartmentForm.address.street}
                onChange={(e) => setApartmentForm({ ...apartmentForm, address: { ...apartmentForm.address, street: e.target.value } })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>City</label>
                <input
                  type="text"
                  value={apartmentForm.address.city}
                  onChange={(e) => setApartmentForm({ ...apartmentForm, address: { ...apartmentForm.address, city: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>State</label>
                <input
                  type="text"
                  value={apartmentForm.address.state}
                  onChange={(e) => setApartmentForm({ ...apartmentForm, address: { ...apartmentForm.address, state: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>Pincode</label>
                <input
                  type="text"
                  value={apartmentForm.address.pincode}
                  onChange={(e) => setApartmentForm({ ...apartmentForm, address: { ...apartmentForm.address, pincode: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowApartmentModal(false)}
                style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingApartment}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                {savingApartment ? "Saving..." : "Save Apartment"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: ADD ASSOCIATION USER (PART 17) ─── */}
      {showAssocUserModal && (
        <Modal
          title={`Add Association Member (${selectedApartment?.name})`}
          isOpen={showAssocUserModal}
          onClose={() => setShowAssocUserModal(false)}
        >
          <form onSubmit={handleAddAssocUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>
              Association user accounts can create and view common tickets across all committee members for this apartment.
            </p>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Member Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kumar"
                value={assocUserForm.name}
                onChange={(e) => setAssocUserForm({ ...assocUserForm, name: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Mobile Number (Login Username) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210"
                value={assocUserForm.mobileNumber}
                onChange={(e) => setAssocUserForm({ ...assocUserForm, mobileNumber: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. kumar@apartment.com"
                value={assocUserForm.email}
                onChange={(e) => setAssocUserForm({ ...assocUserForm, email: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Initial Password * (Min 6 chars)
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={assocUserForm.password}
                onChange={(e) => setAssocUserForm({ ...assocUserForm, password: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowAssocUserModal(false)}
                style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAssocUser}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                {savingAssocUser ? "Creating..." : "Create Association User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: ADD RESIDENT (PART 20) ─── */}
      {showResidentModal && (
        <Modal
          title={`Register Flat Resident (${selectedApartment?.name})`}
          isOpen={showResidentModal}
          onClose={() => setShowResidentModal(false)}
        >
          <form onSubmit={handleAddResident} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Flat Number / Flat Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 101 or A-304"
                value={residentForm.flatNumber}
                onChange={(e) => setResidentForm({ ...residentForm, flatNumber: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Resident Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ravi"
                value={residentForm.name}
                onChange={(e) => setResidentForm({ ...residentForm, name: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210"
                value={residentForm.phone}
                onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Email (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. ravi@example.com"
                value={residentForm.email}
                onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowResidentModal(false)}
                style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingResident}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#10b981", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                {savingResident ? "Adding..." : "Add Resident"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
