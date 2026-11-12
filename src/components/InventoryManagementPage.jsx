"use client";

import React, { useState, useEffect, useMemo, useCallback, Component } from "react";
import { PageHeader, ActionBtn, useToast } from "./UI";
import { PlusIcon } from "./Icons";
import { apiFetch } from "../lib/apiClient";
import { DEFAULT_CATEGORIES, getBtnStyle } from "./inventory/inventoryStyles";
import InventoryDashboardTab from "./inventory/InventoryDashboardTab";
import InventoryItemsTab from "./inventory/InventoryItemsTab";
import InventoryPricingTab from "./inventory/InventoryPricingTab";
import InventoryStockTab from "./inventory/InventoryStockTab";
import {
  InventoryItemModal,
  StockAdjustmentModal,
  PricingRuleModal,
  ItemDetailModal,
  DeleteArchiveModal,
} from "./inventory/InventoryModals";

class InventoryErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[InventoryManagementPage Error]:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 32,
            maxWidth: 640,
            margin: "40px auto",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #fee2e2",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#991b1b", margin: "0 0 8px" }}>
            Inventory Management Encountered an Error
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
            {this.state.error?.message || "An error occurred while rendering inventory."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={getBtnStyle("secondary")}
          >
            Reset View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function InventoryManagementInner() {
  const toast = useToast();

  const notify = useCallback(
    (msg, type = "info") => {
      if (typeof toast?.show === "function") {
        toast.show(msg, type);
      }
    },
    [toast]
  );

  const [activeTab, setActiveTab] = useState("dashboard");

  // Data state
  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Loading & error state
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [itemTypeFilter, setItemTypeFilter] = useState("all");
  const [stockHealthFilter, setStockHealthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [itemDetails, setItemDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockTargetItem, setStockTargetItem] = useState(null);
  const [stockDefaultType, setStockDefaultType] = useState("addition");
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const { payload } = await apiFetch("/api/v2/admin/inventory/dashboard");
      setDashboard(payload.data);
      setErrorBanner("");
    } catch (err) {
      setErrorBanner(err.message || "Failed to load inventory dashboard");
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (itemTypeFilter !== "all") params.set("itemType", itemTypeFilter);
      if (stockHealthFilter !== "all") params.set("stockHealth", stockHealthFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (statusFilter === "archived") params.set("includeArchived", "true");

      const qs = params.toString();
      const { payload } = await apiFetch(
        `/api/v2/admin/inventory/products${qs ? `?${qs}` : ""}`
      );
      setItems(Array.isArray(payload.data) ? payload.data : []);
      setErrorBanner("");
    } catch (err) {
      setErrorBanner(err.message || "Failed to fetch inventory items");
    } finally {
      setLoadingItems(false);
    }
  }, [search, categoryFilter, itemTypeFilter, stockHealthFilter, statusFilter]);

  const fetchPricingRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const { payload } = await apiFetch("/api/v2/admin/inventory/pricing-rules");
      setPricingRules(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      notify(err.message || "Could not load pricing rules", "error");
    } finally {
      setLoadingRules(false);
    }
  }, [notify]);

  const fetchStockAlertsAndHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (historySearch.trim()) params.set("search", historySearch.trim());
      if (txTypeFilter !== "all") params.set("transactionType", txTypeFilter);
      const qs = params.toString();

      const [alertRes, histRes] = await Promise.all([
        apiFetch("/api/v2/admin/inventory/stock/low-stock"),
        apiFetch(`/api/v2/admin/inventory/stock/history${qs ? `?${qs}` : ""}`),
      ]);

      setLowStockAlerts(Array.isArray(alertRes.payload?.data) ? alertRes.payload.data : []);
      setTransactions(Array.isArray(histRes.payload?.data) ? histRes.payload.data : []);
    } catch (err) {
      notify(err.message || "Failed to fetch stock logs", "error");
    } finally {
      setLoadingHistory(false);
    }
  }, [historySearch, txTypeFilter, notify]);

  const refreshAll = useCallback(() => {
    fetchDashboard();
    fetchItems();
    fetchPricingRules();
    fetchStockAlertsAndHistory();
  }, [fetchDashboard, fetchItems, fetchPricingRules, fetchStockAlertsAndHistory]);

  useEffect(() => {
    fetchDashboard();
    fetchPricingRules();
  }, [fetchDashboard, fetchPricingRules]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    if (activeTab === "stock") {
      const timer = setTimeout(() => {
        fetchStockAlertsAndHistory();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchStockAlertsAndHistory]);

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    for (const r of pricingRules) {
      if (r.serviceCategory && r.serviceCategory !== "Global") set.add(r.serviceCategory);
    }
    return Array.from(set);
  }, [items, pricingRules]);

  const handleViewItem = async (id) => {
    setDetailModalOpen(true);
    setLoadingDetails(true);
    setItemDetails(null);
    try {
      const { payload } = await apiFetch(`/api/v2/admin/inventory/products/${id}`);
      setItemDetails(payload.data);
    } catch (err) {
      notify(err.message || "Error loading item details", "error");
      setDetailModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveItem = async (formPayload) => {
    setSaving(true);
    try {
      const isEdit = Boolean(formPayload._id);
      const url = isEdit
        ? `/api/v2/admin/inventory/products/${formPayload._id}`
        : "/api/v2/admin/inventory/products";
      const { payload } = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: formPayload,
      });
      notify(payload.message || "Inventory item saved", "success");
      setItemModalOpen(false);
      setEditingItem(null);
      refreshAll();
    } catch (err) {
      notify(err.message || "Error saving item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const { payload } = await apiFetch(`/api/v2/admin/inventory/products/${item._id}/status`, {
        method: "PATCH",
        body: { restore: Boolean(item.isArchived) },
      });
      notify(payload.message || "Item status updated", "success");
      refreshAll();
    } catch (err) {
      notify(err.message || "Status update failed", "error");
    }
  };

  const handleConfirmDeleteOrArchive = async (id, mode) => {
    setSaving(true);
    try {
      const { payload } = await apiFetch(
        `/api/v2/admin/inventory/products/${id}?mode=${encodeURIComponent(mode)}`,
        { method: "DELETE" }
      );
      notify(payload.message || "Item updated", "success");
      setDeleteModalOpen(false);
      setDeleteTargetItem(null);
      setDetailModalOpen(false);
      refreshAll();
    } catch (err) {
      notify(err.message || "Could not remove item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (itemId, stockPayload) => {
    setSaving(true);
    try {
      const { payload } = await apiFetch(`/api/v2/admin/inventory/products/${itemId}/stock`, {
        method: "POST",
        body: stockPayload,
      });
      notify(payload.message || "Stock adjusted", "success");
      setStockModalOpen(false);
      setStockTargetItem(null);
      refreshAll();
    } catch (err) {
      notify(err.message || "Failed to adjust stock", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePricingRule = async (rulePayload) => {
    setSaving(true);
    try {
      const isEdit = Boolean(rulePayload._id);
      const url = isEdit
        ? `/api/v2/admin/inventory/pricing-rules/${rulePayload._id}`
        : "/api/v2/admin/inventory/pricing-rules";
      const { payload } = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: rulePayload,
      });
      notify(payload.message || "Pricing rule saved", "success");
      setRuleModalOpen(false);
      setEditingRule(null);
      refreshAll();
    } catch (err) {
      notify(err.message || "Failed to save pricing rule", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (rule) => {
    try {
      await apiFetch(`/api/v2/admin/inventory/pricing-rules/${rule._id}`, {
        method: "DELETE",
      });
      notify("Pricing rule removed", "success");
      fetchPricingRules();
    } catch (err) {
      notify(err.message || "Failed to delete pricing rule", "error");
    }
  };

  const attentionCount =
    (dashboard?.metrics?.lowStockItems || 0) + (dashboard?.metrics?.outOfStockItems || 0);

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "items", label: `Inventory Items (${dashboard?.metrics?.totalItems ?? items.length})` },
    { id: "pricing", label: `Dynamic Pricing (${pricingRules.length})` },
    {
      id: "stock",
      label: attentionCount > 0 ? `Stock & History (${attentionCount} alerts)` : "Stock & History",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title="Inventory & Dynamic Pricing Management"
        subtitle="Manage materials, products, service charges, GST rules, and tracked stock movements"
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActionBtn
              label="Adjust Stock"
              onClick={() => {
                setStockTargetItem(null);
                setStockDefaultType("addition");
                setStockModalOpen(true);
              }}
            />
            <ActionBtn
              label="+ Pricing Rule"
              onClick={() => {
                setEditingRule(null);
                setRuleModalOpen(true);
              }}
            />
            <ActionBtn
              primary
              icon={<PlusIcon />}
              label="Add Inventory Item"
              onClick={() => {
                setEditingItem(null);
                setItemModalOpen(true);
              }}
            />
          </div>
        }
      />

      {errorBanner && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{errorBanner}</span>
          <button
            type="button"
            onClick={refreshAll}
            style={{ ...getBtnStyle("secondary"), padding: "4px 10px", fontSize: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 10,
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "9px 16px",
                borderRadius: 10,
                border: active ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                background: active ? "#4f46e5" : "#ffffff",
                color: active ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "dashboard" && (
        <InventoryDashboardTab
          dashboard={dashboard}
          loading={loadingDashboard}
          onNavigateTab={setActiveTab}
          onFilterStockHealth={(health) => {
            setStockHealthFilter(health);
            setActiveTab("items");
          }}
          onViewItem={handleViewItem}
          onOpenStockModal={(item, type) => {
            setStockTargetItem(item);
            setStockDefaultType(type || "addition");
            setStockModalOpen(true);
          }}
        />
      )}

      {activeTab === "items" && (
        <InventoryItemsTab
          items={items}
          loading={loadingItems}
          categories={categories}
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          itemTypeFilter={itemTypeFilter}
          onItemTypeFilterChange={setItemTypeFilter}
          stockHealthFilter={stockHealthFilter}
          onStockHealthFilterChange={setStockHealthFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenAdd={() => {
            setEditingItem(null);
            setItemModalOpen(true);
          }}
          onViewItem={handleViewItem}
          onEditItem={(item) => {
            setEditingItem(item);
            setItemModalOpen(true);
          }}
          onOpenStockModal={(item, type) => {
            setStockTargetItem(item);
            setStockDefaultType(type || "addition");
            setStockModalOpen(true);
          }}
          onToggleStatus={handleToggleStatus}
          onOpenDeleteModal={(item) => {
            setDeleteTargetItem(item);
            setDeleteModalOpen(true);
          }}
        />
      )}

      {activeTab === "pricing" && (
        <InventoryPricingTab
          items={items}
          pricingRules={pricingRules}
          categories={categories}
          loadingRules={loadingRules}
          onOpenRuleModal={(rule) => {
            setEditingRule(rule);
            setRuleModalOpen(true);
          }}
          onDeleteRule={handleDeleteRule}
          onRefreshAll={refreshAll}
          addToast={notify}
        />
      )}

      {activeTab === "stock" && (
        <InventoryStockTab
          lowStockAlerts={lowStockAlerts}
          transactions={transactions}
          loadingHistory={loadingHistory}
          historySearch={historySearch}
          onHistorySearchChange={setHistorySearch}
          txTypeFilter={txTypeFilter}
          onTxTypeFilterChange={setTxTypeFilter}
          onOpenStockModal={(item, type) => {
            setStockTargetItem(item);
            setStockDefaultType(type || "addition");
            setStockModalOpen(true);
          }}
          onViewItem={handleViewItem}
        />
      )}

      {/* Modals */}
      {itemModalOpen && (
        <InventoryItemModal
          key={editingItem?._id || "new-item"}
          open={itemModalOpen}
          onClose={() => {
            setItemModalOpen(false);
            setEditingItem(null);
          }}
          initialItem={editingItem}
          categories={categories}
          saving={saving}
          onSubmit={handleSaveItem}
        />
      )}

      <ItemDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        details={itemDetails}
        loading={loadingDetails}
        onEdit={(item) => {
          setDetailModalOpen(false);
          setEditingItem(item);
          setItemModalOpen(true);
        }}
        onAdjustStock={(item) => {
          setDetailModalOpen(false);
          setStockTargetItem(item);
          setStockDefaultType("addition");
          setStockModalOpen(true);
        }}
        onDeleteOrArchive={(item) => {
          setDeleteTargetItem(item);
          setDeleteModalOpen(true);
        }}
      />

      {stockModalOpen && (
        <StockAdjustmentModal
          key={`${stockTargetItem?._id || "any"}-${stockDefaultType}`}
          open={stockModalOpen}
          onClose={() => {
            setStockModalOpen(false);
            setStockTargetItem(null);
          }}
          selectedItem={stockTargetItem}
          items={items}
          defaultType={stockDefaultType}
          saving={saving}
          onSubmit={handleAdjustStock}
        />
      )}

      {ruleModalOpen && (
        <PricingRuleModal
          key={editingRule?._id || "new-rule"}
          open={ruleModalOpen}
          onClose={() => {
            setRuleModalOpen(false);
            setEditingRule(null);
          }}
          initialRule={editingRule}
          categories={categories}
          saving={saving}
          onSubmit={handleSavePricingRule}
        />
      )}

      <DeleteArchiveModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTargetItem(null);
        }}
        item={deleteTargetItem}
        saving={saving}
        onConfirm={handleConfirmDeleteOrArchive}
      />
    </div>
  );
}

export function InventoryManagementPage() {
  return (
    <InventoryErrorBoundary>
      <InventoryManagementInner />
    </InventoryErrorBoundary>
  );
}

export default InventoryManagementPage;
