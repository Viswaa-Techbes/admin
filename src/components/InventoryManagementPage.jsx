"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, ActionBtn, useToast } from "./UI";
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from "./Icons";
import { apiFetch } from "../lib/apiClient";

const INPUT_STYLE = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  width: "100%",
  outline: "none",
  background: "#ffffff",
  color: "#1e293b",
};

const LABEL_STYLE = {
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  display: "block",
  marginBottom: 6,
};

const TH_STYLE = {
  padding: "14px 18px",
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  letterSpacing: ".05em",
  textTransform: "uppercase",
};

const TD_STYLE = {
  padding: "14px 18px",
  fontSize: 13,
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
};

const GST_RATES = [0, 5, 12, 18, 28];
const CATEGORIES = ["All", "CCTV", "Networking", "General", "Accessories"];

export function InventoryManagementPage() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "CCTV",
    subcategory: "",
    modelNumber: "",
    sku: "",
    variant: "",
    specifications: "",
    basePrice: 0,
    gstRate: 18,
    isTaxInclusive: false,
    stock: 10,
    minStock: 2,
    unit: "each",
    image: "",
    description: "",
    status: "active",
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/v2/admin/inventory/products");
      if (res.payload?.success && Array.isArray(res.payload.data)) {
        setProducts(res.payload.data);
      } else {
        // Fallback to /api/v2/inventory/products
        const fallbackRes = await apiFetch("/api/v2/inventory/products");
        if (fallbackRes.payload?.data) {
          setProducts(fallbackRes.payload.data);
        }
      }
    } catch (err) {
      console.error("Failed to load inventory products:", err.message);
      toast?.show("Failed to load inventory products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.modelNumber && p.modelNumber.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.variant && p.variant.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === "All" ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchStatus =
        selectedStatus === "all" || p.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, selectedCategory, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "active").length;
    const inactive = products.filter((p) => p.status === "inactive").length;
    const lowStock = products.filter(
      (p) => (p.stock || 0) <= (p.minStock || 2) && p.status === "active"
    ).length;
    return { total, active, inactive, lowStock };
  }, [products]);

  // Open Add Modal
  const handleAddNew = () => {
    setIsEditing(false);
    setForm({
      name: "",
      brand: "",
      category: "CCTV",
      subcategory: "",
      modelNumber: "",
      sku: "",
      variant: "",
      specifications: "",
      basePrice: 0,
      gstRate: 18,
      isTaxInclusive: false,
      stock: 10,
      minStock: 2,
      unit: "each",
      image: "",
      description: "",
      status: "active",
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEdit = (p) => {
    setIsEditing(true);
    setForm({
      _id: p._id,
      name: p.name || "",
      brand: p.brand || "",
      category: p.category || "CCTV",
      subcategory: p.subcategory || "",
      modelNumber: p.modelNumber || "",
      sku: p.sku || "",
      variant: p.variant || "",
      specifications: p.specifications || "",
      basePrice: p.basePrice ?? p.price ?? 0,
      gstRate: p.gstRate ?? 18,
      isTaxInclusive: Boolean(p.isTaxInclusive),
      stock: p.stock ?? 0,
      minStock: p.minStock ?? 0,
      unit: p.unit || "each",
      image: p.image || "",
      description: p.description || "",
      status: p.status || "active",
    });
    setShowModal(true);
  };

  // Submit Add / Edit
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast?.show("Product name is required", "error");
      return;
    }
    if (form.basePrice < 0) {
      toast?.show("Base price cannot be negative", "error");
      return;
    }

    setSaving(true);
    try {
      const endpoint = isEditing
        ? `/api/v2/admin/inventory/products/${form._id}`
        : "/api/v2/admin/inventory/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await apiFetch(endpoint, {
        method,
        body: form,
      });

      if (res.payload?.success) {
        toast?.show(
          isEditing ? "Product updated successfully" : "Product added to inventory",
          "success"
        );
        setShowModal(false);
        loadProducts();
      } else {
        toast?.show(res.payload?.message || "Failed to save product", "error");
      }
    } catch (err) {
      toast?.show(err.message || "An error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  // Safe Deactivate / Reactivate Toggle
  const handleToggleStatus = async (p) => {
    try {
      const res = await apiFetch(`/api/v2/admin/inventory/products/${p._id}/status`, {
        method: "PATCH",
      });
      if (res.payload?.success) {
        toast?.show(
          `Product marked as ${res.payload.data?.status || "updated"}`,
          "success"
        );
        loadProducts();
      } else {
        toast?.show("Failed to update product status", "error");
      }
    } catch (err) {
      toast?.show(err.message, "error");
    }
  };

  // Soft Delete / Deactivate
  const handleSoftDelete = async (p) => {
    if (!confirm(`Are you sure you want to deactivate "${p.name}"? It will be safely hidden from new customer searches.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/v2/admin/inventory/products/${p._id}`, {
        method: "DELETE",
      });
      if (res.payload?.success) {
        toast?.show("Product deactivated safely", "success");
        loadProducts();
      } else {
        toast?.show("Failed to deactivate product", "error");
      }
    } catch (err) {
      toast?.show(err.message, "error");
    }
  };

  // Live tax calculation preview for modal
  const modalCalculations = useMemo(() => {
    const base = Math.max(0, Number(form.basePrice) || 0);
    const rate = Math.max(0, Number(form.gstRate) || 0);
    let taxable = base;
    let gstAmt = 0;
    let total = 0;

    if (form.isTaxInclusive) {
      total = base;
      taxable = Math.round((total / (1 + rate / 100)) * 100) / 100;
      gstAmt = Math.round((total - taxable) * 100) / 100;
    } else {
      taxable = base;
      gstAmt = Math.round(((taxable * rate) / 100) * 100) / 100;
      total = Math.round((taxable + gstAmt) * 100) / 100;
    }

    return { taxable, gstAmt, total };
  }, [form.basePrice, form.gstRate, form.isTaxInclusive]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="Inventory Management"
        subtitle="Manage hardware products, base pricing, GST tax rates, stock, and live customer search suggestions"
        actions={
          <ActionBtn
            icon={<PlusIcon />}
            label="Add Product"
            primary
            onClick={handleAddNew}
          />
        }
      />

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Total Catalog Products
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {stats.total}
          </div>
        </Card>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>
            Active / Searchable
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
            {stats.active}
          </div>
        </Card>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Inactive / Deactivated
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#475569", marginTop: 4 }}>
            {stats.inactive}
          </div>
        </Card>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ea580c", textTransform: "uppercase" }}>
            Low Stock Alerts
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ea580c", marginTop: 4 }}>
            {stats.lowStock}
          </div>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
          {/* Search box */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: "8px 14px", flex: "1 1 280px", maxWidth: 420 }}>
            <SearchIcon style={{ width: 16, height: 16, color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search by name, brand, model, SKU, variant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%", color: "#1e293b" }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: selectedCategory === cat ? "#6366f1" : "#f1f5f9",
                  color: selectedCategory === cat ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
                background: "#ffffff",
                outline: "none",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Product & Brand</th>
                <th style={TH_STYLE}>Category</th>
                <th style={TH_STYLE}>Model / SKU</th>
                <th style={TH_STYLE}>Variant / Resolution</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Base Price (₹)</th>
                <th style={{ ...TH_STYLE, textAlign: "center" }}>GST Rate</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Total (₹)</th>
                <th style={{ ...TH_STYLE, textAlign: "center" }}>Stock</th>
                <th style={{ ...TH_STYLE, textAlign: "center" }}>Status</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                    Loading inventory products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const base = p.basePrice ?? p.price ?? 0;
                  const rate = p.gstRate ?? 18;
                  const isInc = Boolean(p.isTaxInclusive);
                  const total = isInc
                    ? base
                    : Math.round((base + (base * rate) / 100) * 100) / 100;
                  const isActive = p.status === "active";

                  return (
                    <tr key={p._id} style={{ transition: "background 0.15s ease" }}>
                      <td style={TD_STYLE}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>
                            {p.name}
                          </span>
                          {p.brand && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: ".3px" }}>
                              {p.brand}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <span style={{ padding: "3px 8px", borderRadius: 6, background: "#f1f5f9", fontSize: 11, fontWeight: 600, color: "#475569" }}>
                          {p.category || "General"}
                        </span>
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontSize: 12, color: "#475569" }}>
                          {p.modelNumber && <div><strong style={{ color: "#64748b" }}>Mod:</strong> {p.modelNumber}</div>}
                          {p.sku && <div><strong style={{ color: "#64748b" }}>SKU:</strong> {p.sku}</div>}
                          {!p.modelNumber && !p.sku && <span style={{ color: "#94a3b8" }}>—</span>}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        {p.variant ? (
                          <span style={{ padding: "3px 8px", borderRadius: 6, background: "#e0e7ff", color: "#3730a3", fontSize: 11, fontWeight: 700 }}>
                            {p.variant}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>Standard</span>
                        )}
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                        ₹{base.toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 99, background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700 }}>
                          {rate}% {isInc ? "Incl." : ""}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                        ₹{total.toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: (p.stock || 0) <= (p.minStock || 2) ? "#ea580c" : "#16a34a"
                        }}>
                          {p.stock ?? 0} {p.unit || "each"}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          title="Click to toggle availability"
                          style={{
                            padding: "4px 10px",
                            borderRadius: 99,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                            background: isActive ? "#dcfce7" : "#f1f5f9",
                            color: isActive ? "#15803d" : "#64748b",
                          }}
                        >
                          {isActive ? "● Active" : "○ Inactive"}
                        </button>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            title="Edit Product"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              cursor: "pointer",
                            }}
                          >
                            <EditIcon style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSoftDelete(p)}
                            title="Deactivate Product Safely"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid #fecaca",
                              background: "#fff1f2",
                              color: "#e11d48",
                              cursor: "pointer",
                            }}
                          >
                            <TrashIcon style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 20,
            maxWidth: 680,
            width: "100%",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0",
            padding: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #f1f5f9", pb: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  {isEditing ? "Edit Inventory Product" : "Add New Inventory Product"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                  Configure product specifications, base pricing, GST tax rate, and availability
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Product Name & Brand */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CP Plus 2MP Full HD Dome Camera"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. CP Plus"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Category, Subcategory, Unit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={INPUT_STYLE}
                  >
                    <option value="CCTV">CCTV</option>
                    <option value="Networking">Networking</option>
                    <option value="General">General</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. IP Cameras, Routers"
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. each, meter, roll"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Model Number, SKU, Variant */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>Model Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CP-UNC-DA21L2"
                    value={form.modelNumber}
                    onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. CPP-2MP-01"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Variant / Spec</label>
                  <input
                    type="text"
                    placeholder="e.g. 2MP, 4MP, 8-Port"
                    value={form.variant}
                    onChange={(e) => setForm({ ...form, variant: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Base Price, GST Rate, Tax Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>Base Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Applicable GST Rate</label>
                  <select
                    value={form.gstRate}
                    onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                    style={INPUT_STYLE}
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}% GST
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Tax Configuration</label>
                  <select
                    value={form.isTaxInclusive ? "inclusive" : "exclusive"}
                    onChange={(e) =>
                      setForm({ ...form, isTaxInclusive: e.target.value === "inclusive" })
                    }
                    style={INPUT_STYLE}
                  >
                    <option value="exclusive">Exclusive (Price + GST)</option>
                    <option value="inclusive">Inclusive (GST included)</option>
                  </select>
                </div>
              </div>

              {/* Live Tax Breakdown Card */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "12px 16px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                textAlign: "center",
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>TAXABLE AMOUNT</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>
                    ₹{modalCalculations.taxable.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>
                    GST ({form.gstRate}%)
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#b45309", marginTop: 2 }}>
                    ₹{modalCalculations.gstAmt.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>TOTAL UNIT PRICE</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#15803d", marginTop: 2 }}>
                    ₹{modalCalculations.total.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Stock, Min Stock, Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>Stock Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Low Stock Alert At</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Availability Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={INPUT_STYLE}
                  >
                    <option value="active">Active (Available)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={LABEL_STYLE}>Product Description / Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Key technical specifications, warranty, or features..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ ...INPUT_STYLE, resize: "vertical" }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "9px 22px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
