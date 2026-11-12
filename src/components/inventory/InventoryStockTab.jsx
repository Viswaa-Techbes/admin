"use client";

import React from "react";
import { Card } from "../UI";
import { SearchIcon, PlusIcon } from "../Icons";
import {
  INPUT_STYLE,
  TH_STYLE,
  TD_STYLE,
  STOCK_TX_LABELS,
  getStockBadge,
  getBtnStyle,
  formatDateTime,
} from "./inventoryStyles";

export default function InventoryStockTab({
  lowStockAlerts,
  transactions,
  loadingHistory,
  historySearch,
  onHistorySearchChange,
  txTypeFilter,
  onTxTypeFilterChange,
  onOpenStockModal,
  onViewItem,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Low Stock & Out of Stock Strip */}
      <Card>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Low-Stock & Out-of-Stock Items ({lowStockAlerts.length})
            </h3>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Every stock modification requires a reason and records an immutable transaction entry.
            </div>
          </div>
          <button type="button" onClick={() => onOpenStockModal(null, "addition")} style={getBtnStyle("primary")}>
            <PlusIcon /> Adjust / Add Stock
          </button>
        </div>

        {lowStockAlerts.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#10b981", fontSize: 13 }}>
            No low-stock or out-of-stock alerts at this time.
          </div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: 280 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Item</th>
                  <th style={TH_STYLE}>SKU</th>
                  <th style={TH_STYLE}>Category</th>
                  <th style={TH_STYLE}>Current / Min Stock</th>
                  <th style={TH_STYLE}>Health</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockAlerts.map((item) => {
                  const badge = getStockBadge(item);
                  return (
                    <tr key={item._id}>
                      <td
                        style={{ ...TD_STYLE, fontWeight: 700, cursor: "pointer" }}
                        onClick={() => onViewItem(item._id)}
                      >
                        {item.name}
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", fontSize: 12 }}>
                        {item.sku || "—"}
                      </td>
                      <td style={TD_STYLE}>{item.category}</td>
                      <td style={TD_STYLE}>
                        <strong>{item.stock}</strong> / {item.minStock} {item.unit}
                      </td>
                      <td style={TD_STYLE}>
                        <span
                          style={{
                            padding: "2px 9px",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => onOpenStockModal(item, "addition")}
                          style={{ ...getBtnStyle("secondary"), padding: "5px 10px", fontSize: 12 }}
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stock Movement History */}
      <Card>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Inventory Stock Movement Ledger
            </h3>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Full audit trail of additions, reductions, adjustments, and quotation/job allocations
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 240 }}>
              <span
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  display: "flex",
                }}
              >
                <SearchIcon />
              </span>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => onHistorySearchChange(e.target.value)}
                placeholder="Search item, SKU, reason, admin..."
                style={{ ...INPUT_STYLE, paddingLeft: 34 }}
              />
            </div>

            <select
              value={txTypeFilter}
              onChange={(e) => onTxTypeFilterChange(e.target.value)}
              style={{ ...INPUT_STYLE, width: 175 }}
            >
              <option value="all">All Transaction Types</option>
              {Object.entries(STOCK_TX_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingHistory ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            Loading stock transaction ledger...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            No stock movement transactions found for the current filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Timestamp</th>
                  <th style={TH_STYLE}>Item & SKU</th>
                  <th style={TH_STYLE}>Type</th>
                  <th style={TH_STYLE}>Prev Qty</th>
                  <th style={TH_STYLE}>Change</th>
                  <th style={TH_STYLE}>Updated Qty</th>
                  <th style={TH_STYLE}>Reason / Reference</th>
                  <th style={TH_STYLE}>Admin User</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const txMeta = STOCK_TX_LABELS[tx.transactionType] || {
                    label: tx.transactionType,
                    bg: "#f1f5f9",
                    color: "#475569",
                  };
                  return (
                    <tr key={tx._id}>
                      <td style={{ ...TD_STYLE, fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontWeight: 700 }}>{tx.itemName}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {tx.sku || "No SKU"} • {tx.serviceCategory || "General"}
                        </div>
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
                      <td style={TD_STYLE}>
                        {tx.previousQuantity} {tx.unit}
                      </td>
                      <td
                        style={{
                          ...TD_STYLE,
                          fontWeight: 800,
                          color: tx.quantityChange >= 0 ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {tx.quantityChange >= 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                      </td>
                      <td style={{ ...TD_STYLE, fontWeight: 700 }}>
                        {tx.updatedQuantity} {tx.unit}
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontSize: 12 }}>{tx.reason}</div>
                        {tx.referenceId && (
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            Ref: {tx.referenceType} #{tx.referenceId}
                          </div>
                        )}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: 12, color: "#475569" }}>
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
