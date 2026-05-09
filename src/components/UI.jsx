import React from "react";
import { 
  StarIcon, SearchIcon, EditIcon, TrashIcon, EyeIcon, PlusIcon, 
  GridIcon, UsersIcon, HardHatIcon, BriefcaseIcon, WrenchIcon, 
  CreditCardIcon, MapPinIcon, BellIcon, ChartIcon, SettingsIcon, KeyIcon 
} from "./Icons";

export { 
  StarIcon, SearchIcon, EditIcon, TrashIcon, EyeIcon, PlusIcon,
  GridIcon, UsersIcon, HardHatIcon, BriefcaseIcon, WrenchIcon,
  CreditCardIcon, MapPinIcon, BellIcon, ChartIcon, SettingsIcon, KeyIcon
};
import { STATUS_BADGE } from "../lib/data";
// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const label = String(status || "Pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const s = STATUS_BADGE[status] || STATUS_BADGE[label] || STATUS_BADGE["Pending"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {label}
    </span>
  );
}

export function Avatar({ initials, size = 32, gradient = "linear-gradient(135deg,#6366f1,#8b5cf6)" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: gradient, display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff", fontWeight: 700,
      fontSize: size * 0.35, flexShrink: 0, letterSpacing: ".5px"
    }}>{initials}</div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #f1f5f9",
      borderRadius: 20,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.02)",
      overflow: "hidden",
      ...style
    }}>{children}</div>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b", letterSpacing: "-.02em" }}>{title}</h3>
      {action && <button type="button" onClick={onAction} style={BTN_GHOST}>{action}</button>}
    </div>
  );
}

export function ActionBtn({ icon, label, primary, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "9px 18px", borderRadius: 12, border: "none",
      background: primary ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#f8fafc",
      color: primary ? "#fff" : "#475569",
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      boxShadow: primary ? "0 4px 12px rgba(99,102,241,0.25)" : "0 1px 2px rgba(0,0,0,0.05)",
      border: primary ? "none" : "1px solid #e2e8f0",
      transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)"
    }}>{icon && <span style={{ display: "flex", opacity: 0.9 }}>{icon}</span>}{label}</button>
  );
}

export function StarRating({ rating }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= Math.round(rating)} />)}
      <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 6, fontWeight: 500 }}>{rating}</span>
    </span>
  );
}

export function TableWrapper({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 16 }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {headers.map((h, i) => (
              <th key={h} style={{
                padding: "16px 20px", textAlign: "left",
                fontSize: 11, fontWeight: 700, color: "#64748b",
                letterSpacing: ".05em", textTransform: "uppercase",
                borderBottom: "1px solid #e2e8f0",
                whiteSpace: "nowrap",
                borderTopLeftRadius: i === 0 ? 16 : 0,
                borderTopRightRadius: i === headers.length - 1 ? 16 : 0,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody style={{ background: "#fff" }}>{rows}</tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-.025em" }}>{title}</h2>
        {subtitle && <p style={{ margin: 0, fontSize: 14, color: "#64748b", fontWeight: 500 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 12 }}>{actions}</div>}
    </div>
  );
}

export function SearchFilter({ 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusChange, 
  serviceFilter, 
  onServiceChange,
  placeholder
}) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", gap: 12,
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 14, padding: "10px 16px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        transition: "border-color .2s"
      }}>
        <span style={{ color: "#94a3b8", display: "flex" }}><SearchIcon /></span>
        <input 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder || "Search..."} 
          style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#334155", width: "100%", fontWeight: 400 }} 
        />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select 
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{ padding: "10px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
        </select>
        <select 
          value={serviceFilter}
          onChange={(e) => onServiceChange(e.target.value)}
          style={{ padding: "10px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          <option value="All">All Services</option>
          <option value="Lifetime">Lifetime Plan</option>
          <option value="Basic">Basic Plan</option>
          <option value="Premium">Premium Plan</option>
        </select>
      </div>
    </div>
  );
}

export const BTN_GHOST = {
  background: "none", border: "none", color: "#6366f1",
  fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "4px 0"
};

// ─── Modal + Toast System ───────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react';
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 'min(900px, 96%)', maxHeight: '90vh', overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  function show(message, opts = {}) {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message, ...opts }]);
    if (!opts.sticky) setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), opts.duration || 3500);
  }
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 3000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#0f172a', color: '#fff', padding: '10px 14px', borderRadius: 10, boxShadow: '0 6px 18px rgba(2,6,23,0.4)' }}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.show;
}
