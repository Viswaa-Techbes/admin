import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiClient";
import { PageHeader, Card, ActionBtn, Modal } from "./UI";

export function KycApprovalsPage() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedTech, setSelectedTech] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchPendingKyc = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/v2/kyc/admin/pending");
      setTechnicians(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingKyc();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this technician?")) return;
    try {
      await apiFetch(`/api/v2/kyc/admin/${id}/approve`, { method: "PUT" });
      setSelectedTech(null);
      fetchPendingKyc();
    } catch (err) {
      alert("Error approving: " + err.message);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) {
      alert("Please provide a reason for rejection.");
      return;
    }
    try {
      await apiFetch(`/api/v2/kyc/admin/${id}/reject`, {
        method: "PUT",
        body: { reason: rejectReason }
      });
      setSelectedTech(null);
      setIsRejecting(false);
      setRejectReason("");
      fetchPendingKyc();
    } catch (err) {
      alert("Error rejecting: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading pending KYC applications...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>Error: {error}</div>;

  return (
    <div>
      <PageHeader title="Technician KYC Approvals" subtitle={`${technicians.length} pending applications`} />
      
      {technicians.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          No pending KYC applications found.
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {technicians.map((tech) => (
            <Card key={tech._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>{tech.name}</h3>
                <p style={{ margin: "4px 0", color: "#64748b", fontSize: 14 }}>{tech.email} • {tech.mobileNumber}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {tech.skills?.map(skill => (
                    <span key={skill} style={{ padding: "2px 8px", background: "#f1f5f9", borderRadius: 12, fontSize: 12 }}>{skill}</span>
                  ))}
                </div>
              </div>
              <ActionBtn label="Review Documents" primary onClick={() => setSelectedTech(tech)} />
            </Card>
          ))}
        </div>
      )}

      {selectedTech && (
        <Modal title={`Review KYC for ${selectedTech.name}`} onClose={() => { setSelectedTech(null); setIsRejecting(false); }}>
          <div style={{ display: "grid", gap: 24, maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
            
            <section>
              <h4>Aadhaar Details</h4>
              <p><strong>Number:</strong> {selectedTech.kycDetails?.aadhaarNumber || "Not Provided"}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                {selectedTech.kycDetails?.aadhaarImageFront && <img src={selectedTech.kycDetails.aadhaarImageFront} alt="Aadhaar Front" style={{ height: 150, borderRadius: 8, objectFit: "cover" }} />}
                {selectedTech.kycDetails?.aadhaarImageBack && <img src={selectedTech.kycDetails.aadhaarImageBack} alt="Aadhaar Back" style={{ height: 150, borderRadius: 8, objectFit: "cover" }} />}
              </div>
            </section>
            
            <section>
              <h4>PAN Details</h4>
              <p><strong>Number:</strong> {selectedTech.kycDetails?.panNumber || "Not Provided"}</p>
              {selectedTech.kycDetails?.panImage && <img src={selectedTech.kycDetails.panImage} alt="PAN Card" style={{ height: 150, borderRadius: 8, objectFit: "cover", marginTop: 8 }} />}
            </section>
            
            <section>
              <h4>Bank Details</h4>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                <p><strong>Account Name:</strong> {selectedTech.kycDetails?.bankDetails?.accountName || "N/A"}</p>
                <p><strong>Account Number:</strong> {selectedTech.kycDetails?.bankDetails?.accountNumber || "N/A"}</p>
                <p><strong>IFSC Code:</strong> {selectedTech.kycDetails?.bankDetails?.ifscCode || "N/A"}</p>
                <p><strong>Bank Name:</strong> {selectedTech.kycDetails?.bankDetails?.bankName || "N/A"}</p>
              </div>
            </section>
            
            <section>
              <h4>Signature</h4>
              {selectedTech.kycDetails?.signatureImage ? (
                <img src={selectedTech.kycDetails.signatureImage} alt="Signature" style={{ height: 80, borderRadius: 8, objectFit: "contain", background: "#f1f5f9" }} />
              ) : <p>No signature provided.</p>}
            </section>

          </div>
          
          <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
            {isRejecting ? (
              <div style={{ flex: 1, display: "flex", gap: 8 }}>
                <input 
                  type="text" 
                  placeholder="Reason for rejection..." 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6 }}
                />
                <button onClick={() => handleReject(selectedTech._id)} style={{ padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>Confirm Reject</button>
                <button onClick={() => setIsRejecting(false)} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <>
                <button onClick={() => handleApprove(selectedTech._id)} style={{ flex: 1, padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Approve Technician</button>
                <button onClick={() => setIsRejecting(true)} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Reject Application</button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
