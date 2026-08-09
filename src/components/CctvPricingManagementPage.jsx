"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, TableWrapper, ActionBtn, SectionHeader, useToast } from "./UI";
import { PlusIcon, EditIcon, TrashIcon } from "./Icons";

const INPUT_STYLE = { padding: "10px 12px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 13, width: "100%", outline: "none" };
const LABEL_STYLE = { fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 };
const TD_STYLE = { padding: "12px 20px", fontSize: 13, borderBottom: "1px solid #f1f5f9", color: "#334155" };
const TH_STYLE = { padding: "12px 20px", fontSize: 12, fontWeight: 700, color: "#64748b", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" };

const primaryButton = { background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 };
const secondaryButton = { background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 };
const pillButton = (active) => ({ padding: "8px 16px", borderRadius: 20, border: "none", background: active ? "#6366f1" : "#e2e8f0", color: active ? "#fff" : "#64748b", cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.15s ease" });

const CAMERA_TYPES = [
  "IP Camera",
  "Analog Camera",
  "WiFi Indoor Camera",
  "WiFi Outdoor Camera",
  "4G Camera",
  "Solar Camera"
];

export function CctvPricingManagementPage() {
  const toast = useToast();
  const [tab, setTab] = useState("brands");
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [sdCards, setSdCards] = useState([]);
  const [hdds, setHdds] = useState([]);
  const [racks, setRacks] = useState([]);
  const [cables, setCables] = useState([]);
  const [installation, setInstallation] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [bRes, mRes, sdRes, cRes, instRes, accRes, confRes, hddRes, rackRes] = await Promise.all([
        fetch("/api/v2/admin/services/cctv/brands").then(r => r.json()),
        fetch("/api/v2/admin/services/cctv/models").then(r => r.json()),
        fetch("/api/v2/admin/services/cctv/sd-cards").then(r => r.json()),
        fetch("/api/v2/admin/services/cctv/cable-pricings").then(r => r.json()),
        fetch("/api/v2/admin/services/cctv/installation-charges").then(r => r.json()),
        fetch("/api/v2/admin/services/cctv/accessories").then(r => r.json()),
        fetch("/api/v2/admin/services/cctv/pricing-config").then(r => r.json()),
        fetch("/api/v2/admin/services/cctv/hdds").then(r => r.json()),
        fetch("/api/v2/admin/services/cctv/racks").then(r => r.json()),
      ]);

      if (bRes.success) setBrands(bRes.data || []);
      if (mRes.success) setModels(mRes.data || []);
      if (sdRes.success) setSdCards(sdRes.data || []);
      if (cRes.success) setCables(cRes.data || []);
      if (instRes.success) setInstallation(instRes.data || []);
      if (accRes.success) setAccessories(accRes.data || []);
      if (hddRes.success) setHdds(hddRes.data || []);
      if (rackRes.success) setRacks(rackRes.data || []);
      if (confRes.success) {
        setPricingConfig(confRes.data || null);
        if (tab === "general") {
          setForm({
            visitCharge: confRes.data?.baseCharge || 499,
            gstPercentage: confRes.data?.tax?.percentage || 18,
          });
        }
      }
    } catch (err) {
      toast.show("Error loading pricing data", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setShowForm(false);
    setForm({});
    if (tab === "general" && pricingConfig) {
      setForm({
        visitCharge: pricingConfig.baseCharge || 499,
        gstPercentage: pricingConfig.tax?.percentage || 18,
      });
    }
  }, [tab, pricingConfig]);

  const endpointMap = {
    brands: "/api/v2/admin/services/cctv/brands",
    models: "/api/v2/admin/services/cctv/models",
    sdcards: "/api/v2/admin/services/cctv/sd-cards",
    hdds: "/api/v2/admin/services/cctv/hdds",
    racks: "/api/v2/admin/services/cctv/racks",
    cables: "/api/v2/admin/services/cctv/cable-pricings",
    installation: "/api/v2/admin/services/cctv/installation-charges",
    accessories: "/api/v2/admin/services/cctv/accessories"
  };

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      if (tab === "general") {
        const payload = {
          baseCharge: Number(form.visitCharge) || 0,
          tax: {
            label: "GST",
            percentage: Number(form.gstPercentage) || 0,
            status: "active"
          }
        };
        const res = await fetch("/api/v2/admin/services/cctv/pricing-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.show("General pricing config saved successfully", "success");
          await loadData();
        } else {
          toast.show(data.message || "Failed to save configuration", "error");
        }
      } else {
        const url = form._id ? `${endpointMap[tab]}/${form._id}` : endpointMap[tab];
        const method = form._id ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (data.success) {
          toast.show("Saved successfully", "success");
          setShowForm(false);
          setForm({});
          await loadData();
        } else {
          toast.show(data.message || "Failed to save", "error");
        }
      }
    } catch (err) {
      toast.show("Network error during save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to deactivate this item?")) return;
    try {
      const res = await fetch(`${endpointMap[tab]}/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.show("Deactivated successfully", "success");
        await loadData();
      } else {
        toast.show(data.message || "Failed to delete", "error");
      }
    } catch (err) {
      toast.show("Network error during deletion", "error");
    }
  }

  const tabs = [
    { id: "brands", label: "Brands" },
    { id: "models", label: "Models & Prices" },
    { id: "sdcards", label: "SD Cards" },
    { id: "hdds", label: "HDD / Storage" },
    { id: "racks", label: "Racks" },
    { id: "cables", label: "Cables" },
    { id: "installation", label: "Installation Fitting" },
    { id: "accessories", label: "Accessories/Mounts" },
    { id: "general", label: "Visit & GST" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <PageHeader
        title="CCTV Pricing Management"
        subtitle="Manage dynamic security camera pricing, accessories, SD Cards, cable charges, and taxes."
        actions={
          tab !== "general" && !showForm && (
            <ActionBtn
              primary
              icon={<PlusIcon />}
              label="Add New"
              onClick={() => {
                setForm({ status: "active" });
                setShowForm(true);
              }}
            />
          )
        }
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={pillButton(tab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <Card style={{ padding: 24, marginBottom: 24 }}>
          <SectionHeader title={form._id ? "Edit Item" : "Create New Item"} />
          <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {tab === "brands" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={LABEL_STYLE}>Brand Name</label>
                <input
                  style={INPUT_STYLE}
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. CP Plus"
                  required
                />
              </div>
            )}

            {tab === "models" && (
              <>
                <div>
                  <label style={LABEL_STYLE}>Brand</label>
                  <select
                    style={INPUT_STYLE}
                    value={form.brandId || ""}
                    onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Brand --</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Camera Type</label>
                  <select
                    style={INPUT_STYLE}
                    value={form.cameraType || ""}
                    onChange={(e) => setForm({ ...form, cameraType: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Type --</option>
                    {CAMERA_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Model Variant Name</label>
                  <input
                    style={INPUT_STYLE}
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Normal, Hybrid, PT"
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Camera Resolution</label>
                  <input
                    style={INPUT_STYLE}
                    value={form.resolution || ""}
                    onChange={(e) => setForm({ ...form, resolution: e.target.value })}
                    placeholder="e.g. 2MP, 4MP, 5MP"
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Camera Price (₹)</label>
                  <input
                    type="number"
                    style={INPUT_STYLE}
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="e.g. 2350"
                    required
                  />
                </div>
              </>
            )}

            {tab === "sdcards" && (
              <>
                <div>
                  <label style={LABEL_STYLE}>Capacity</label>
                  <input
                    style={INPUT_STYLE}
                    value={form.capacity || ""}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="e.g. 64GB"
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Price (₹)</label>
                  <input
                    type="number"
                    style={INPUT_STYLE}
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="e.g. 950"
                    required
                  />
                </div>
              </>
            )}

            {tab === "hdds" && (
              <>
                <div>
                  <label style={LABEL_STYLE}>Capacity</label>
                  <input
                    style={INPUT_STYLE}
                    value={form.capacity || ""}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="e.g. 1TB"
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Price (₹)</label>
                  <input
                    type="number"
                    style={INPUT_STYLE}
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="e.g. 4000"
                    required
                  />
                </div>
              </>
            )}

            {tab === "racks" && (
              <>
                <div>
                  <label style={LABEL_STYLE}>Type</label>
                  <input
                    style={INPUT_STYLE}
                    value={form.type || ""}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    placeholder="e.g. Mini 2U"
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Price (₹)</label>
                  <input
                    type="number"
                    style={INPUT_STYLE}
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="e.g. 950"
                    required
                  />
                </div>
              </>
            )}

            {(tab === "cables" || tab === "installation" || tab === "accessories") && (
              <>
                <div>
                  <label style={LABEL_STYLE}>Name</label>
                  <input
                    style={INPUT_STYLE}
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. CAT6 Cable, DVR Installation"
                    required
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Price (₹)</label>
                  <input
                    type="number"
                    style={INPUT_STYLE}
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="e.g. 60"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label style={LABEL_STYLE}>Status</label>
              <select
                style={INPUT_STYLE}
                value={form.status || "active"}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, marginTop: 12 }}>
              <button type="submit" style={primaryButton} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                style={secondaryButton}
                onClick={() => {
                  setShowForm(false);
                  setForm({});
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {tab === "general" ? (
        <Card style={{ padding: 24 }}>
          <SectionHeader title="Edit General Configuration" />
          <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={LABEL_STYLE}>Visit Charges (₹)</label>
              <input
                type="number"
                style={INPUT_STYLE}
                value={form.visitCharge ?? ""}
                onChange={(e) => setForm({ ...form, visitCharge: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>GST Percentage (%)</label>
              <input
                type="number"
                style={INPUT_STYLE}
                value={form.gstPercentage ?? ""}
                onChange={(e) => setForm({ ...form, gstPercentage: Number(e.target.value) })}
                required
              />
            </div>
            <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
              <button type="submit" style={primaryButton} disabled={saving}>
                {saving ? "Saving Configuration..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <Card>
          <div style={{ padding: "16px 20px" }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#334155" }}>
              Active {tabs.find(t => t.id === tab)?.label} List
            </h4>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>
              Loading pricing items...
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {tab === "brands" && (
                      <>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Name</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Status</th>
                      </>
                    )}
                    {tab === "models" && (
                      <>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Brand</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Type</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Variant</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Resolution</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>Price</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Status</th>
                      </>
                    )}
                    {tab === "sdcards" && (
                      <>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Capacity</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>Price</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Status</th>
                      </>
                    )}
                    {tab === "hdds" && (
                      <>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Capacity</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>Price</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Status</th>
                      </>
                    )}
                    {tab === "racks" && (
                      <>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Type</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>Price</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Status</th>
                      </>
                    )}
                    {(tab === "cables" || tab === "installation" || tab === "accessories") && (
                      <>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Name</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>Price</th>
                        <th style={{ ...TH_STYLE, textAlign: "left" }}>Status</th>
                      </>
                    )}
                    <th style={{ ...TH_STYLE, width: 100, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tab === "brands" && brands.map((b) => (
                    <tr key={b._id}>
                      <td style={TD_STYLE}><b>{b.name}</b></td>
                      <td style={TD_STYLE}>
                        <span style={{ color: b.status === "active" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => { setForm(b); setShowForm(true); }}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#6366f1" }}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(b._id)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {tab === "models" && models.map((m) => (
                    <tr key={m._id}>
                      <td style={TD_STYLE}><b>{m.brandId?.name || "Unknown"}</b></td>
                      <td style={TD_STYLE}>{m.cameraType}</td>
                      <td style={TD_STYLE}>{m.name}</td>
                      <td style={TD_STYLE}>{m.resolution}</td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>₹{m.price.toLocaleString("en-IN")}</td>
                      <td style={TD_STYLE}>
                        <span style={{ color: m.status === "active" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => {
                              setForm({
                                ...m,
                                brandId: m.brandId?._id || m.brandId
                              });
                              setShowForm(true);
                            }}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#6366f1" }}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(m._id)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {tab === "sdcards" && sdCards.map((sd) => (
                    <tr key={sd._id}>
                      <td style={TD_STYLE}><b>{sd.capacity}</b></td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>₹{sd.price.toLocaleString("en-IN")}</td>
                      <td style={TD_STYLE}>
                        <span style={{ color: sd.status === "active" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {sd.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => { setForm(sd); setShowForm(true); }}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#6366f1" }}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(sd._id)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {tab === "hdds" && hdds.map((hdd) => (
                    <tr key={hdd._id}>
                      <td style={TD_STYLE}><b>{hdd.capacity}</b></td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>₹{hdd.price.toLocaleString("en-IN")}</td>
                      <td style={TD_STYLE}>
                        <span style={{ color: hdd.status === "active" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {hdd.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => { setForm(hdd); setShowForm(true); }}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#6366f1" }}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(hdd._id)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {tab === "racks" && racks.map((rack) => (
                    <tr key={rack._id}>
                      <td style={TD_STYLE}><b>{rack.type}</b></td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>₹{rack.price.toLocaleString("en-IN")}</td>
                      <td style={TD_STYLE}>
                        <span style={{ color: rack.status === "active" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {rack.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => { setForm(rack); setShowForm(true); }}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#6366f1" }}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(rack._id)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {((tab === "cables" && cables) || (tab === "installation" && installation) || (tab === "accessories" && accessories)).map((item) => (
                    <tr key={item._id}>
                      <td style={TD_STYLE}><b>{item.name}</b></td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>₹{item.price.toLocaleString("en-IN")}</td>
                      <td style={TD_STYLE}>
                        <span style={{ color: item.status === "active" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => { setForm(item); setShowForm(true); }}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#6366f1" }}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {((tab === "brands" && brands.length === 0) ||
                    (tab === "models" && models.length === 0) ||
                    (tab === "sdcards" && sdCards.length === 0) ||
                    (tab === "hdds" && hdds.length === 0) ||
                    (tab === "racks" && racks.length === 0) ||
                    (tab === "cables" && cables.length === 0) ||
                    (tab === "installation" && installation.length === 0) ||
                    (tab === "accessories" && accessories.length === 0)) && (
                    <tr>
                      <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        No items found in this section. Click 'Add New' to insert data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
export default CctvPricingManagementPage;
