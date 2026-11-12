export const INPUT_STYLE = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  width: "100%",
  outline: "none",
  background: "#ffffff",
  color: "#1e293b",
  boxSizing: "border-box",
};

export const LABEL_STYLE = {
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  display: "block",
  marginBottom: 5,
};

export const TH_STYLE = {
  padding: "12px 14px",
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  letterSpacing: ".05em",
  textTransform: "uppercase",
  textAlign: "left",
  whiteSpace: "nowrap",
};

export const TD_STYLE = {
  padding: "12px 14px",
  fontSize: 13,
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
  verticalAlign: "middle",
};

export const GST_RATES = [0, 5, 12, 18, 28];

export const DEFAULT_CATEGORIES = [
  "CCTV",
  "Networking",
  "Laptop Repair",
  "Desktop Service",
  "AMC",
  "Accessories",
  "General",
];

export const UNIT_OPTIONS = [
  "Piece",
  "Meter",
  "Box",
  "Set",
  "Pair",
  "Roll",
  "Point",
  "Camera",
  "Visit",
  "Hour",
  "each",
];

export const ITEM_TYPE_OPTIONS = [
  { value: "product", label: "Product" },
  { value: "material", label: "Material" },
  { value: "accessory", label: "Accessory" },
  { value: "service", label: "Service" },
  { value: "labour", label: "Labour / Installation" },
  { value: "misc", label: "Miscellaneous" },
];

export const CHARGE_TYPE_OPTIONS = [
  { value: "labour", label: "Labour Charge" },
  { value: "installation", label: "Installation Charge" },
  { value: "service", label: "Service Charge" },
  { value: "accessory", label: "Accessory Charge" },
  { value: "miscellaneous", label: "Miscellaneous Charge" },
  { value: "material_rate", label: "Material Unit Rate" },
  { value: "category_default", label: "Category Default" },
  { value: "gst_config", label: "GST Configuration" },
];

export const PRICING_UNIT_OPTIONS = [
  { value: "per_piece", label: "Per Piece" },
  { value: "per_camera", label: "Per Camera" },
  { value: "per_meter", label: "Per Meter" },
  { value: "per_point", label: "Per Point" },
  { value: "per_visit", label: "Per Visit" },
  { value: "per_hour", label: "Per Hour" },
  { value: "per_unit", label: "Per Unit" },
  { value: "flat", label: "Flat Rate" },
  { value: "percentage", label: "Percentage" },
];

export const STOCK_TX_LABELS = {
  initial_stock: { label: "Initial Stock", bg: "#eef2ff", color: "#4338ca" },
  addition: { label: "Addition", bg: "#dcfce7", color: "#15803d" },
  adjustment: { label: "Adjustment", bg: "#e0f2fe", color: "#0369a1" },
  reduction: { label: "Reduction", bg: "#fee2e2", color: "#b91c1c" },
  quote_allocation: { label: "Quote Alloc", bg: "#fef3c7", color: "#b45309" },
  job_allocation: { label: "Job Alloc", bg: "#ffedd5", color: "#c2410c" },
  allocation_release: { label: "Released", bg: "#f1f5f9", color: "#475569" },
  return: { label: "Return", bg: "#d1fae5", color: "#047857" },
  correction: { label: "Correction", bg: "#f3e8ff", color: "#7e22ce" },
};

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStockBadge(item) {
  if (!item) return { label: "Unknown", bg: "#f1f5f9", color: "#64748b" };
  if (["service", "labour"].includes(item.itemType)) {
    return { label: "Service / N/A", bg: "#eef2ff", color: "#4f46e5" };
  }
  const stock = Number(item.stock || 0);
  const minStock = Number(item.minStock || 0);
  if (stock <= 0) {
    return { label: "Out of Stock", bg: "#fee2e2", color: "#b91c1c" };
  }
  if (minStock > 0 && stock <= minStock) {
    return { label: "Low Stock", bg: "#fef3c7", color: "#b45309" };
  }
  return { label: "In Stock", bg: "#dcfce7", color: "#15803d" };
}

export function getBtnStyle(variant = "secondary", disabled = false) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.15s ease",
  };
  if (variant === "primary") {
    return {
      ...base,
      background: "linear-gradient(135deg,#6366f1,#4f46e5)",
      color: "#ffffff",
      border: "none",
      boxShadow: "0 2px 8px rgba(79,70,229,0.22)",
    };
  }
  if (variant === "danger") {
    return {
      ...base,
      background: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    };
  }
  if (variant === "ghost") {
    return {
      ...base,
      background: "transparent",
      color: "#4f46e5",
      border: "1px solid transparent",
    };
  }
  return {
    ...base,
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #cbd5e1",
  };
}
