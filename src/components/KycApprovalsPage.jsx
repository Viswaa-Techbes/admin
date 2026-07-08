import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiClient";
import { PageHeader, Card, ActionBtn, Modal } from "./UI";

function DocumentReviewItem({ label, doc }) {
  const [zoom, setZoom] = React.useState(1);

  if (!doc || !doc.url) {
    return (
      <Card style={{ border: "1px dashed #cbd5e1", borderRadius: 8, padding: 16, textAlign: "center", color: "#64748b" }}>
        <strong>{label}:</strong> Document not uploaded
      </Card>
    );
  }

  const isPdf = doc.type === 'pdf' || doc.url.toLowerCase().endsWith('.pdf');

  return (
    <Card style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, background: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h5 style={{ margin: 0, fontSize: 13, color: "#475569" }}>{label}</h5>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", fontSize: 11, padding: "4px 8px", background: "#e2e8f0", borderRadius: 6, color: "#334155", fontWeight: 600 }}>
            Open New Tab
          </a>
          <a href={doc.url} download style={{ textDecoration: "none", fontSize: 11, padding: "4px 8px", background: "#6366f1", borderRadius: 6, color: "#fff", fontWeight: 600 }}>
            Download
          </a>
        </div>
      </div>

      {isPdf ? (
        <div style={{ height: 350, borderRadius: 8, overflow: "hidden", border: "1px solid #cbd5e1" }}>
          <iframe src={doc.url} style={{ width: "100%", height: "100%", border: "none" }} title={label} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img 
              src={doc.url} 
              alt={label} 
              style={{ 
                maxHeight: 250, 
                objectFit: "contain", 
                transform: `scale(${zoom})`, 
                transition: "transform 0.2s" 
              }} 
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} style={{ padding: "4px 8px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Zoom -</button>
            <button type="button" onClick={() => setZoom(1)} style={{ padding: "4px 8px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Reset</button>
            <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.25))} style={{ padding: "4px 8px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Zoom +</button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function KycApprovalsPage() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedTech, setSelectedTech] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectMode, setRejectMode] = useState(null); // 'reupload' or 'reject'

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

  const handleRejectConfirm = async (id) => {
    if (!rejectReason) {
      alert("Please provide a reason.");
      return;
    }
    const prefix = rejectMode === 'reupload' ? "Reupload Required: " : "Rejected: ";
    try {
      await apiFetch(`/api/v2/kyc/admin/${id}/reject`, {
        method: "PUT",
        body: { reason: prefix + rejectReason }
      });
      setSelectedTech(null);
      setIsRejecting(false);
      setRejectMode(null);
      setRejectReason("");
      fetchPendingKyc();
    } catch (err) {
      alert("Error rejecting: " + err.message);
    }
  };

  const getDoc = (tech, key) => {
    if (tech?.kycDocuments && tech.kycDocuments[key] && tech.kycDocuments[key].url) {
      return tech.kycDocuments[key];
    }
    // Fallback to legacy fields in kycDetails
    const legacyMapping = {
      aadhaarFront: tech?.kycDetails?.aadhaarImageFront,
      aadhaarBack: tech?.kycDetails?.aadhaarImageBack,
      panCard: tech?.kycDetails?.panImage,
      signature: tech?.kycDetails?.signatureImage,
      bankProof: null,
      selfie: null
    };
    const fallbackUrl = legacyMapping[key];
    if (fallbackUrl) {
      return {
        url: fallbackUrl,
        type: fallbackUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
        publicId: '',
        uploadedAt: null
      };
    }
    return null;
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
        <Modal open={true} title={`Review KYC for ${selectedTech.name}`} onClose={() => { setSelectedTech(null); setIsRejecting(false); setRejectMode(null); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
            
            {/* Left Column: Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card style={{ padding: 16, background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15 }}>Identity Numbers</h4>
                <p style={{ margin: "4px 0", fontSize: 13 }}><strong>Aadhaar:</strong> {selectedTech.kycDetails?.aadhaarNumber || "Not Provided"}</p>
                <p style={{ margin: "4px 0", fontSize: 13 }}><strong>PAN:</strong> {selectedTech.kycDetails?.panNumber || "Not Provided"}</p>
              </Card>

              <Card style={{ padding: 16, background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15 }}>Bank Details</h4>
                <p style={{ margin: "4px 0", fontSize: 13 }}><strong>Account Name:</strong> {selectedTech.kycDetails?.bankDetails?.accountName || "N/A"}</p>
                <p style={{ margin: "4px 0", fontSize: 13 }}><strong>Account Number:</strong> {selectedTech.kycDetails?.bankDetails?.accountNumber || "N/A"}</p>
                <p style={{ margin: "4px 0", fontSize: 13 }}><strong>IFSC Code:</strong> {selectedTech.kycDetails?.bankDetails?.ifscCode || "N/A"}</p>
                <p style={{ margin: "4px 0", fontSize: 13 }}><strong>Bank Name:</strong> {selectedTech.kycDetails?.bankDetails?.bankName || "N/A"}</p>
              </Card>

              <Card style={{ padding: 16, background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15 }}>Skills</h4>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedTech.skills?.length > 0 ? (
                    selectedTech.skills.map(s => <span key={s} style={{ padding: "2px 8px", background: "#e2e8f0", borderRadius: 12, fontSize: 12 }}>{s}</span>)
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>No skills listed</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Documents */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <DocumentReviewItem label="Aadhaar Front" doc={getDoc(selectedTech, "aadhaarFront")} />
              <DocumentReviewItem label="Aadhaar Back" doc={getDoc(selectedTech, "aadhaarBack")} />
              <DocumentReviewItem label="PAN Card" doc={getDoc(selectedTech, "panCard")} />
              <DocumentReviewItem label="Bank Proof" doc={getDoc(selectedTech, "bankProof")} />
              <DocumentReviewItem label="Selfie" doc={getDoc(selectedTech, "selfie")} />
              <DocumentReviewItem label="Digital Signature" doc={getDoc(selectedTech, "signature")} />
            </div>

          </div>
          
          <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
            {isRejecting ? (
              <div style={{ flex: 1, display: "flex", gap: 8 }}>
                <input 
                  type="text" 
                  placeholder={rejectMode === 'reupload' ? "Reason for reupload request..." : "Reason for rejection..."} 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }}
                />
                <button onClick={() => handleRejectConfirm(selectedTech._id)} style={{ padding: "8px 16px", background: rejectMode === 'reupload' ? "#f59e0b" : "#ef4444", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
                  {rejectMode === 'reupload' ? "Confirm Reupload" : "Confirm Reject"}
                </button>
                <button onClick={() => { setIsRejecting(false); setRejectMode(null); }} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Cancel</button>
              </div>
            ) : (
              <>
                <button onClick={() => handleApprove(selectedTech._id)} style={{ flex: 1, padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Approve Technician</button>
                <button onClick={() => { setIsRejecting(true); setRejectMode('reupload'); }} style={{ flex: 1, padding: "12px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Request Reupload</button>
                <button onClick={() => { setIsRejecting(true); setRejectMode('reject'); }} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Reject Application</button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
