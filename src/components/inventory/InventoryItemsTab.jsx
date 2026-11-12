"use client";

import React from "react";
import { Card } from "../UI";
import { SearchIcon, EditIcon, TrashIcon, PlusIcon } from "../Icons";
import {
  INPUT_STYLE,
  TH_STYLE,
  TD_STYLE,
  ITEM_TYPE_OPTIONS,
  formatCurrency,
  getStockBadge,
  getBtnStyle,
} from "./inventoryStyles";

export default function InventoryItemsTab({
  items,
  loading,
  categories,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  itemTypeFilter,
  onItemTypeFilterChange,
  stockHealthFilter,
  onStockHealthFilterChange,
  statusFilter,
  onStatusFilterChange,
  onOpenAdd,
  onViewItem,
  onEditItem,
  onOpenStockModal,
  onToggleStatus,
  onOpenDeleteModal,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters Bar */}
      <Card style={{ padding: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 2fr) repeat(4, minmax(130px, 1fr)) auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
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
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, SKU, brand, model, specs..."
              style={{ ...INPUT_STYLE, paddingLeft: 34 }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={itemTypeFilter}
            onChange={(e) => onItemTypeFilterChange(e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="all">All Types</option>
            {ITEM_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={stockHealthFilter}
            onChange={(e) => onStockHealthFilterChange(e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="needs_reorder">Needs Reorder</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="all">Active & Inactive</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="archived">Archived</option>
          </select>

          <button type="button" onClick={onOpenAdd} style={getBtnStyle("primary")}>
            <PlusIcon /> Add Item
          </button>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            Loading inventory catalog...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              No matching inventory items found
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              Adjust your search filters or add a new material / product.
            </div>
            <button type="button" onClick={onOpenAdd} style={getBtnStyle("primary")}>
              <PlusIcon /> Add First Item
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Item & Specs</th>
                  <th style={TH_STYLE}>SKU / Type</th>
                  <th style={TH_STYLE}>Service Category</th>
                  <th style={TH_STYLE}>Purchase / Selling</th>
                  <th style={TH_STYLE}>Stock & Health</th>
                  <th style={TH_STYLE}>Status</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const badge = getStockBadge(item);
                  return (
                    <tr key={item._id}>
                      <td style={TD_STYLE}>
                        <div
                          onClick={() => onViewItem(item._id)}
                          style={{
                            fontWeight: 700,
                            color: "#0f172a",
                            cursor: "pointer",
                            marginBottom: 2,
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {[item.brand, item.modelNumber, item.variant].filter(Boolean).join(" • ") ||
                            item.specifications ||
                            "No brand/model set"}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>
                          {item.sku || "—"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>
                          {item.itemType || "product"} • {item.unit || "Piece"}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontWeight: 600 }}>{item.category || "General"}</div>
                        {item.subcategory && (
                          <div style={{ fontSize: 11, color: "#64748b" }}>{item.subcategory}</div>
                        )}
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          Sell: {formatCurrency(item.sellingPrice)}
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                            {" "}
                            (+{item.gstRate}% GST)
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Buy: {formatCurrency(item.purchasePrice)}{" "}
                          {item.marginPercent !== null && item.marginPercent !== undefined
                            ? `• Margin ${item.marginPercent}%`
                            : ""}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700 }}>
                            {item.stock} {item.unit}
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                          Min threshold: {item.minStock || 0}
                        </div>
                      </td>
                      <td style={TD_STYLE}>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(item)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 99,
                            border: "none",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            background: item.isArchived
                              ? "#e2e8f0"
                              : item.status === "active"
                              ? "#dcfce7"
                              : "#fee2e2",
                            color: item.isArchived
                              ? "#475569"
                              : item.status === "active"
                              ? "#15803d"
                              : "#b91c1c",
                          }}
                        >
                          {item.isArchived
                            ? "Archived (Restore)"
                            : item.status === "active"
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => onViewItem(item._id)}
                            style={{ ...getBtnStyle("ghost"), padding: "5px 9px", fontSize: 12 }}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenStockModal(item, "addition")}
                            style={{ ...getBtnStyle("secondary"), padding: "5px 9px", fontSize: 12 }}
                          >
                            Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            style={{ ...getBtnStyle("secondary"), padding: "5px 9px", fontSize: 12 }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDeleteModal(item)}
                            style={{ ...getBtnStyle("danger"), padding: "5px 9px", fontSize: 12 }}
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
    </div>
  );
}
