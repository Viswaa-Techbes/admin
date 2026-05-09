import React, { useState } from 'react';
import { PageHeader, Card, useToast } from '../UI';
import useAdmissionApplications from './useAdmissionApplications';
import AssignmentModal from './AssignmentModal';

// ─── Status Badge ────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  applied:    { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  review:     { bg: '#fefce8', color: '#854d0e', dot: '#eab308' },
  approved:   { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  enrolled:   { bg: '#f0fdf4', color: '#166534', dot: '#16a34a' },
  completed:  { bg: '#f5f3ff', color: '#6d28d9', dot: '#7c3aed' },
  rejected:   { bg: '#fff1f2', color: '#be123c', dot: '#f43f5e' },
  suspended:  { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  pending:    { bg: '#f8fafc', color: '#475569', dot: '#94a3b8' },
};

function StatusBadge({ status }) {
  const key = (status || 'pending').toLowerCase();
  const s = STATUS_STYLES[key] || STATUS_STYLES.pending;
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─── Search + Filter Toolbar ─────────────────────────────────────────────────
function FilterBar({ search, setSearch, status, setStatus, onExport, onBulkAssign, hasSelection }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      flexWrap: 'wrap', marginBottom: 20,
    }}>
      {/* Search */}
      <div style={{
        flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 8,
        height: 40, padding: '0 14px',
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        minWidth: 200,
      }}>
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: '#94a3b8' }}>
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, enrollment ID..."
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, color: '#334155', width: '100%',
          }}
        />
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        style={{
          height: 40, padding: '0 12px',
          border: '1px solid #e2e8f0', borderRadius: 10,
          background: '#fff', color: '#475569',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          outline: 'none', flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <option value="All">All Status</option>
        <option value="applied">Applied</option>
        <option value="review">Under Review</option>
        <option value="approved">Approved</option>
        <option value="enrolled">Enrolled</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
      </select>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {hasSelection && (
          <button
            onClick={onBulkAssign}
            style={{
              height: 40, padding: '0 16px',
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)', whiteSpace: 'nowrap',
            }}
          >
            Assign Selected
          </button>
        )}
        <button
          onClick={onExport}
          style={{
            height: 40, padding: '0 16px',
            background: '#fff', color: '#475569',
            border: '1px solid #e2e8f0', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
          }}
        >
          ↓ Export CSV
        </button>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
const TH = ({ children, style = {} }) => (
  <th style={{
    padding: '12px 16px', textAlign: 'left',
    fontSize: 11, fontWeight: 700, color: '#64748b',
    letterSpacing: '.06em', textTransform: 'uppercase',
    background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap', ...style,
  }}>
    {children}
  </th>
);

const TD = ({ children, style = {} }) => (
  <td style={{
    padding: '14px 16px', fontSize: 13, color: '#334155',
    verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9',
    ...style,
  }}>
    {children}
  </td>
);

function ApplicationRow({ item, isSelected, onToggle, onView, onAction }) {
  const id = item._id || item.id;
  const name = item.fullName || item.name || 'Unknown';
  const initials = name.charAt(0).toUpperCase();
  const plan = item.plan || item.selectedPlan || '—';
  const enroll = item.enrollmentId || '—';

  return (
    <tr
      style={{
        background: isSelected ? '#f5f3ff' : '#fff',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
    >
      <TD style={{ width: 44, paddingRight: 0 }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(id)}
          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#6366f1' }}
        />
      </TD>
      <TD>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.email || '—'}</div>
          </div>
        </div>
      </TD>
      <TD style={{ color: '#64748b' }}>{item.phone || '—'}</TD>
      <TD>
        <span style={{
          padding: '3px 8px', borderRadius: 6,
          background: '#eef2ff', color: '#4338ca',
          fontSize: 11, fontWeight: 700,
        }}>
          {plan}
        </span>
      </TD>
      <TD style={{ color: '#475569', fontFamily: 'monospace', fontSize: 12 }}>
        {enroll}
      </TD>
      <TD><StatusBadge status={item.admissionStatus || item.status} /></TD>
      <TD style={{ color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
      </TD>
      <TD>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => onView(id)}
            style={{
              padding: '5px 12px', borderRadius: 7, border: 'none',
              background: '#eef2ff', color: '#4338ca',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            View
          </button>
          <button
            onClick={() => onAction('approve', id)}
            style={{
              padding: '5px 10px', borderRadius: 7, border: 'none',
              background: '#f0fdf4', color: '#16a34a',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
            title="Approve"
          >
            ✓
          </button>
          <button
            onClick={() => onAction('reject', id)}
            style={{
              padding: '5px 10px', borderRadius: 7, border: 'none',
              background: '#fff1f2', color: '#be123c',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
            title="Reject"
          >
            ✕
          </button>
        </div>
      </TD>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AllApplicationsPage({ onView }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const { items, loading, error, total, refresh } = useAdmissionApplications({ page, limit: 20, search, status });
  const [selected, setSelected] = useState(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const toast = useToast();

  function toggle(id) {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  }

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(i => i._id || i.id)));
    }
  }

  async function onAction(action, id) {
    try {
      if (action === 'approve' || action === 'reject') {
        const res = await fetch(`/api/v2/admission/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admissionStatus: action === 'approve' ? 'approved' : 'rejected' }),
        });
        if (!res.ok) throw new Error('Failed');
        toast(`Application ${action === 'approve' ? 'approved' : 'rejected'}`);
        refresh();
      } else if (action === 'delete') {
        if (!window.confirm('Permanently delete this application?')) return;
        const res = await fetch(`/api/v2/admission/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast('Application deleted');
        refresh();
      } else if (action === 'assign') {
        if (id) setSelected(new Set([id]));
        setAssignOpen(true);
      }
    } catch (e) {
      toast(e.message || 'Action failed');
    }
  }

  function onExport() {
    const data = selected.size > 0
      ? items.filter(it => selected.has(it._id || it.id))
      : items;
    if (!data.length) return toast('No data to export');
    const keys = ['fullName', 'email', 'phone', 'plan', 'enrollmentId', 'admissionStatus', 'createdAt'];
    const csv = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k] || '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'admissions.csv'; a.click();
    toast('Exported successfully');
  }

  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-.025em' }}>
            All Applications
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            {total} total applications
          </p>
        </div>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 0' }}>
          <FilterBar
            search={search} setSearch={setSearch}
            status={status} setStatus={setStatus}
            hasSelection={selected.size > 0}
            onExport={onExport}
            onBulkAssign={() => setAssignOpen(true)}
          />
        </div>

        {loading && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Loading applications...
          </div>
        )}
        {error && (
          <div style={{ padding: '20px', color: '#b91c1c', background: '#fef2f2', margin: '0 20px 20px', borderRadius: 10, fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr>
                  <TH style={{ width: 44, paddingRight: 0 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                  </TH>
                  <TH>Applicant</TH>
                  <TH>Phone</TH>
                  <TH>Plan</TH>
                  <TH>Enrollment ID</TH>
                  <TH>Status</TH>
                  <TH>Applied On</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>No applications found</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filter</div>
                    </td>
                  </tr>
                ) : items.map(item => (
                  <ApplicationRow
                    key={item._id || item.id}
                    item={item}
                    isSelected={selected.has(item._id || item.id)}
                    onToggle={toggle}
                    onView={onView}
                    onAction={onAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderTop: '1px solid #f1f5f9',
          background: '#fafafa',
        }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {selected.size > 0
              ? `${selected.size} of ${items.length} selected`
              : `Showing ${items.length} of ${total} applications`}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                height: 34, padding: '0 14px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : '#fff',
                color: page === 1 ? '#cbd5e1' : '#475569',
                fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Prev
            </button>
            <span style={{
              height: 34, padding: '0 14px', borderRadius: 8, display: 'flex', alignItems: 'center',
              border: '1px solid #6366f1', background: '#eef2ff',
              fontSize: 13, fontWeight: 700, color: '#4338ca',
            }}>
              {page}
            </span>
            <button
              disabled={items.length < 20}
              onClick={() => setPage(p => p + 1)}
              style={{
                height: 34, padding: '0 14px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: items.length < 20 ? '#f8fafc' : '#fff',
                color: items.length < 20 ? '#cbd5e1' : '#475569',
                fontSize: 13, fontWeight: 600, cursor: items.length < 20 ? 'not-allowed' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </Card>

      <AssignmentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        selectedIds={[...selected]}
        onAssigned={async () => {
          toast('Assigned — refreshing');
          await refresh();
          setSelected(new Set());
        }}
      />
    </div>
  );
}
