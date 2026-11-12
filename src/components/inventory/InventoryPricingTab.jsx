"use client";

import React, { useState } from "react";
import { Card } from "../UI";
import { PlusIcon, EditIcon, TrashIcon } from "../Icons";
import { apiFetch } from "../../lib/apiClient";
import {
  INPUT_STYLE,
  LABEL_STYLE,
  TH_STYLE,
  TD_STYLE,
  CHARGE_TYPE_OPTIONS,
  PRICING_UNIT_OPTIONS,
  GST_RATES,
  getBtnStyle,
  formatCurrency,
  formatDateTime,
} from "./inventoryStyles";

export default function InventoryPricingTab({
  items,
  pricingRules,
  categories,
  loadingRules,
  onOpenRuleModal,
  onDeleteRule,
  onRefreshAll,
  addToast,
}) {
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState("all");
  const [ruleTypeFilter, setRuleTypeFilter] = useState("all");

  // Quick inline pricing editor state for Inventory Items
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [priceDraft, setPriceDraft] = useState({
    purchasePrice: "",
    sellingPrice: "",
    gstRate: 18,
    isTaxInclusive: false,
    hsnSacCode: "",
  });
  const [savingPrice, setSavingPrice] = useState(false);

  // Live Backend Quotation Simulator state
  const [simCategory, setSimCategory] = useState("CCTV");
  const [simItemRows, setSimItemRows] = useState([{ productId: "", quantity: 1, unitPriceOverride: "" }]);
  const [simRuleIds, setSimRuleIds] = useState([]);
  const [simCharges, setSimCharges] = useState({
    labourCharge: 0,
    serviceCharge: 0,
    accessoriesCharge: 0,
    miscCharge: 0,
  });
  const [simDiscount, setSimDiscount] = useState(0);
  const [simAllowOverride, setSimAllowOverride] = useState(true);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const filteredRules = (pricingRules || []).filter((r) => {
    if (
      ruleCategoryFilter !== "all" &&
      String(r.serviceCategory || "").toLowerCase() !== ruleCategoryFilter.toLowerCase()
    ) {
      return false;
    }
    if (ruleTypeFilter !== "all" && r.chargeType !== ruleTypeFilter) {
      return false;
    }
    return true;
  });

  const startPriceEdit = (item) => {
    setEditingPriceId(item._id);
    setPriceDraft({
      purchasePrice: item.purchasePrice ?? 0,
      sellingPrice: item.sellingPrice ?? item.price ?? 0,
      gstRate: item.gstRate ?? 18,
      isTaxInclusive: Boolean(item.isTaxInclusive),
      hsnSacCode: item.hsnSacCode || "",
    });
  };

  const saveQuickPricing = async (itemId) => {
    const sell = Number(priceDraft.sellingPrice);
    const buy = Number(priceDraft.purchasePrice);
    if (!Number.isFinite(sell) || sell < 0 || !Number.isFinite(buy) || buy < 0) {
      addToast("Purchase and selling prices must be non-negative numbers.", "error");
      return;
    }
    setSavingPrice(true);
    try {
      await apiFetch(`/api/v2/admin/inventory/products/${itemId}/pricing`, {
        method: "PATCH",
        body: {
          purchasePrice: buy,
          sellingPrice: sell,
          gstRate: Number(priceDraft.gstRate),
          isTaxInclusive: Boolean(priceDraft.isTaxInclusive),
          hsnSacCode: priceDraft.hsnSacCode,
          reason: "Quick dynamic pricing update from Pricing Manager",
        },
      });
      addToast("Pricing updated successfully", "success");
      setEditingPriceId(null);
      onRefreshAll();
    } catch (err) {
      addToast(err.message || "Error saving pricing", "error");
    } finally {
      setSavingPrice(false);
    }
  };

  const runBackendQuoteCalculation = async () => {
    const validItems = simItemRows
      .filter((r) => r.productId)
      .map((r) => ({
        productId: r.productId,
        quantity: Number(r.quantity) || 1,
        ...(r.unitPriceOverride !== "" ? { unitPriceOverride: Number(r.unitPriceOverride) } : {}),
      }));

    if (validItems.length === 0 && simRuleIds.length === 0) {
      addToast("Select at least one inventory item or pricing rule to simulate.", "warning");
      return;
    }

    setSimulating(true);
    try {
      const { payload } = await apiFetch("/api/v2/admin/inventory/calculate-quote", {
        method: "POST",
        body: {
          serviceCategory: simCategory,
          items: validItems,
          appliedRules: simRuleIds.map((id) => ({ ruleId: id, quantity: 1 })),
          customCharges: {
            labourCharge: Number(simCharges.labourCharge) || 0,
            serviceCharge: Number(simCharges.serviceCharge) || 0,
            accessoriesCharge: Number(simCharges.accessoriesCharge) || 0,
            miscCharge: Number(simCharges.miscCharge) || 0,
          },
          discount: Number(simDiscount) || 0,
          allowPriceOverride: simAllowOverride,
        },
      });
      setSimResult(payload.data);
    } catch (err) {
      addToast(err.message || "Failed to calculate quote pricing", "error");
    } finally {
      setSimulating(false);
    }
  };

  const toggleRuleInSim = (ruleId) => {
    setSimRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Section 1: Dynamic Pricing Rules (Labour, Installation, Service, Accessories, Misc, GST) */}
      <Card>
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Dynamic Service & Charge Pricing Rules
            </h3>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Configure labour, installation, service visit, accessory, miscellaneous, and category GST rules without modifying source code.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={ruleCategoryFilter}
              onChange={(e) => setRuleCategoryFilter(e.target.value)}
              style={{ ...INPUT_STYLE, width: 160 }}
            >
              <option value="all">All Categories</option>
              {["Global", ...categories].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={ruleTypeFilter}
              onChange={(e) => setRuleTypeFilter(e.target.value)}
              style={{ ...INPUT_STYLE, width: 175 }}
            >
              <option value="all">All Charge Types</option>
              {CHARGE_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => onOpenRuleModal(null)} style={getBtnStyle("primary")}>
              <PlusIcon /> Add Pricing Rule
            </button>
          </div>
        </div>

        {loadingRules ? (
          <div style={{ padding: 36, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            Loading dynamic pricing rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
              No dynamic pricing rules configured for this filter
            </div>
            <div style={{ fontSize: 12, marginBottom: 14 }}>
              Add labour, per-camera installation, per-meter cable labour, per-point networking, or service visit rules.
            </div>
            <button type="button" onClick={() => onOpenRuleModal(null)} style={getBtnStyle("primary")}>
              <PlusIcon /> Create Pricing Rule
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Rule Name & Code</th>
                  <th style={TH_STYLE}>Category & Type</th>
                  <th style={TH_STYLE}>Unit Mode</th>
                  <th style={TH_STYLE}>Rate / Cost</th>
                  <th style={TH_STYLE}>GST & Override</th>
                  <th style={TH_STYLE}>Status</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => {
                  const unitObj = PRICING_UNIT_OPTIONS.find((u) => u.value === rule.pricingUnit);
                  const typeObj = CHARGE_TYPE_OPTIONS.find((t) => t.value === rule.chargeType);
                  return (
                    <tr key={rule._id}>
                      <td style={TD_STYLE}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{rule.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {rule.code ? `${rule.code} • ` : ""}
                          Updated {formatDateTime(rule.lastPriceUpdatedAt || rule.updatedAt)}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontWeight: 600 }}>{rule.serviceCategory}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {typeObj?.label || rule.chargeType}
                          {rule.subcategory ? ` • ${rule.subcategory}` : ""}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontWeight: 600 }}>{rule.unitLabel || unitObj?.label}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{unitObj?.label}</div>
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontWeight: 700, color: "#4f46e5" }}>
                          {formatCurrency(rule.rate)}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Cost: {formatCurrency(rule.costRate || 0)}
                          {rule.minCharge > 0 ? ` • Min: ${formatCurrency(rule.minCharge)}` : ""}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <div>
                          {rule.gstRate}% {rule.isTaxInclusive ? "(Incl.)" : "(Excl.)"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Override: {rule.allowQuoteOverride ? "Allowed" : "Locked"} (Max{" "}
                          {rule.maxDiscountPercent ?? 0}% disc)
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            background: rule.status === "active" ? "#dcfce7" : "#fee2e2",
                            color: rule.status === "active" ? "#15803d" : "#b91c1c",
                          }}
                        >
                          {rule.status}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => onOpenRuleModal(rule)}
                            style={{ ...getBtnStyle("secondary"), padding: "5px 10px", fontSize: 12 }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRule(rule)}
                            style={{ ...getBtnStyle("danger"), padding: "5px 10px", fontSize: 12 }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Section 2: Quick Item Pricing Editor */}
      <Card>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            Material & Product Pricing Matrix
          </h3>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Quickly update purchase price, selling price, GST rate, and HSN/SAC code directly against inventory items.
          </div>
        </div>
        <div style={{ overflowX: "auto", maxHeight: 380 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Item</th>
                <th style={TH_STYLE}>Category / Unit</th>
                <th style={TH_STYLE}>Purchase Price</th>
                <th style={TH_STYLE}>Selling Price</th>
                <th style={TH_STYLE}>GST %</th>
                <th style={TH_STYLE}>HSN / SAC</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).slice(0, 50).map((item) => {
                const isEditing = editingPriceId === item._id;
                return (
                  <tr key={item._id}>
                    <td style={TD_STYLE}>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{item.sku || "No SKU"}</div>
                    </td>
                    <td style={TD_STYLE}>
                      {item.category} • {item.unit}
                    </td>
                    <td style={TD_STYLE}>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceDraft.purchasePrice}
                          onChange={(e) =>
                            setPriceDraft((p) => ({ ...p, purchasePrice: e.target.value }))
                          }
                          style={{ ...INPUT_STYLE, width: 105 }}
                        />
                      ) : (
                        formatCurrency(item.purchasePrice)
                      )}
                    </td>
                    <td style={TD_STYLE}>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceDraft.sellingPrice}
                          onChange={(e) =>
                            setPriceDraft((p) => ({ ...p, sellingPrice: e.target.value }))
                          }
                          style={{ ...INPUT_STYLE, width: 105 }}
                        />
                      ) : (
                        <span style={{ fontWeight: 700 }}>{formatCurrency(item.sellingPrice)}</span>
                      )}
                    </td>
                    <td style={TD_STYLE}>
                      {isEditing ? (
                        <select
                          value={priceDraft.gstRate}
                          onChange={(e) =>
                            setPriceDraft((p) => ({ ...p, gstRate: Number(e.target.value) }))
                          }
                          style={{ ...INPUT_STYLE, width: 85 }}
                        >
                          {GST_RATES.map((g) => (
                            <option key={g} value={g}>
                              {g}%
                            </option>
                          ))}
                        </select>
                      ) : (
                        `${item.gstRate}%`
                      )}
                    </td>
                    <td style={TD_STYLE}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={priceDraft.hsnSacCode}
                          onChange={(e) =>
                            setPriceDraft((p) => ({ ...p, hsnSacCode: e.target.value }))
                          }
                          placeholder="e.g. 8525"
                          style={{ ...INPUT_STYLE, width: 95 }}
                        />
                      ) : (
                        item.hsnSacCode || "—"
                      )}
                    </td>
                    <td style={{ ...TD_STYLE, textAlign: "right" }}>
                      {isEditing ? (
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            disabled={savingPrice}
                            onClick={() => saveQuickPricing(item._id)}
                            style={{ ...getBtnStyle("primary", savingPrice), padding: "5px 10px", fontSize: 12 }}
                          >
                            {savingPrice ? "..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceId(null)}
                            style={{ ...getBtnStyle("ghost"), padding: "5px 10px", fontSize: 12 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startPriceEdit(item)}
                          style={{ ...getBtnStyle("secondary"), padding: "5px 10px", fontSize: 12 }}
                        >
                          Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 3: Authoritative Backend Quote Pricing Calculator */}
      <Card style={{ padding: 18 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            Backend Dynamic Quotation Calculator
          </h3>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Test live quote pricing computed on the server from validated inventory prices, GST rules, dynamic charges, and optional admin overrides.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <label style={LABEL_STYLE}>Service Category</label>
            <select
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value)}
              style={INPUT_STYLE}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Inventory Line Items</label>
                <button
                  type="button"
                  onClick={() =>
                    setSimItemRows((prev) => [
                      ...prev,
                      { productId: "", quantity: 1, unitPriceOverride: "" },
                    ])
                  }
                  style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}
                >
                  + Add Row
                </button>
              </div>
              {simItemRows.map((row, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 70px 95px auto", gap: 6, marginBottom: 6 }}>
                  <select
                    value={row.productId}
                    onChange={(e) =>
                      setSimItemRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, productId: e.target.value } : r))
                      )
                    }
                    style={INPUT_STYLE}
                  >
                    <option value="">Select item...</option>
                    {items
                      .filter((it) => it.status === "active" && !it.isArchived)
                      .map((it) => (
                        <option key={it._id} value={it._id}>
                          {it.name} ({formatCurrency(it.sellingPrice)}/{it.unit} • Stock: {it.stock})
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) =>
                      setSimItemRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r))
                      )
                    }
                    style={INPUT_STYLE}
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    min="0"
                    value={row.unitPriceOverride}
                    onChange={(e) =>
                      setSimItemRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, unitPriceOverride: e.target.value } : r
                        )
                      )
                    }
                    style={INPUT_STYLE}
                    placeholder="Override ₹"
                    disabled={!simAllowOverride}
                  />
                  <button
                    type="button"
                    onClick={() => setSimItemRows((prev) => prev.filter((_, i) => i !== idx))}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "0 10px",
                      cursor: "pointer",
                      color: "#ef4444",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {pricingRules.filter((r) => r.status === "active").length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={LABEL_STYLE}>Include Active Pricing Rules</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {pricingRules
                    .filter((r) => r.status === "active")
                    .map((r) => {
                      const active = simRuleIds.includes(r._id);
                      return (
                        <button
                          key={r._id}
                          type="button"
                          onClick={() => toggleRuleInSim(r._id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: active ? "1px solid #4f46e5" : "1px solid #cbd5e1",
                            background: active ? "#eef2ff" : "#fff",
                            color: active ? "#4338ca" : "#475569",
                          }}
                        >
                          {r.name} ({formatCurrency(r.rate)})
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={LABEL_STYLE}>Extra Labour (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={simCharges.labourCharge}
                  onChange={(e) => setSimCharges((p) => ({ ...p, labourCharge: e.target.value }))}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Service Charge (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={simCharges.serviceCharge}
                  onChange={(e) => setSimCharges((p) => ({ ...p, serviceCharge: e.target.value }))}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Accessories (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={simCharges.accessoriesCharge}
                  onChange={(e) =>
                    setSimCharges((p) => ({ ...p, accessoriesCharge: e.target.value }))
                  }
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Misc / Discount (₹)</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="number"
                    min="0"
                    value={simCharges.miscCharge}
                    onChange={(e) => setSimCharges((p) => ({ ...p, miscCharge: e.target.value }))}
                    style={INPUT_STYLE}
                    placeholder="Misc"
                  />
                  <input
                    type="number"
                    min="0"
                    value={simDiscount}
                    onChange={(e) => setSimDiscount(e.target.value)}
                    style={INPUT_STYLE}
                    placeholder="Disc"
                  />
                </div>
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#475569",
                marginTop: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={simAllowOverride}
                onChange={(e) => setSimAllowOverride(e.target.checked)}
              />
              Allow Admin Quotation Price Override
            </label>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                disabled={simulating}
                onClick={runBackendQuoteCalculation}
                style={getBtnStyle("primary", simulating)}
              >
                {simulating ? "Calculating on Backend..." : "Calculate Authoritative Total"}
              </button>
            </div>

            {simResult && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Items Subtotal</span>
                  <strong>{formatCurrency(simResult.pricingBreakdown?.itemsSubtotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Labour + Service + Acc + Misc</span>
                  <strong>{formatCurrency(simResult.pricingBreakdown?.extraChargesSubtotal)}</strong>
                </div>
                {simResult.pricingBreakdown?.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#16a34a" }}>
                    <span>Discount</span>
                    <strong>-{formatCurrency(simResult.pricingBreakdown.discount)}</strong>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Taxable Subtotal</span>
                  <strong>{formatCurrency(simResult.subtotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>GST Amount</span>
                  <strong>{formatCurrency(simResult.gstAmount)}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: 8,
                    borderTop: "1px solid #cbd5e1",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  <span>Grand Total</span>
                  <span>{formatCurrency(simResult.finalAmount)}</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                  Internal Cost: {formatCurrency(simResult.adminCostAnalysis?.totalCost)} • Est. Margin:{" "}
                  {formatCurrency(simResult.adminCostAnalysis?.estimatedGrossMargin)}
                </div>
                {simResult.stockValidation?.hasInsufficientStock && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      borderRadius: 8,
                      background: "#fef2f2",
                      color: "#b91c1c",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Insufficient stock detected for:{" "}
                    {simResult.stockValidation.insufficientItems
                      .map((i) => `${i.productName} (avail ${i.availableStock}, need ${i.quantity})`)
                      .join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
