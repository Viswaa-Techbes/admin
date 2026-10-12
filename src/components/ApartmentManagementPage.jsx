"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, StatusBadge, useToast, Modal } from "./UI";
import { PlusIcon, EditIcon, TrashIcon, BuildingIcon, UsersIcon, SearchIcon, EyeIcon } from "./Icons";
import { apiFetch } from "../lib/apiClient";

export function ApartmentManagementPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("apartments"); // 'apartments' | 'tickets'
  const [apartments, setApartments] = useState([]);
  const [loadingApartments, setLoadingApartments] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [apartmentDetailTab, setApartmentDetailTab] = useState("residents"); // 'residents' | 'committee' | 'tickets' | 'settings'

  // Technicians / Staff for assignment
  const [staffList, setStaffList] = useState([]);

  // Modals state
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [savingApartment, setSavingApartment] = useState(false);
  const [showAssocUserModal, setShowAssocUserModal] = useState(false);
  const [savingAssocUser, setSavingAssocUser] = useState(false);
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [savingResident, setSavingResident] = useState(false);
  const [invitationModalData, setInvitationModalData] = useState(null);

  // Search & Filters inside Apartment
  const [apartmentSearch, setApartmentSearch] = useState("");
  const [residentSearch, setResidentSearch] = useState("");
  const [residentStatusFilter, setResidentStatusFilter] = useState("All");
  const [residentTypeFilter, setResidentTypeFilter] = useState("All");

  // Apartment Create/Edit Form
  const [apartmentForm, setApartmentForm] = useState({
    name: "",
    address: { street: "", city: "Bangalore", state: "Karnataka", pincode: "" },
    locality: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    totalFlats: "",
    blocks: [],
    notes: "",
  });

  // Association Committee User Form (Max 3)
  const [assocUserForm, setAssocUserForm] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    password: "",
  });

  // Resident Form
  const [residentForm, setResidentForm] = useState({
    flatNumber: "",
    block: "",
    floor: "",
    name: "",
    phone: "",
    email: "",
    residentType: "owner",
    status: "active",
    moveInDate: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    passwordOption: "invite", // 'invite' | 'password'
    password: "",
  });

  // Tickets State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketApartmentFilter, setTicketApartmentFilter] = useState("All");
  const [ticketRaisedByFilter, setTicketRaisedByFilter] = useState("All");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("All");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("All");
  const [ticketFlatFilter, setTicketFlatFilter] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");
  const [ticketStaffFilter, setTicketStaffFilter] = useState("All");
  const [ticketDateFilter, setTicketDateFilter] = useState("");

  // Detailed Ticket Inspector State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketInspectorTab, setTicketInspectorTab] = useState("discussion"); // 'discussion' | 'internal_notes' | 'history'
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [internalNoteText, setInternalNoteText] = useState("");
  const [savingInternalNote, setSavingInternalNote] = useState(false);
  const [assigningStaffId, setAssigningStaffId] = useState("");
  const [assigningNotes, setAssigningNotes] = useState("");
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvingTicket, setResolvingTicket] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState("");
  const [reopeningTicket, setReopeningTicket] = useState(false);

  const [apartmentsError, setApartmentsError] = useState("");
  const [ticketsError, setTicketsError] = useState("");

  // Load Apartments
  const fetchApartments = async () => {
    try {
      setLoadingApartments(true);
      setApartmentsError("");
      const { payload } = await apiFetch("/api/v2/apartments");
      const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setApartments(list);

      // Keep selected apartment synchronized if open
      if (selectedApartment) {
        const updated = list.find((a) => a._id === selectedApartment._id);
        if (updated) setSelectedApartment(updated);
      }
    } catch (err) {
      console.warn("Failed to load apartments:", err.message);
      setApartmentsError(err.message || "Failed to load apartments");
      toast({ title: "Failed to load apartments", description: err.message, type: "error" });
    } finally {
      setLoadingApartments(false);
    }
  };

  // Load Staff list for ticket maintenance assignment
  const fetchStaff = async () => {
    try {
      const { payload } = await apiFetch("/api/v2/admin/users");
      const users = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const techs = users.filter((u) => u.role === "technician" || u.role === "manager" || u.role === "admin");
      setStaffList(techs);
    } catch (err) {
      console.warn("Could not load staff list:", err.message);
    }
  };

  // Load Tickets
  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      setTicketsError("");
      let query = [];
      if (ticketApartmentFilter !== "All") query.push(`apartmentId=${ticketApartmentFilter}`);
      if (ticketRaisedByFilter !== "All") query.push(`raisedByType=${ticketRaisedByFilter}`);
      if (ticketCategoryFilter !== "All") query.push(`category=${encodeURIComponent(ticketCategoryFilter)}`);
      if (ticketPriorityFilter !== "All") query.push(`priority=${encodeURIComponent(ticketPriorityFilter)}`);
      if (ticketFlatFilter.trim()) query.push(`flatNumber=${encodeURIComponent(ticketFlatFilter.trim())}`);
      if (ticketStatusFilter !== "All") query.push(`status=${encodeURIComponent(ticketStatusFilter)}`);
      if (ticketStaffFilter !== "All") query.push(`staffId=${encodeURIComponent(ticketStaffFilter)}`);
      if (ticketDateFilter) query.push(`date=${ticketDateFilter}`);

      const queryString = query.length > 0 ? `?${query.join("&")}` : "";
      const { payload } = await apiFetch(`/api/v2/apartments/tickets${queryString}`);
      const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setTickets(list);

      if (selectedTicket) {
        const refreshed = list.find((t) => t._id === selectedTicket._id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch (err) {
      console.warn("Failed to load tickets:", err.message);
      setTicketsError(err.message || "Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchApartments();
    fetchStaff();
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [
    activeTab,
    ticketApartmentFilter,
    ticketRaisedByFilter,
    ticketCategoryFilter,
    ticketPriorityFilter,
    ticketFlatFilter,
    ticketStatusFilter,
    ticketStaffFilter,
    ticketDateFilter,
  ]);

  // Format address helper
  const formatAddress = (apt) => {
    if (!apt) return "No address specified";
    if (typeof apt.address === "string" && apt.address.trim()) return apt.address;
    if (apt.address && typeof apt.address === "object") {
      const parts = [apt.address.street, apt.address.city, apt.address.state, apt.address.pincode].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    const fallback = [apt.locality, apt.city, apt.state || "Karnataka", apt.pincode].filter(Boolean).join(", ");
    return fallback || "No address specified";
  };

  // Open Edit Apartment
  const handleEditApartment = (apt) => {
    setSelectedApartment(apt);
    const street = typeof apt.address === "string" ? apt.address : apt.address?.street || "";
    const city = apt.city || (typeof apt.address === "object" ? apt.address?.city : "") || "Bangalore";
    const state = apt.state || (typeof apt.address === "object" ? apt.address?.state : "") || "Karnataka";
    const pincode = apt.pincode || (typeof apt.address === "object" ? apt.address?.pincode : "") || "";
    setApartmentForm({
      name: apt.name || "",
      address: {
        street,
        city,
        state,
        pincode,
      },
      locality: apt.locality || "",
      contactPerson: apt.contactPerson || "",
      contactPhone: apt.contactPhone || apt.contactMobile || "",
      contactEmail: apt.contactEmail || "",
      totalFlats: apt.totalFlats || "",
      blocks: Array.isArray(apt.blocks) ? apt.blocks : [],
      notes: apt.notes || "",
    });
    setShowApartmentModal(true);
  };

  // Handle Save Apartment
  const handleSaveApartment = async (e) => {
    e.preventDefault();
    if (!apartmentForm.name.trim()) {
      alert("Apartment name is required");
      return;
    }
    try {
      setSavingApartment(true);
      const formattedAddress = [
        apartmentForm.address?.street,
        apartmentForm.address?.city,
        apartmentForm.address?.state || "Karnataka",
        apartmentForm.address?.pincode,
      ]
        .filter(Boolean)
        .join(", ");

      const submitBody = {
        name: apartmentForm.name.trim(),
        address: formattedAddress || apartmentForm.name.trim(),
        locality: apartmentForm.locality || apartmentForm.address?.street || "",
        city: apartmentForm.address?.city || "Bangalore",
        state: apartmentForm.address?.state || "Karnataka",
        pincode: apartmentForm.address?.pincode || "",
        contactPerson: apartmentForm.contactPerson || "",
        contactPhone: apartmentForm.contactPhone || "",
        contactMobile: apartmentForm.contactPhone || "",
        contactEmail: apartmentForm.contactEmail || "",
        totalFlats: parseInt(apartmentForm.totalFlats, 10) || 0,
        blocks: apartmentForm.blocks || [],
        notes: apartmentForm.notes || "",
      };

      if (selectedApartment && selectedApartment._id && showApartmentModal && apartmentForm.name) {
        await apiFetch(`/api/v2/apartments/${selectedApartment._id}`, {
          method: "PUT",
          body: JSON.stringify(submitBody),
        });
        toast({ title: "Success", description: "Apartment updated successfully", type: "success" });
      } else {
        await apiFetch("/api/v2/apartments", {
          method: "POST",
          body: JSON.stringify(submitBody),
        });
        toast({ title: "Success", description: "Apartment created successfully", type: "success" });
      }
      setShowApartmentModal(false);
      fetchApartments();
    } catch (err) {
      alert(err.message || "Failed to save apartment");
    } finally {
      setSavingApartment(false);
    }
  };

  // Delete Apartment
  const handleDeleteApartment = async (id, name) => {
    if (!confirm(`Are you sure you want to delete apartment "${name}"? This will safely remove associated accounts.`)) return;
    try {
      await apiFetch(`/api/v2/apartments/${id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Apartment removed successfully", type: "success" });
      if (selectedApartment?._id === id) setSelectedApartment(null);
      fetchApartments();
    } catch (err) {
      alert(err.message || "Failed to delete apartment");
    }
  };

  // Add Association Committee User (Max 3)
  const handleAddAssocUser = async (e) => {
    e.preventDefault();
    if (!selectedApartment) return;
    try {
      setSavingAssocUser(true);
      await apiFetch(`/api/v2/apartments/${selectedApartment._id}/association-users`, {
        method: "POST",
        body: JSON.stringify(assocUserForm),
      });
      toast({ title: "Account Created", description: "Association committee account registered successfully", type: "success" });
      setShowAssocUserModal(false);
      setAssocUserForm({ name: "", mobileNumber: "", email: "", password: "" });

      // Refresh apartment
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      alert(err.message || "Failed to add association user");
    } finally {
      setSavingAssocUser(false);
    }
  };

  // Remove Association User
  const handleRemoveAssocUser = async (userId, name) => {
    if (!confirm(`Remove association committee access for user "${name}"?`)) return;
    try {
      await apiFetch(`/api/v2/apartments/${selectedApartment._id}/association-users/${userId}`, {
        method: "DELETE",
      });
      toast({ title: "Account Removed", description: "Association account removed successfully", type: "success" });
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      alert(err.message || "Failed to remove user");
    }
  };

  // Open Add/Edit Resident Modal
  const handleOpenResidentModal = (resToEdit = null) => {
    setEditingResident(resToEdit);
    if (resToEdit) {
      setResidentForm({
        flatNumber: resToEdit.flatNumber || "",
        block: resToEdit.block || "",
        floor: resToEdit.floor || "",
        name: resToEdit.name || "",
        phone: resToEdit.phone || "",
        email: resToEdit.email || "",
        residentType: resToEdit.residentType || "owner",
        status: resToEdit.status || "active",
        moveInDate: resToEdit.moveInDate ? new Date(resToEdit.moveInDate).toISOString().split("T")[0] : "",
        emergencyName: resToEdit.emergencyContact?.name || "",
        emergencyPhone: resToEdit.emergencyContact?.phone || "",
        emergencyRelation: resToEdit.emergencyContact?.relation || "",
        passwordOption: "invite",
        password: "",
      });
    } else {
      setResidentForm({
        flatNumber: "",
        block: "",
        floor: "",
        name: "",
        phone: "",
        email: "",
        residentType: "owner",
        status: "active",
        moveInDate: new Date().toISOString().split("T")[0],
        emergencyName: "",
        emergencyPhone: "",
        emergencyRelation: "",
        passwordOption: "invite",
        password: "",
      });
    }
    setShowResidentModal(true);
  };

  // Save Resident (Add or Edit)
  const handleSaveResident = async (e) => {
    e.preventDefault();
    if (!selectedApartment) return;
    try {
      setSavingResident(true);
      const submitBody = {
        flatNumber: residentForm.flatNumber.trim(),
        block: residentForm.block.trim(),
        floor: residentForm.floor.trim(),
        name: residentForm.name.trim(),
        phone: residentForm.phone.trim(),
        email: residentForm.email.trim(),
        residentType: residentForm.residentType,
        status: residentForm.status,
        moveInDate: residentForm.moveInDate || undefined,
        emergencyContact: {
          name: residentForm.emergencyName.trim(),
          phone: residentForm.emergencyPhone.trim(),
          relation: residentForm.emergencyRelation.trim(),
        },
        password: residentForm.passwordOption === "password" ? residentForm.password : undefined,
      };

      if (editingResident) {
        await apiFetch(`/api/v2/apartments/${selectedApartment._id}/residents/${editingResident._id}`, {
          method: "PUT",
          body: JSON.stringify(submitBody),
        });
        toast({ title: "Resident Updated", description: "Resident record updated successfully", type: "success" });
      } else {
        const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}/residents`, {
          method: "POST",
          body: JSON.stringify(submitBody),
        });
        toast({ title: "Resident Added", description: `Flat ${residentForm.flatNumber} added to registry`, type: "success" });

        // If activation code was generated, show invitation details
        if (payload.data?.activationCode) {
          setInvitationModalData({
            name: payload.data.name,
            flatNumber: payload.data.flatNumber,
            phone: payload.data.phone,
            code: payload.data.activationCode,
            url: `https://techbes.co.in/resident/activate?phone=${encodeURIComponent(payload.data.phone)}&code=${payload.data.activationCode}`,
          });
        }
      }

      setShowResidentModal(false);
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      alert(err.message || "Failed to save resident");
    } finally {
      setSavingResident(false);
    }
  };

  // Generate / Resend Resident Activation Code
  const handleInviteResident = async (resObj) => {
    try {
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}/residents/${resObj._id}/invite`, {
        method: "POST",
      });
      const data = payload.data || payload;
      setInvitationModalData({
        name: data.residentName || resObj.name,
        flatNumber: resObj.flatNumber,
        phone: data.phone || resObj.phone,
        code: data.activationCode,
        url: data.activationUrl,
      });
      const { payload: aptPayload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(aptPayload.data || aptPayload);
    } catch (err) {
      alert(err.message || "Failed to generate invitation");
    }
  };

  // Toggle Occupancy (Mark as Vacated)
  const handleToggleOccupancy = async (resident) => {
    const newStatus = resident.status === "active" ? "vacated" : "active";
    const confirmMsg =
      newStatus === "vacated"
        ? `Mark Flat ${resident.flatNumber} resident "${resident.name}" as Vacated? Historical complaint records will be preserved.`
        : `Reactivate Flat ${resident.flatNumber} resident "${resident.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      await apiFetch(`/api/v2/apartments/${selectedApartment._id}/residents/${resident._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast({ title: "Status Updated", description: `Resident marked as ${newStatus}`, type: "success" });
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  // Remove Resident
  const handleRemoveResident = async (residentId, flatNumber) => {
    if (!confirm(`Permanently remove resident record for Flat ${flatNumber}?`)) return;
    try {
      await apiFetch(`/api/v2/apartments/${selectedApartment._id}/residents/${residentId}`, {
        method: "DELETE",
      });
      toast({ title: "Resident Removed", description: "Resident record removed", type: "success" });
      const { payload } = await apiFetch(`/api/v2/apartments/${selectedApartment._id}`);
      setSelectedApartment(payload.data || payload);
      fetchApartments();
    } catch (err) {
      alert(err.message || "Failed to remove resident");
    }
  };

  // ─── TICKET ACTIONS ─────────────────────────────────────────────────────────

  // Reply to Ticket (Resident visible)
  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const { payload } = await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}/reply`, {
        method: "PUT",
        body: JSON.stringify({ text: replyText.trim() }),
      });
      toast({ title: "Reply Sent", description: "Message posted to resident thread", type: "success" });
      setSelectedTicket(payload.data || payload);
      setReplyText("");
      fetchTickets();
    } catch (err) {
      alert(err.message || "Failed to post reply");
    } finally {
      setSendingReply(false);
    }
  };

  // Add Internal Staff Note (invisible to resident)
  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !internalNoteText.trim()) return;
    try {
      setSavingInternalNote(true);
      await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}/internal-notes`, {
        method: "POST",
        body: JSON.stringify({ text: internalNoteText.trim() }),
      });
      toast({ title: "Internal Note Added", description: "Note recorded for staff only", type: "success" });
      setInternalNoteText("");
      // Refresh ticket details
      const { payload } = await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}`);
      setSelectedTicket(payload.data || payload);
    } catch (err) {
      alert(err.message || "Failed to add internal note");
    } finally {
      setSavingInternalNote(false);
    }
  };

  // Update Status Workflow
  const handleUpdateTicketStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast({ title: "Status Updated", description: `Complaint marked as ${newStatus}`, type: "success" });
      const { payload } = await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}`);
      setSelectedTicket(payload.data || payload);
      fetchTickets();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  // Assign Maintenance Staff
  const handleAssignStaff = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !assigningStaffId) return;
    try {
      setAssigningStaff(true);
      await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}/assign`, {
        method: "PUT",
        body: JSON.stringify({ staffId: assigningStaffId, notes: assigningNotes.trim() }),
      });
      toast({ title: "Staff Assigned", description: "Technician assigned and notified", type: "success" });
      setAssigningNotes("");
      const { payload } = await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}`);
      setSelectedTicket(payload.data || payload);
      fetchTickets();
    } catch (err) {
      alert(err.message || "Failed to assign staff");
    } finally {
      setAssigningStaff(false);
    }
  };

  // Mark Ticket Resolved
  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      setResolvingTicket(true);
      await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}/resolve`, {
        method: "PUT",
        body: JSON.stringify({ resolutionNotes: resolutionNotes.trim() }),
      });
      toast({ title: "Ticket Resolved", description: "Resolution notes recorded and resident notified", type: "success" });
      setResolutionNotes("");
      const { payload } = await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}`);
      setSelectedTicket(payload.data || payload);
      fetchTickets();
    } catch (err) {
      alert(err.message || "Failed to resolve ticket");
    } finally {
      setResolvingTicket(false);
    }
  };

  // Reopen Resolved/Closed Ticket
  const handleReopenTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !reopenReasonText.trim()) return;
    try {
      setReopeningTicket(true);
      await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}/reopen`, {
        method: "PUT",
        body: JSON.stringify({ reason: reopenReasonText.trim() }),
      });
      toast({ title: "Ticket Reopened", description: "Complaint reopened for investigation", type: "success" });
      setShowReopenModal(false);
      setReopenReasonText("");
      const { payload } = await apiFetch(`/api/v2/apartments/tickets/${selectedTicket._id}`);
      setSelectedTicket(payload.data || payload);
      fetchTickets();
    } catch (err) {
      alert(err.message || "Failed to reopen ticket");
    } finally {
      setReopeningTicket(false);
    }
  };

  // Filtered residents list
  const filteredResidents = useMemo(() => {
    if (!selectedApartment || !Array.isArray(selectedApartment.residents)) return [];
    return selectedApartment.residents.filter((r) => {
      if (residentSearch.trim()) {
        const q = residentSearch.toLowerCase();
        const matches =
          String(r.name || "").toLowerCase().includes(q) ||
          String(r.flatNumber || "").toLowerCase().includes(q) ||
          String(r.block || "").toLowerCase().includes(q) ||
          String(r.phone || "").toLowerCase().includes(q) ||
          String(r.residentId || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (residentStatusFilter !== "All" && r.status !== residentStatusFilter) return false;
      if (residentTypeFilter !== "All" && r.residentType !== residentTypeFilter) return false;
      return true;
    });
  }, [selectedApartment, residentSearch, residentStatusFilter, residentTypeFilter]);

  // Filtered apartments list
  const filteredApartments = useMemo(() => {
    return apartments.filter((a) => {
      if (apartmentSearch.trim()) {
        const q = apartmentSearch.toLowerCase();
        return (
          String(a.name || "").toLowerCase().includes(q) ||
          String(a.address || "").toLowerCase().includes(q) ||
          String(a.city || "").toLowerCase().includes(q) ||
          String(a.contactPerson || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [apartments, apartmentSearch]);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1600, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <BuildingIcon /> Apartment &amp; Society Management
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Manage apartment complexes, 3 association committee accounts, resident registries, and dedicated society maintenance tickets.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setSelectedApartment(null);
              setApartmentForm({
                name: "",
                address: { street: "", city: "Bangalore", state: "Karnataka", pincode: "" },
                locality: "",
                contactPerson: "",
                contactPhone: "",
                contactEmail: "",
                totalFlats: "",
                blocks: [],
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
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
            }}
          >
            <PlusIcon /> Add Apartment Complex
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1.5px solid #e2e8f0", marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("apartments")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "apartments" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "apartments" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "apartments" ? 800 : 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          🏢 Apartment Masters ({apartments.length})
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "tickets" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "tickets" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "tickets" ? 800 : 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          🎫 Society Maintenance Complaints ({tickets.length})
        </button>
      </div>

      {/* ─── TAB 1: APARTMENTS & COMPLEX DASHBOARD ─── */}
      {activeTab === "apartments" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedApartment ? "1fr 1.6fr" : "1fr", gap: 24 }}>
          {/* Left Column: Registered Apartment Complexes */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#1e293b" }}>
                Registered Apartment Complexes
              </h2>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{filteredApartments.length} Total</span>
            </div>

            {/* Apartment Search Bar */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search apartment by name, city, or locality..."
                value={apartmentSearch}
                onChange={(e) => setApartmentSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
              <span style={{ position: "absolute", left: 10, top: 10, color: "#94a3b8" }}>
                <SearchIcon />
              </span>
            </div>

            {apartmentsError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 16, color: "#b91c1c", fontSize: 12 }}>
                ⚠️ {apartmentsError}
              </div>
            )}

            {loadingApartments ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading apartment complexes...</div>
            ) : filteredApartments.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                No apartment complexes found. Click &quot;Add Apartment Complex&quot; above to create one.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredApartments.map((apt) => {
                  const isSelected = selectedApartment?._id === apt._id;
                  const assocCount = (apt.associationUsers || []).length;
                  const residentCount = (apt.residents || []).length;
                  const openTickets = apt.openTickets || 0;

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
                        boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.08)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{apt.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{formatAddress(apt)}</div>
                          {apt.contactPerson && (
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                              Contact: <strong>{apt.contactPerson}</strong> {apt.contactPhone ? `(${apt.contactPhone})` : ""}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditApartment(apt);
                            }}
                            title="Edit Apartment"
                            style={{ padding: "6px 8px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", color: "#475569" }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteApartment(apt._id, apt.name);
                            }}
                            title="Delete Apartment"
                            style={{ padding: "6px 8px", background: "#fee2e2", border: "none", borderRadius: 6, cursor: "pointer", color: "#dc2626" }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      {/* Stat Pills */}
                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: assocCount === 3 ? "#ecfdf5" : "#eff6ff",
                            color: assocCount === 3 ? "#065f46" : "#1e40af",
                            border: `1px solid ${assocCount === 3 ? "#a7f3d0" : "#bfdbfe"}`,
                          }}
                        >
                          👥 Committee: {assocCount} / 3 Accounts
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          🏠 Residents: {residentCount} Registered
                        </span>
                        {openTickets > 0 ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fde68a",
                            }}
                          >
                            ⚡ {openTickets} Open Complaints
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#f8fafc",
                              color: "#64748b",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            ✓ 0 Open Tickets
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Complex Dashboard */}
          {selectedApartment ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
              {/* Complex Banner */}
              <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#2563eb", background: "#dbeafe", padding: "2px 8px", borderRadius: 4 }}>
                      Complex Dashboard
                    </span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "6px 0 2px" }}>
                      {selectedApartment.name}
                    </h2>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                      📍 {formatAddress(selectedApartment)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedApartment(null)}
                    style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 8px", color: "#64748b", cursor: "pointer", fontWeight: 700 }}
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Sub-Tabs */}
                <div style={{ display: "flex", gap: 6, marginTop: 16, borderBottom: "1px solid #f1f5f9" }}>
                  <button
                    onClick={() => setApartmentDetailTab("residents")}
                    style={{
                      padding: "8px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: apartmentDetailTab === "residents" ? "2.5px solid #2563eb" : "none",
                      color: apartmentDetailTab === "residents" ? "#2563eb" : "#64748b",
                      fontWeight: apartmentDetailTab === "residents" ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    🏠 Residents Registry ({(selectedApartment.residents || []).length})
                  </button>
                  <button
                    onClick={() => setApartmentDetailTab("committee")}
                    style={{
                      padding: "8px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: apartmentDetailTab === "committee" ? "2.5px solid #2563eb" : "none",
                      color: apartmentDetailTab === "committee" ? "#2563eb" : "#64748b",
                      fontWeight: apartmentDetailTab === "committee" ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    👥 Association Committee ({(selectedApartment.associationUsers || []).length} / 3)
                  </button>
                  <button
                    onClick={() => setApartmentDetailTab("tickets")}
                    style={{
                      padding: "8px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: apartmentDetailTab === "tickets" ? "2.5px solid #2563eb" : "none",
                      color: apartmentDetailTab === "tickets" ? "#2563eb" : "#64748b",
                      fontWeight: apartmentDetailTab === "tickets" ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    🎫 Complaints &amp; Tickets
                  </button>
                </div>
              </div>

              {/* 1. RESIDENTS REGISTRY (PHASE 2) */}
              {apartmentDetailTab === "residents" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                        Residents &amp; Flats Registry
                      </h3>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                        Manage owner/tenant classification, occupancy, emergency contacts, and account activation.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenResidentModal(null)}
                      style={{
                        padding: "8px 14px",
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <PlusIcon /> Add Resident Flat
                    </button>
                  </div>

                  {/* Residents Filters */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Search flat #, resident name, or phone..."
                      value={residentSearch}
                      onChange={(e) => setResidentSearch(e.target.value)}
                      style={{ flex: 1, minWidth: 160, padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                    />
                    <select
                      value={residentStatusFilter}
                      onChange={(e) => setResidentStatusFilter(e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="vacated">Vacated</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <select
                      value={residentTypeFilter}
                      onChange={(e) => setResidentTypeFilter(e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                    >
                      <option value="All">All Types</option>
                      <option value="owner">Owner</option>
                      <option value="tenant">Tenant</option>
                    </select>
                  </div>

                  {/* Residents Table */}
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#475569" }}>
                          <th style={{ padding: "8px 10px" }}>Flat / Block</th>
                          <th style={{ padding: "8px 10px" }}>Resident Name</th>
                          <th style={{ padding: "8px 10px" }}>Type</th>
                          <th style={{ padding: "8px 10px" }}>Phone / Email</th>
                          <th style={{ padding: "8px 10px" }}>Occupancy</th>
                          <th style={{ padding: "8px 10px" }}>Account</th>
                          <th style={{ padding: "8px 10px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResidents.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                              No resident records found. Click &quot;Add Resident Flat&quot; above to register one.
                            </td>
                          </tr>
                        ) : (
                          filteredResidents.map((r) => (
                            <tr key={r._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 10px", fontWeight: 700, color: "#1e293b" }}>
                                <div>Flat {r.flatNumber}</div>
                                {r.block && <div style={{ fontSize: 10, color: "#64748b" }}>Block: {r.block} {r.floor ? `(Fl ${r.floor})` : ""}</div>}
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{r.name}</div>
                                {r.residentId && <div style={{ fontSize: 10, color: "#94a3b8" }}>ID: {r.residentId}</div>}
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: r.residentType === "owner" ? "#dbeafe" : "#f3e8ff",
                                    color: r.residentType === "owner" ? "#1e40af" : "#7e22ce",
                                  }}
                                >
                                  {r.residentType}
                                </span>
                              </td>
                              <td style={{ padding: "8px 10px", color: "#475569" }}>
                                <div>{r.phone}</div>
                                {r.email && <div style={{ fontSize: 10, color: "#64748b" }}>{r.email}</div>}
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: r.status === "active" ? "#dcfce7" : "#ffedd5",
                                    color: r.status === "active" ? "#15803d" : "#c2410c",
                                  }}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                {r.accountStatus === "active" ? (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a" }}>✓ Active Login</span>
                                ) : r.accountStatus === "invited" ? (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#d97706" }}>✉️ Code Sent</span>
                                ) : (
                                  <span style={{ fontSize: 10, color: "#94a3b8" }}>Unregistered</span>
                                )}
                              </td>
                              <td style={{ padding: "8px 10px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: 4 }}>
                                  <button
                                    onClick={() => handleInviteResident(r)}
                                    title="View / Resend Activation Code"
                                    style={{ padding: "4px 6px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 4, fontSize: 11, cursor: "pointer", color: "#1d4ed8" }}
                                  >
                                    🔑 Invite
                                  </button>
                                  <button
                                    onClick={() => handleOpenResidentModal(r)}
                                    title="Edit Resident"
                                    style={{ padding: "4px 6px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 11, cursor: "pointer", color: "#334155" }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleToggleOccupancy(r)}
                                    title={r.status === "active" ? "Mark as Vacated" : "Mark as Active"}
                                    style={{ padding: "4px 6px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 4, fontSize: 11, cursor: "pointer", color: "#92400e" }}
                                  >
                                    🔄
                                  </button>
                                  <button
                                    onClick={() => handleRemoveResident(r._id, r.flatNumber)}
                                    title="Remove Resident"
                                    style={{ padding: "4px 6px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 4, fontSize: 11, cursor: "pointer", color: "#dc2626" }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. ASSOCIATION COMMITTEE (MAX 3 ACCOUNTS) */}
              {apartmentDetailTab === "committee" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                        Association Committee Accounts (Max 3)
                      </h3>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                        Each apartment association is strictly limited to 3 committee accounts with access scoped to this complex.
                      </p>
                    </div>

                    {(selectedApartment.associationUsers || []).length < 3 ? (
                      <button
                        onClick={() => setShowAssocUserModal(true)}
                        style={{
                          padding: "8px 14px",
                          background: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        + Add Committee Account
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "4px 10px", borderRadius: 6 }}>
                        ✓ 3/3 Limit Reached
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(selectedApartment.associationUsers || []).length === 0 ? (
                      <div style={{ padding: 24, background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                        No association committee accounts created yet. Up to 3 accounts can be added.
                      </div>
                    ) : (
                      selectedApartment.associationUsers.map((u, idx) => (
                        <div
                          key={u._id || idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                              {u.name || `Committee Member ${idx + 1}`}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                              Phone: <strong>{u.mobileNumber}</strong> {u.email ? `• ${u.email}` : ""}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveAssocUser(u._id, u.name)}
                            style={{
                              padding: "5px 10px",
                              background: "#fee2e2",
                              border: "none",
                              borderRadius: 6,
                              color: "#dc2626",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Remove Access
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 3. APARTMENT-SCOPED TICKETS */}
              {apartmentDetailTab === "tickets" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                        Complaints for {selectedApartment.name}
                      </h3>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                        Tickets submitted by residents and committee members of this complex.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {tickets.filter((t) => (t.apartmentId?._id || t.apartmentId) === selectedApartment._id).length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 12, background: "#f8fafc", borderRadius: 8 }}>
                        No complaints logged for this apartment complex.
                      </div>
                    ) : (
                      tickets
                        .filter((t) => (t.apartmentId?._id || t.apartmentId) === selectedApartment._id)
                        .map((t) => (
                          <div
                            key={t._id}
                            onClick={() => setSelectedTicket(t)}
                            style={{
                              padding: 12,
                              borderRadius: 8,
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>
                                  {t.ticketId}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: 4 }}>
                                  Flat {t.flatNumber || "Common"}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: 4 }}>
                                  {t.category}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{t.subject}</div>
                            </div>

                            <div style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "3px 8px",
                                  borderRadius: 4,
                                  background: t.status === "Resolved" || t.status === "Closed" ? "#ecfdf5" : "#fffbeb",
                                  color: t.status === "Resolved" || t.status === "Closed" ? "#065f46" : "#b45309",
                                }}
                              >
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 40, background: "#f8fafc", borderRadius: 12, border: "2px dashed #cbd5e1", textAlign: "center", color: "#64748b" }}>
              <BuildingIcon />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#334155", margin: "10px 0 4px" }}>
                No Complex Selected
              </h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                Select an apartment from the left to inspect resident flats, committee accounts, and maintenance tickets.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: GLOBAL SOCIETY MAINTENANCE TICKETS (PHASE 6) ─── */}
      {activeTab === "tickets" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedTicket ? "1.2fr 1fr" : "1fr", gap: 24 }}>
          {/* Tickets List Column */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            {/* Filter Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                  Apartment
                </label>
                <select
                  value={ticketApartmentFilter}
                  onChange={(e) => setTicketApartmentFilter(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                >
                  <option value="All">All Apartments</option>
                  {apartments.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: 120 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                  Category
                </label>
                <select
                  value={ticketCategoryFilter}
                  onChange={(e) => setTicketCategoryFilter(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                >
                  <option value="All">All Categories</option>
                  <option value="Plumbing/Water">Plumbing / Water</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Lift">Lift</option>
                  <option value="Security">Security</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Internet">Internet</option>
                  <option value="Civil Maintenance">Civil Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ minWidth: 100 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                  Priority
                </label>
                <select
                  value={ticketPriorityFilter}
                  onChange={(e) => setTicketPriorityFilter(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                >
                  <option value="All">All</option>
                  <option value="Emergency">Emergency</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div style={{ minWidth: 110 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                  Status
                </label>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Acknowledged">Acknowledged</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>

              <div style={{ minWidth: 80 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                  Flat #
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={ticketFlatFilter}
                  onChange={(e) => setTicketFlatFilter(e.target.value)}
                  style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                />
              </div>

              <div style={{ minWidth: 130 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                  Assigned Staff
                </label>
                <select
                  value={ticketStaffFilter}
                  onChange={(e) => setTicketStaffFilter(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                >
                  <option value="All">All Staff</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingTickets ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No tickets matching filters.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tickets.map((t) => {
                  const isOverdue = t.isOverdue;
                  const isResolved = t.status === "Resolved" || t.status === "Closed";

                  return (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTicket(t)}
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        border: selectedTicket?._id === t._id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        background: selectedTicket?._id === t._id ? "#f8faff" : "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                              {t.ticketId}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", padding: "2px 6px", borderRadius: 4 }}>
                              {t.apartmentName || "Society"}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#d1fae5", color: "#065f46", padding: "2px 6px", borderRadius: 4 }}>
                              Flat {t.flatNumber || "Common"}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 4 }}>
                              {t.category}
                            </span>

                            {/* Ageing Badge */}
                            {!isResolved && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: isOverdue ? "#fee2e2" : "#f1f5f9",
                                  color: isOverdue ? "#dc2626" : "#475569",
                                }}
                              >
                                ⏱️ {t.ageingDays === 0 ? "Today" : `Pending ${t.ageingDays}d`}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t.subject}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            Resident: <strong>{t.raisedByName || "User"}</strong> ({t.raisedByPhone || "No Phone"})
                          </div>
                        </div>

                        <div style={{ textAlign: "right", shrink: 0 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: 4,
                              background: isResolved ? "#ecfdf5" : t.status === "New" ? "#eff6ff" : "#fffbeb",
                              color: isResolved ? "#065f46" : t.status === "New" ? "#1e40af" : "#b45309",
                            }}
                          >
                            {t.status}
                          </span>
                          {t.assignedStaffName && (
                            <div style={{ fontSize: 10, color: "#2563eb", fontWeight: 700, marginTop: 4 }}>
                              🔧 {t.assignedStaffName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Ticket Management Inspector Drawer */}
          {selectedTicket ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
              {/* Header */}
              <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#2563eb", background: "#dbeafe", padding: "2px 6px", borderRadius: 4 }}>
                      {selectedTicket.ticketId} &bull; {selectedTicket.category}
                    </span>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "4px 0 2px" }}>
                      {selectedTicket.subject}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 8px", color: "#64748b", cursor: "pointer", fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>

                {/* Resident info card */}
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, marginTop: 8, fontSize: 11, color: "#334155" }}>
                  <div>📍 Complex: <strong>{selectedTicket.apartmentName}</strong> &bull; Flat: <strong>{selectedTicket.flatNumber || "Common"}</strong></div>
                  <div>👤 Resident: <strong>{selectedTicket.raisedByName}</strong> ({selectedTicket.raisedByPhone})</div>
                </div>

                {/* Workflow Status Bar */}
                <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Status:</span>
                  {["New", "Acknowledged", "Assigned", "In Progress", "Resolved", "Closed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateTicketStatus(st)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: selectedTicket.status === st ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                        background: selectedTicket.status === st ? "#eff6ff" : "#fff",
                        color: selectedTicket.status === st ? "#1d4ed8" : "#475569",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                  {["Resolved", "Closed"].includes(selectedTicket.status) && (
                    <button
                      type="button"
                      onClick={() => setShowReopenModal(true)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                      }}
                    >
                      🔄 Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Maintenance Staff Assignment Section */}
              <div style={{ background: "#f1f5f9", padding: 12, borderRadius: 8, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  🔧 Assign Maintenance Technician / Staff
                </div>
                <form onSubmit={handleAssignStaff} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <select
                    value={assigningStaffId}
                    onChange={(e) => setAssigningStaffId(e.target.value)}
                    style={{ flex: 1, minWidth: 150, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11 }}
                  >
                    <option value="">Select Technician...</option>
                    {staffList.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Assignment note (optional)"
                    value={assigningNotes}
                    onChange={(e) => setAssigningNotes(e.target.value)}
                    style={{ flex: 1, minWidth: 130, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11 }}
                  />
                  <button
                    type="submit"
                    disabled={!assigningStaffId || assigningStaff}
                    style={{ padding: "6px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    {assigningStaff ? "Assigning..." : "Assign"}
                  </button>
                </form>
                {selectedTicket.assignedStaffName && (
                  <div style={{ fontSize: 11, color: "#166534", marginTop: 4 }}>
                    Currently assigned to: <strong>{selectedTicket.assignedStaffName}</strong> ({selectedTicket.assignedStaffPhone || "No Phone"})
                  </div>
                )}
              </div>

              {/* Sub-Tabs: Discussion vs Internal Notes vs Status History */}
              <div style={{ display: "flex", gap: 6, borderBottom: "1px solid #e2e8f0", marginBottom: 12 }}>
                <button
                  onClick={() => setTicketInspectorTab("discussion")}
                  style={{
                    padding: "6px 12px",
                    background: "none",
                    border: "none",
                    borderBottom: ticketInspectorTab === "discussion" ? "2px solid #2563eb" : "none",
                    color: ticketInspectorTab === "discussion" ? "#2563eb" : "#64748b",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  💬 Resident Thread
                </button>
                <button
                  onClick={() => setTicketInspectorTab("internal_notes")}
                  style={{
                    padding: "6px 12px",
                    background: "none",
                    border: "none",
                    borderBottom: ticketInspectorTab === "internal_notes" ? "2px solid #2563eb" : "none",
                    color: ticketInspectorTab === "internal_notes" ? "#2563eb" : "#64748b",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  🔒 Internal Notes ({selectedTicket.internalNotes?.length || 0})
                </button>
                <button
                  onClick={() => setTicketInspectorTab("history")}
                  style={{
                    padding: "6px 12px",
                    background: "none",
                    border: "none",
                    borderBottom: ticketInspectorTab === "history" ? "2px solid #2563eb" : "none",
                    color: ticketInspectorTab === "history" ? "#2563eb" : "#64748b",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  ⏱️ Timeline ({selectedTicket.statusHistory?.length || 0})
                </button>
              </div>

              {/* Tab Content 1: Resident Discussion */}
              {ticketInspectorTab === "discussion" && (
                <div>
                  <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {(selectedTicket.messages || []).map((m, idx) => (
                      <div key={idx} style={{ padding: 10, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}>
                        <div style={{ color: "#1e293b", whiteSpace: "pre-wrap" }}>{m.text}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                          {new Date(m.createdAt || selectedTicket.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleReplyTicket} style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Send update to resident..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sendingReply}
                      style={{ padding: "8px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      {sendingReply ? "Sending..." : "Reply"}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab Content 2: Internal Staff Notes */}
              {ticketInspectorTab === "internal_notes" && (
                <div>
                  <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {(selectedTicket.internalNotes || []).length === 0 ? (
                      <div style={{ padding: 14, textAlign: "center", color: "#94a3b8", fontSize: 11 }}>
                        No internal staff notes yet. Notes added here are invisible to residents.
                      </div>
                    ) : (
                      selectedTicket.internalNotes.map((n, idx) => (
                        <div key={idx} style={{ padding: 10, background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a", fontSize: 12 }}>
                          <div style={{ color: "#92400e", fontWeight: 600 }}>{n.text}</div>
                          <div style={{ fontSize: 10, color: "#b45309", marginTop: 4 }}>
                            By {n.addedByName || "Staff"} &bull; {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddInternalNote} style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Add private staff note..."
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                    />
                    <button
                      type="submit"
                      disabled={!internalNoteText.trim() || savingInternalNote}
                      style={{ padding: "8px 14px", background: "#d97706", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      {savingInternalNote ? "Adding..." : "Add Note"}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab Content 3: Status Transition Timeline */}
              {ticketInspectorTab === "history" && (
                <div style={{ maxHeight: 250, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {(selectedTicket.statusHistory || []).map((h, idx) => (
                    <div key={idx} style={{ padding: 8, background: "#f8fafc", borderRadius: 6, borderLeft: "3px solid #2563eb", fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>Status: {h.status}</div>
                      <div style={{ color: "#475569" }}>{h.reason || "Updated"}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                        By {h.changedByName || "User"} &bull; {new Date(h.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resolution Form (if in progress) */}
              {selectedTicket.status !== "Resolved" && selectedTicket.status !== "Closed" && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #e2e8f0" }}>
                  <form onSubmit={handleResolveTicket} style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Resolution notes (e.g. pipe replaced, power restored)..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11 }}
                    />
                    <button
                      type="submit"
                      disabled={resolvingTicket}
                      style={{ padding: "7px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      {resolvingTicket ? "Resolving..." : "Mark Resolved"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 40, background: "#f8fafc", borderRadius: 12, border: "2px dashed #cbd5e1", textAlign: "center", color: "#64748b" }}>
              <BuildingIcon />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#334155", margin: "10px 0 4px" }}>
                No Ticket Selected
              </h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                Select a ticket from the left to inspect resident details, assign maintenance staff, add internal notes, and manage resolution.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: ADD / EDIT APARTMENT COMPLEX ─── */}
      {showApartmentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                {selectedApartment ? "Edit Apartment Complex" : "Add Apartment Complex"}
              </h3>
              <button onClick={() => setShowApartmentModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleSaveApartment} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Apartment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Lakeview Apartments"
                  value={apartmentForm.name}
                  onChange={(e) => setApartmentForm({ ...apartmentForm, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Street / Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Road, Area, Landmark"
                    value={apartmentForm.address.street}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, address: { ...apartmentForm.address, street: e.target.value } })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>City</label>
                  <input
                    type="text"
                    value={apartmentForm.address.city}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, address: { ...apartmentForm.address, city: e.target.value } })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>State</label>
                  <input
                    type="text"
                    value={apartmentForm.address.state}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, address: { ...apartmentForm.address, state: e.target.value } })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Pincode</label>
                  <input
                    type="text"
                    placeholder="560100"
                    value={apartmentForm.address.pincode}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, address: { ...apartmentForm.address, pincode: e.target.value } })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Contact Person</label>
                  <input
                    type="text"
                    placeholder="Society President / Manager"
                    value={apartmentForm.contactPerson}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, contactPerson: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Contact Mobile</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={apartmentForm.contactPhone}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, contactPhone: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Contact Email</label>
                  <input
                    type="email"
                    placeholder="society@example.com"
                    value={apartmentForm.contactEmail}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, contactEmail: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Total Flats Count</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 120"
                    value={apartmentForm.totalFlats}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, totalFlats: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Internal Notes / Gates info</label>
                <textarea
                  rows={2}
                  placeholder="Gate 1 on Main road, 24/7 security intercom..."
                  value={apartmentForm.notes}
                  onChange={(e) => setApartmentForm({ ...apartmentForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowApartmentModal(false)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingApartment}
                  style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {savingApartment ? "Saving..." : "Save Apartment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD ASSOCIATION COMMITTEE USER (MAX 3) ─── */}
      {showAssocUserModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Add Association Committee Account
                </h3>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                  Limit: Exactly up to 3 accounts for {selectedApartment?.name}
                </p>
              </div>
              <button onClick={() => setShowAssocUserModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleAddAssocUser} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Committee Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar (Secretary)"
                  value={assocUserForm.name}
                  onChange={(e) => setAssocUserForm({ ...assocUserForm, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Mobile Number (Login ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="9876543210"
                  value={assocUserForm.mobileNumber}
                  onChange={(e) => setAssocUserForm({ ...assocUserForm, mobileNumber: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Email (optional)</label>
                <input
                  type="email"
                  placeholder="secretary@example.com"
                  value={assocUserForm.email}
                  onChange={(e) => setAssocUserForm({ ...assocUserForm, email: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Initial Password (min 6 characters) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={assocUserForm.password}
                  onChange={(e) => setAssocUserForm({ ...assocUserForm, password: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAssocUserModal(false)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssocUser}
                  style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {savingAssocUser ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD / EDIT RESIDENT FLAT ─── */}
      {showResidentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                {editingResident ? `Edit Resident (Flat ${editingResident.flatNumber})` : "Add Resident Flat"}
              </h3>
              <button onClick={() => setShowResidentModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleSaveResident} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Flat Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 302"
                    value={residentForm.flatNumber}
                    onChange={(e) => setResidentForm({ ...residentForm, flatNumber: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Block / Tower</label>
                  <input
                    type="text"
                    placeholder="e.g. Block B"
                    value={residentForm.block}
                    onChange={(e) => setResidentForm({ ...residentForm, block: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. 3"
                    value={residentForm.floor}
                    onChange={(e) => setResidentForm({ ...residentForm, floor: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Resident Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={residentForm.name}
                    onChange={(e) => setResidentForm({ ...residentForm, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit mobile"
                    value={residentForm.phone}
                    onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Classification</label>
                  <select
                    value={residentForm.residentType}
                    onChange={(e) => setResidentForm({ ...residentForm, residentType: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                  >
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Occupancy Status</label>
                  <select
                    value={residentForm.status}
                    onChange={(e) => setResidentForm({ ...residentForm, status: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                  >
                    <option value="active">Active</option>
                    <option value="vacated">Vacated</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Email (optional)</label>
                  <input
                    type="email"
                    placeholder="resident@example.com"
                    value={residentForm.email}
                    onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Move-in Date</label>
                  <input
                    type="date"
                    value={residentForm.moveInDate}
                    onChange={(e) => setResidentForm({ ...residentForm, moveInDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>Emergency Contact (Optional)</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={residentForm.emergencyName}
                    onChange={(e) => setResidentForm({ ...residentForm, emergencyName: e.target.value })}
                    style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11 }}
                  />
                  <input
                    type="text"
                    placeholder="Contact Phone"
                    value={residentForm.emergencyPhone}
                    onChange={(e) => setResidentForm({ ...residentForm, emergencyPhone: e.target.value })}
                    style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11 }}
                  />
                  <input
                    type="text"
                    placeholder="Relation (e.g. Spouse)"
                    value={residentForm.emergencyRelation}
                    onChange={(e) => setResidentForm({ ...residentForm, emergencyRelation: e.target.value })}
                    style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11 }}
                  />
                </div>
              </div>

              {/* Account Activation Mode (when creating) */}
              {!editingResident && (
                <div style={{ background: "#eff6ff", padding: 12, borderRadius: 8, border: "1px solid #bfdbfe" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af" }}>Account Login Setup:</span>
                  <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="pwdOption"
                        value="invite"
                        checked={residentForm.passwordOption === "invite"}
                        onChange={() => setResidentForm({ ...residentForm, passwordOption: "invite" })}
                      />
                      Generate 6-Digit Activation Code (Recommended)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="pwdOption"
                        value="password"
                        checked={residentForm.passwordOption === "password"}
                        onChange={() => setResidentForm({ ...residentForm, passwordOption: "password" })}
                      />
                      Set Direct Password
                    </label>
                  </div>
                  {residentForm.passwordOption === "password" && (
                    <input
                      type="password"
                      placeholder="Enter initial password (min 6 chars)"
                      minLength={6}
                      value={residentForm.password}
                      onChange={(e) => setResidentForm({ ...residentForm, password: e.target.value })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, marginTop: 8, boxSizing: "border-box" }}
                    />
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowResidentModal(false)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResident}
                  style={{ padding: "8px 18px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {savingResident ? "Saving..." : editingResident ? "Update Resident" : "Save Resident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: RESIDENT ACTIVATION INVITATION POPUP ─── */}
      {invitationModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                🔑 Resident Account Invitation
              </h3>
              <button onClick={() => setInvitationModalData(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <p style={{ fontSize: 12, color: "#475569", margin: "0 0 14px 0" }}>
              Share this activation code with resident <strong>{invitationModalData.name}</strong> (Flat {invitationModalData.flatNumber}). They can activate their account securely by entering this code.
            </p>

            <div style={{ background: "#eff6ff", border: "2px dashed #3b82f6", borderRadius: 10, padding: 16, textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Activation Code</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#1e3a8a", letterSpacing: 6, margin: "6px 0" }}>
                {invitationModalData.code}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Valid for 7 days &bull; Phone: {invitationModalData.phone}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Direct Activation URL:</label>
              <input
                type="text"
                readOnly
                value={invitationModalData.url}
                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, background: "#f8fafc", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `Hello ${invitationModalData.name}, your TechBes resident portal activation code is: ${invitationModalData.code}. Activate your account at: ${invitationModalData.url}`
                  );
                  alert("Invitation text copied to clipboard!");
                }}
                style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                📋 Copy Message
              </button>
              <button
                type="button"
                onClick={() => setInvitationModalData(null)}
                style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: REOPEN TICKET MODAL ─── */}
      {showReopenModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 420 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px", color: "#0f172a" }}>
              🔄 Reopen Maintenance Complaint
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>
              Please record the reason why this complaint is being reopened.
            </p>

            <form onSubmit={handleReopenTicket} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <textarea
                required
                rows={3}
                placeholder="Reason (e.g. Issue recurred, water pressure still low)..."
                value={reopenReasonText}
                onChange={(e) => setReopenReasonText(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopeningTicket}
                  style={{ padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {reopeningTicket ? "Reopening..." : "Confirm Reopen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
