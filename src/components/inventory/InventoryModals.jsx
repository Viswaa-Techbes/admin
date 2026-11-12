"use client";

import React, { useState } from "react";
import { Modal } from "../UI";
import {
  INPUT_STYLE,
  LABEL_STYLE,
  GST_RATES,
  UNIT_OPTIONS,
  ITEM_TYPE_OPTIONS,
  CHARGE_TYPE_OPTIONS,
  PRICING_UNIT_OPTIONS,
  STOCK_TX_LABELS,
  getBtnStyle,
  formatCurrency,
  formatDateTime,
  getStockBadge,
} from "./inventoryStyles";

export function InventoryItemModal({
  open,
  onClose,
  initialItem,
  categories,
  saving,
  onSubmit,
}) {
  const isEditing = Boolean(initialItem?._id);
  const [form, setForm] = useState(() =>
    initialItem
      ? {
          name: initialItem.name || "",
          sku: initialItem.sku || "",
          category: initialItem.category || "CCTV",
          subcategory: initialItem.subcategory || "",
          itemType: initialItem.itemType || "product",
          brand: initialItem.brand || "",
          modelNumber: initialItem.modelNumber || "",
          variant: initialItem.variant || "",
          unit: initialItem.unit || "Piece",
          purchasePrice: initialItem.purchasePrice ?? 0,
          sellingPrice: initialItem.sellingPrice ?? initialItem.basePrice ?? initialItem.price ?? 0,
          gstRate: initialItem.gstRate ?? 18,
          isTaxInclusive: Boolean(initialItem.isTaxInclusive),
          hsnSacCode: initialItem.hsnSacCode || "",
          stock: initialItem.stock ?? 0,
          minStock: initialItem.minStock ?? 0,
          stockReason: "",
          supplier: initialItem.supplier || "",
          warrantyMonths: initialItem.warrantyMonths ?? 0,
          compatibleCategories: Array.isArray(initialItem.compatibleCategories)
            ? initialItem.compatibleCategories.join(", ")
            : "",
          compatibleSkus: Array.isArray(initialItem.compatibleSkus)
            ? initialItem.compatibleSkus.join(", ")
            : "",
          specifications: initialItem.specifications || "",
          description: initialItem.description || "",
          status: initialItem.status || "active",
        }
      : {
          name: "",
          sku: "",
          category: "CCTV",
          subcategory: "",
          itemType: "product",
          brand: "",
          modelNumber: "",
          variant: "",
          unit: "Piece",
          purchasePrice: 0,
          sellingPrice: 0,
          gstRate: 18,
          isTaxInclusive: false,
          hsnSacCode: "",
          stock: 0,
          minStock: 5,
          stockReason: "Initial stock on item creation",
          supplier: "",
          warrantyMonths: 0,
          compatibleCategories: "",
          compatibleSkus: "",
          specifications: "",
          description: "",
          status: "active",
        }
  );

  if (!open) return null;

  const stockChangedInEdit =
    isEditing && Number(form.stock) !== Number(initialItem?.stock ?? 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      _id: initialItem?._id,
      purchasePrice: Number(form.purchasePrice || 0),
      sellingPrice: Number(form.sellingPrice || 0),
      basePrice: Number(form.sellingPrice || 0),
      price: Number(form.sellingPrice || 0),
      gstRate: Number(form.gstRate || 0),
      stock: Number(form.stock || 0),
      minStock: Number(form.minStock || 0),
      warrantyMonths: Number(form.warrantyMonths || 0),
      compatibleCategories: form.compatibleCategories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      compatibleSkus: form.compatibleSkus
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Inventory Item: ${initialItem.name}` : "Add New Inventory Item"}
      width={760}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Item Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Hikvision 2MP Dome Camera"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>SKU / Item Code</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
              placeholder="e.g. HIK-2MP-DOME"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Item Type</label>
            <select
              value={form.itemType}
              onChange={(e) => setForm((p) => ({ ...p, itemType: e.target.value }))}
              style={INPUT_STYLE}
            >
              {ITEM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Service Category *</label>
            <input
              list="inventory-service-categories"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              style={INPUT_STYLE}
              required
            />
            <datalist id="inventory-service-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label style={LABEL_STYLE}>Subcategory</label>
            <input
              type="text"
              value={form.subcategory}
              onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
              placeholder="e.g. IP Cameras"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
              placeholder="e.g. Hikvision, D-Link"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Model Number</label>
            <input
              type="text"
              value={form.modelNumber}
              onChange={(e) => setForm((p) => ({ ...p, modelNumber: e.target.value }))}
              placeholder="e.g. DS-2CD1123G0"
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Purchase Price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.purchasePrice}
              onChange={(e) => setForm((p) => ({ ...p, purchasePrice: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Selling Price (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.sellingPrice}
              onChange={(e) => setForm((p) => ({ ...p, sellingPrice: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Unit *</label>
            <input
              list="inventory-units-list"
              value={form.unit}
              onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
              style={INPUT_STYLE}
              required
            />
            <datalist id="inventory-units-list">
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div>
            <label style={LABEL_STYLE}>GST %</label>
            <select
              value={form.gstRate}
              onChange={(e) => setForm((p) => ({ ...p, gstRate: Number(e.target.value) }))}
              style={INPUT_STYLE}
            >
              {GST_RATES.map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Available Stock</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Minimum Stock Level</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.minStock}
              onChange={(e) => setForm((p) => ({ ...p, minStock: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Variant</label>
            <input
              type="text"
              value={form.variant}
              onChange={(e) => setForm((p) => ({ ...p, variant: e.target.value }))}
              placeholder="e.g. 2MP / 305m Roll"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              style={INPUT_STYLE}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {stockChangedInEdit && (
          <div style={{ background: "#fffbeb", padding: 10, borderRadius: 10, border: "1px solid #fde68a" }}>
            <label style={{ ...LABEL_STYLE, color: "#92400e" }}>
              Stock Change Reason (Logged to Movement History)
            </label>
            <input
              type="text"
              value={form.stockReason}
              onChange={(e) => setForm((p) => ({ ...p, stockReason: e.target.value }))}
              placeholder="Reason for stock quantity modification..."
              style={INPUT_STYLE}
            />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>HSN / SAC Code</label>
            <input
              type="text"
              value={form.hsnSacCode}
              onChange={(e) => setForm((p) => ({ ...p, hsnSacCode: e.target.value }))}
              placeholder="e.g. 852580"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Supplier / Vendor</label>
            <input
              type="text"
              value={form.supplier}
              onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
              placeholder="Vendor name"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Warranty (Months)</label>
            <input
              type="number"
              min="0"
              value={form.warrantyMonths}
              onChange={(e) => setForm((p) => ({ ...p, warrantyMonths: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Compatible Service Categories (comma-separated)</label>
            <input
              type="text"
              value={form.compatibleCategories}
              onChange={(e) => setForm((p) => ({ ...p, compatibleCategories: e.target.value }))}
              placeholder="CCTV, Networking"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Compatible SKUs (comma-separated)</label>
            <input
              type="text"
              value={form.compatibleSkus}
              onChange={(e) => setForm((p) => ({ ...p, compatibleSkus: e.target.value }))}
              placeholder="CAT6-R1, BNC-PACK"
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Technical Specifications</label>
          <input
            type="text"
            value={form.specifications}
            onChange={(e) => setForm((p) => ({ ...p, specifications: e.target.value }))}
            placeholder="e.g. 1080p Full HD, IR 30m, IP67 Weatherproof, PoE"
            style={INPUT_STYLE}
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Description / Internal Notes</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            style={INPUT_STYLE}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569" }}>
          <input
            type="checkbox"
            checked={form.isTaxInclusive}
            onChange={(e) => setForm((p) => ({ ...p, isTaxInclusive: e.target.checked }))}
          />
          Selling Price is inclusive of GST
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8 }}>
          <button type="button" onClick={onClose} style={getBtnStyle("secondary")}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={getBtnStyle("primary", saving)}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function StockAdjustmentModal({
  open,
  onClose,
  selectedItem,
  items,
  defaultType = "addition",
  saving,
  onSubmit,
}) {
  const [itemId, setItemId] = useState(() => selectedItem?._id || items?.[0]?._id || "");
  const [transactionType, setTransactionType] = useState(() => defaultType || "addition");
  const [quantity, setQuantity] = useState(1);
  const [newQuantity, setNewQuantity] = useState(
    () => selectedItem?.stock ?? items?.[0]?.stock ?? 0
  );
  const [reason, setReason] = useState("");
  const [referenceType, setReferenceType] = useState("manual");
  const [referenceId, setReferenceId] = useState("");

  if (!open) return null;

  const activeItem =
    (selectedItem && selectedItem._id === itemId ? selectedItem : null) ||
    (items || []).find((i) => i._id === itemId) ||
    null;

  const isTargetMode = ["adjustment", "correction"].includes(transactionType);
  const currentStock = Number(activeItem?.stock || 0);
  const previewNextStock = isTargetMode
    ? Number(newQuantity || 0)
    : ["reduction", "quote_allocation", "job_allocation"].includes(transactionType)
    ? currentStock - Number(quantity || 0)
    : currentStock + Number(quantity || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeItem) return;
    onSubmit(activeItem._id, {
      transactionType,
      ...(isTargetMode ? { newQuantity: Number(newQuantity) } : { quantity: Number(quantity) }),
      reason,
      referenceType,
      referenceId,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Adjust Inventory Stock" width={540}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={LABEL_STYLE}>Inventory Item *</label>
          <select
            required
            value={itemId}
            onChange={(e) => {
              const id = e.target.value;
              setItemId(id);
              const found = (items || []).find((i) => i._id === id);
              if (found) setNewQuantity(found.stock ?? 0);
            }}
            style={INPUT_STYLE}
          >
            <option value="">Select item...</option>
            {(items || []).map((it) => (
              <option key={it._id} value={it._id}>
                {it.name} ({it.sku || "No SKU"}) — Current: {it.stock} {it.unit}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Transaction Type *</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="addition">Stock Addition (+)</option>
              <option value="reduction">Authorized Reduction (-)</option>
              <option value="adjustment">Exact Stock Count (=)</option>
              <option value="return">Customer / Tech Return (+)</option>
              <option value="correction">Audit Correction (=)</option>
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>
              {isTargetMode ? `New Stock Quantity (${activeItem?.unit || "Units"}) *` : `Quantity (${activeItem?.unit || "Units"}) *`}
            </label>
            {isTargetMode ? (
              <input
                type="number"
                min="0"
                required
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                style={INPUT_STYLE}
              />
            ) : (
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={INPUT_STYLE}
              />
            )}
          </div>
        </div>

        {activeItem && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: previewNextStock < 0 ? "#fef2f2" : "#f8fafc",
              border: `1px solid ${previewNextStock < 0 ? "#fecaca" : "#e2e8f0"}`,
              fontSize: 13,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              Current: <strong>{currentStock}</strong> {activeItem.unit}
            </span>
            <span>
              Resulting Stock:{" "}
              <strong style={{ color: previewNextStock < 0 ? "#dc2626" : "#0f172a" }}>
                {previewNextStock} {activeItem.unit}
              </strong>
            </span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Reference Source</label>
            <select
              value={referenceType}
              onChange={(e) => setReferenceType(e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="manual">Manual Admin Entry</option>
              <option value="purchase_order">Purchase Order</option>
              <option value="job">Service Job</option>
              <option value="quotation">Quotation</option>
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Reference ID (Optional)</label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. PO-102 / QT-2026-0001"
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Reason for Stock Change *</label>
          <textarea
            rows={2}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Received supplier shipment, damaged unit write-off, physical audit count..."
            style={INPUT_STYLE}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} style={getBtnStyle("secondary")}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || previewNextStock < 0}
            style={getBtnStyle("primary", saving || previewNextStock < 0)}
          >
            {saving ? "Updating..." : "Record Stock Update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function PricingRuleModal({ open, onClose, initialRule, categories, saving, onSubmit }) {
  const isEditing = Boolean(initialRule?._id);
  const [form, setForm] = useState(() =>
    initialRule
      ? {
          name: initialRule.name || "",
          code: initialRule.code || "",
          serviceCategory: initialRule.serviceCategory || "CCTV",
          subcategory: initialRule.subcategory || "",
          chargeType: initialRule.chargeType || "service",
          pricingUnit: initialRule.pricingUnit || "flat",
          unitLabel: initialRule.unitLabel || "Unit",
          rate: initialRule.rate ?? 0,
          costRate: initialRule.costRate ?? 0,
          minCharge: initialRule.minCharge ?? 0,
          gstRate: initialRule.gstRate ?? 18,
          isTaxInclusive: Boolean(initialRule.isTaxInclusive),
          hsnSacCode: initialRule.hsnSacCode || "",
          allowQuoteOverride: initialRule.allowQuoteOverride !== false,
          maxDiscountPercent: initialRule.maxDiscountPercent ?? 25,
          description: initialRule.description || "",
          status: initialRule.status || "active",
        }
      : {
          name: "",
          code: "",
          serviceCategory: "CCTV",
          subcategory: "",
          chargeType: "installation",
          pricingUnit: "per_camera",
          unitLabel: "Per Camera",
          rate: 0,
          costRate: 0,
          minCharge: 0,
          gstRate: 18,
          isTaxInclusive: false,
          hsnSacCode: "",
          allowQuoteOverride: true,
          maxDiscountPercent: 25,
          description: "",
          status: "active",
        }
  );

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      _id: initialRule?._id,
      rate: Number(form.rate || 0),
      costRate: Number(form.costRate || 0),
      minCharge: Number(form.minCharge || 0),
      gstRate: Number(form.gstRate || 0),
      maxDiscountPercent: Number(form.maxDiscountPercent || 0),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Pricing Rule: ${initialRule.name}` : "Add Dynamic Pricing Rule"}
      width={660}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Pricing Rule Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Installation - Per Camera / Networking - Per Point"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Rule Code (Optional)</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. CCTV-INST-CAM"
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Service Category *</label>
            <input
              list="pricing-rule-cats"
              required
              value={form.serviceCategory}
              onChange={(e) => setForm((p) => ({ ...p, serviceCategory: e.target.value }))}
              style={INPUT_STYLE}
            />
            <datalist id="pricing-rule-cats">
              {["Global", ...categories].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label style={LABEL_STYLE}>Charge Type *</label>
            <select
              value={form.chargeType}
              onChange={(e) => setForm((p) => ({ ...p, chargeType: e.target.value }))}
              style={INPUT_STYLE}
            >
              {CHARGE_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Pricing Basis</label>
            <select
              value={form.pricingUnit}
              onChange={(e) => {
                const val = e.target.value;
                const matched = PRICING_UNIT_OPTIONS.find((u) => u.value === val);
                setForm((p) => ({
                  ...p,
                  pricingUnit: val,
                  unitLabel: matched ? matched.label : p.unitLabel,
                }));
              }}
              style={INPUT_STYLE}
            >
              {PRICING_UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Rate (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.rate}
              onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Internal Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costRate}
              onChange={(e) => setForm((p) => ({ ...p, costRate: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Minimum Charge (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minCharge}
              onChange={(e) => setForm((p) => ({ ...p, minCharge: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>GST %</label>
            <select
              value={form.gstRate}
              onChange={(e) => setForm((p) => ({ ...p, gstRate: Number(e.target.value) }))}
              style={INPUT_STYLE}
            >
              {GST_RATES.map((g) => (
                <option key={g} value={g}>
                  {g}%
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Unit Label</label>
            <input
              type="text"
              value={form.unitLabel}
              onChange={(e) => setForm((p) => ({ ...p, unitLabel: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Max Quote Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.maxDiscountPercent}
              onChange={(e) => setForm((p) => ({ ...p, maxDiscountPercent: e.target.value }))}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              style={INPUT_STYLE}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569" }}>
          <input
            type="checkbox"
            checked={form.allowQuoteOverride}
            onChange={(e) => setForm((p) => ({ ...p, allowQuoteOverride: e.target.checked }))}
          />
          Allow admin quotation price override for this rule
        </label>

        <div>
          <label style={LABEL_STYLE}>Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            style={INPUT_STYLE}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} style={getBtnStyle("secondary")}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={getBtnStyle("primary", saving)}>
            {saving ? "Saving..." : isEditing ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ItemDetailModal({
  open,
  onClose,
  details,
  loading,
  onEdit,
  onAdjustStock,
  onDeleteOrArchive,
}) {
  if (!open) return null;
  const item = details?.item;
  const transactions = details?.transactions || [];
  const refs = details?.references || {};
  const badge = getStockBadge(item);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `${item.name} (${item.sku || "No SKU"})` : "Inventory Item Details"}
      width={720}
    >
      {loading || !item ? (
        <div style={{ padding: 36, textAlign: "center", color: "#64748b" }}>
          Loading item specifications & audit history...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#eef2ff", color: "#4338ca" }}>
                {item.category} {item.subcategory ? `• ${item.subcategory}` : ""}
              </span>
              <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>
                {badge.label} ({item.stock} {item.unit})
              </span>
              <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: item.status === "active" ? "#dcfce7" : "#fee2e2", color: item.status === "active" ? "#15803d" : "#b91c1c" }}>
                {item.isArchived ? "Archived" : item.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => onAdjustStock(item)} style={{ ...getBtnStyle("secondary"), padding: "5px 12px", fontSize: 12 }}>
                Adjust Stock
              </button>
              <button type="button" onClick={() => onEdit(item)} style={{ ...getBtnStyle("secondary"), padding: "5px 12px", fontSize: 12 }}>
                Edit
              </button>
              <button type="button" onClick={() => onDeleteOrArchive(item)} style={{ ...getBtnStyle("danger"), padding: "5px 12px", fontSize: 12 }}>
                {refs.safeToDelete ? "Delete" : "Archive"}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
              background: "#f8fafc",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Purchase Price</div>
              <div style={{ fontWeight: 700 }}>{formatCurrency(item.purchasePrice)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Selling Price</div>
              <div style={{ fontWeight: 800, color: "#4f46e5" }}>{formatCurrency(item.sellingPrice)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>GST / HSN</div>
              <div style={{ fontWeight: 700 }}>
                {item.gstRate}% {item.isTaxInclusive ? "(Incl.)" : "(Excl.)"} {item.hsnSacCode ? `• ${item.hsnSacCode}` : ""}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Stock Threshold</div>
              <div style={{ fontWeight: 700 }}>Min {item.minStock || 0} {item.unit}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><strong>Brand / Model:</strong> {[item.brand, item.modelNumber, item.variant].filter(Boolean).join(" • ") || "—"}</div>
            <div><strong>Supplier / Warranty:</strong> {item.supplier || "—"} {item.warrantyMonths ? `• ${item.warrantyMonths} mo` : ""}</div>
            <div style={{ gridColumn: "1 / -1" }}><strong>Specifications:</strong> {item.specifications || "—"}</div>
            <div style={{ gridColumn: "1 / -1" }}><strong>Description:</strong> {item.description || "—"}</div>
            <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#64748b" }}>
              References: {refs.quoteCount || 0} quote(s), {refs.jobCount || 0} job(s) •{" "}
              {refs.safeToDelete ? "Eligible for safe permanent delete" : "Protected: archive/deactivate recommended"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Recent Stock Movements</div>
            {transactions.length === 0 ? (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>No stock movement history recorded yet.</div>
            ) : (
              <div style={{ maxHeight: 190, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                {transactions.map((tx) => {
                  const meta = STOCK_TX_LABELS[tx.transactionType] || { label: tx.transactionType, bg: "#f1f5f9", color: "#475569" };
                  return (
                    <div
                      key={tx._id}
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: meta.bg, color: meta.color, marginRight: 6 }}>
                          {meta.label}
                        </span>
                        <strong>{tx.previousQuantity} → {tx.updatedQuantity}</strong> • {tx.reason}
                      </div>
                      <div style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                        {tx.performedByName} • {formatDateTime(tx.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export function DeleteArchiveModal({ open, onClose, item, saving, onConfirm }) {
  if (!open || !item) return null;
  const hasStock = Number(item.stock || 0) > 0;
  return (
    <Modal open={open} onClose={onClose} title="Archive or Delete Inventory Item" width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13, color: "#334155" }}>
        <p style={{ margin: 0 }}>
          Choose how to remove <strong>{item.name}</strong> ({item.sku || "No SKU"}):
        </p>
        <div style={{ padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12 }}>
          <strong>Recommended:</strong> Safe Archive deactivates the item and preserves quotation, job, and stock movement history.
          {hasStock && (
            <div style={{ color: "#b45309", marginTop: 6, fontWeight: 600 }}>
              Note: Item currently has {item.stock} {item.unit} in stock; permanent delete is blocked until stock is 0 and no quotes/jobs reference it.
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} style={getBtnStyle("secondary")}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onConfirm(item._id, "archive")}
            style={getBtnStyle("secondary", saving)}
          >
            Archive / Deactivate
          </button>
          <button
            type="button"
            disabled={saving || hasStock}
            onClick={() => onConfirm(item._id, "auto")}
            style={getBtnStyle("danger", saving || hasStock)}
          >
            {saving ? "Processing..." : "Safe Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
