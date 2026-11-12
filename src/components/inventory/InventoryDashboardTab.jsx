"use client";

import React from "react";
import { Card } from "../UI";
import {
  formatCurrency,
  formatDateTime,
  getStockBadge,
  getBtnStyle,
  STOCK_TX_LABELS,
  TH_STYLE,
  TD_STYLE,
} from "./inventoryStyles";

function KpiCard({ title, value, sub, accent = "#6366f1", onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        cursor: onClick ? "pointer" : "default",
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

export default function InventoryDashboardTab({
  dashboard,
  loading,
  onNavigateTab,
  onFilterStockHealth,
  onViewItem,
  onOpenStockModal,
}) {
  const metrics = dashboard?.metrics || {};
  const categoryBreakdown = dashboard?.categoryBreakdown || [];
  const recentlyAdded = dashboard?.recentlyAdded || [];
  const recentlyUpdatedPricing = dashboard?.recentlyUpdatedPricing || [];
  const lowStockAlerts = dashboard?.lowStockAlerts || [];
  const recentTransactions = dashboard?.recentTransactions || [];

  if (loading && !dashboard) {
    return (
      <Card>
        <div style={{ padding: 48, textAlign: "center", color: "#64748b", fontSize: 14 }}>
          Loading inventory dashboard metrics...
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))",
          gap: 14,
        }}
      >
        <KpiCard
          title="Total Inventory Items"
          value={metrics.totalItems ?? 0}
          sub={`${metrics.totalUnitsInStock ?? 0} total units • ${metrics.archivedItems ?? 0} archived`}
          accent="#6366f1"
          onClick={() => onNavigateTab("items")}
        />
        <KpiCard
          title="Active Items"
          value={metrics.activeItems ?? 0}
          sub={`${metrics.inactiveItems ?? 0} inactive • ${metrics.activePricingRules ?? 0} pricing rules`}
          accent="#10b981"
          onClick={() => onNavigateTab("items")}
        />
        <KpiCard
          title="Low-Stock Items"
          value={metrics.lowStockItems ?? 0}
          sub="At or below minimum threshold"
          accent="#f59e0b"
          onClick={() => onFilterStockHealth("low_stock")}
        />
        <KpiCard
          title="Out-of-Stock Items"
          value={metrics.outOfStockItems ?? 0}
          sub="Immediate restock required"
          accent="#ef4444"
          onClick={() => onFilterStockHealth("out_of_stock")}
        />
        <KpiCard
          title="Inventory Value"
          value={
            metrics.totalInventoryCostValue !== null &&
            metrics.totalInventoryCostValue !== undefined
              ? formatCurrency(metrics.totalInventoryCostValue)
              : formatCurrency(metrics.totalInventorySellingValue || 0)
          }
          sub={
            metrics.totalInventoryCostValue !== null &&
            metrics.totalInventoryCostValue !== undefined
              ? `Retail value: ${formatCurrency(metrics.totalInventorySellingValue || 0)} (${metrics.itemsWithCostData || 0} costed)`
              : "Retail valuation (add purchase prices for cost value)"
          }
          accent="#06b6d4"
          onClick={() => onNavigateTab("pricing")}
        />
      </div>

      {/* Low Stock Alerts + Category Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 18,
        }}
      >
        <Card>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                Stock Attention & Alerts
              </h3>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Out-of-stock and low-stock items needing replenishment
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("stock")}
              style={{ ...getBtnStyle("ghost"), fontSize: 12 }}
            >
              View All
            </button>
          </div>
          {lowStockAlerts.length === 0 ? (
            <div style={{ padding: 28, textAlign: "center", color: "#10b981", fontSize: 13 }}>
              All tracked inventory items are above minimum stock levels.
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {lowStockAlerts.map((item) => {
                const badge = getStockBadge(item);
                return (
                  <div
                    key={item._id}
                    style={{
                      padding: "11px 18px",
                      borderBottom: "1px solid #f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "#0f172a",
                          cursor: "pointer",
                        }}
                        onClick={() => onViewItem(item._id)}
                      >
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {item.sku || "No SKU"} • {item.category} • Min: {item.minStock} {item.unit}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {item.stock} {item.unit} ({badge.label})
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenStockModal(item, "addition")}
                        style={{ ...getBtnStyle("secondary"), padding: "5px 10px", fontSize: 11 }}
                      >
                        + Restock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                Category Stock & Valuation
              </h3>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Distribution across service categories
              </div>
            </div>
          </div>
          {categoryBreakdown.length === 0 ? (
            <div style={{ padding: 28, textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No inventory categories recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Category</th>
                    <th style={TH_STYLE}>Items</th>
                    <th style={TH_STYLE}>Units</th>
                    <th style={TH_STYLE}>Retail Value</th>
                    <th style={TH_STYLE}>Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((cat) => (
                    <tr key={cat.category}>
                      <td style={{ ...TD_STYLE, fontWeight: 700 }}>{cat.category}</td>
                      <td style={TD_STYLE}>
                        {cat.totalItems} <span style={{ color: "#94a3b8", fontSize: 11 }}>({cat.activeItems} active)</span>
                      </td>
                      <td style={TD_STYLE}>{cat.totalStock}</td>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>{formatCurrency(cat.sellingValue)}</td>
                      <td style={TD_STYLE}>
                        {cat.outOfStockCount + cat.lowStockCount > 0 ? (
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#fef3c7",
                              color: "#b45309",
                            }}
                          >
                            {cat.outOfStockCount + cat.lowStockCount}
                          </span>
                        ) : (
                          <span style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Recently Added Materials + Recently Updated Pricing */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 18,
        }}
      >
        <Card>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Recently Added Materials
            </h3>
          </div>
          {recentlyAdded.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No materials added yet.
            </div>
          ) : (
            <div>
              {recentlyAdded.map((item) => (
                <div
                  key={item._id}
                  onClick={() => onViewItem(item._id)}
                  style={{
                    padding: "11px 18px",
                    borderBottom: "1px solid #f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {item.sku || "No SKU"} • {item.category} • Added {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                      {formatCurrency(item.sellingPrice)}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Stock: {item.stock} {item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Recently Updated Pricing
            </h3>
          </div>
          {recentlyUpdatedPricing.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No recent pricing updates.
            </div>
          ) : (
            <div>
              {recentlyUpdatedPricing.map((item) => (
                <div
                  key={item._id}
                  onClick={() => onViewItem(item._id)}
                  style={{
                    padding: "11px 18px",
                    borderBottom: "1px solid #f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {item.category} • GST {item.gstRate}% • {formatDateTime(item.lastPriceUpdatedAt || item.updatedAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#4f46e5" }}>
                      Sell: {formatCurrency(item.sellingPrice)}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Buy: {formatCurrency(item.purchasePrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Stock Movement Preview */}
      <Card>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            Recent Stock Movements
          </h3>
          <button type="button" onClick={() => onNavigateTab("stock")} style={{ ...getBtnStyle("ghost"), fontSize: 12 }}>
            Full History
          </button>
        </div>
        {recentTransactions.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            No stock movement transactions recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>When</th>
                  <th style={TH_STYLE}>Item</th>
                  <th style={TH_STYLE}>Type</th>
                  <th style={TH_STYLE}>Change</th>
                  <th style={TH_STYLE}>Reason</th>
                  <th style={TH_STYLE}>Admin</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.slice(0, 6).map((tx) => {
                  const txMeta = STOCK_TX_LABELS[tx.transactionType] || {
                    label: tx.transactionType,
                    bg: "#f1f5f9",
                    color: "#475569",
                  };
                  return (
                    <tr key={tx._id}>
                      <td style={{ ...TD_STYLE, fontSize: 12, color: "#64748b" }}>
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>
                        {tx.itemName}{" "}
                        {tx.sku ? <span style={{ color: "#94a3b8", fontSize: 11 }}>({tx.sku})</span> : null}
                      </td>
                      <td style={TD_STYLE}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            background: txMeta.bg,
                            color: txMeta.color,
                          }}
                        >
                          {txMeta.label}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, fontWeight: 700 }}>
                        {tx.previousQuantity} → {tx.updatedQuantity}{" "}
                        <span style={{ color: tx.quantityChange >= 0 ? "#16a34a" : "#dc2626" }}>
                          ({tx.quantityChange >= 0 ? `+${tx.quantityChange}` : tx.quantityChange})
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: 12 }}>{tx.reason}</td>
                      <td style={{ ...TD_STYLE, fontSize: 12, color: "#64748b" }}>
                        {tx.performedByName || "Admin"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
