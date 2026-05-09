import React from 'react';
import { Avatar, StatusBadge, ActionBtn, TableWrapper } from '../UI';

export default function ApplicationTable({ items = [], selected = new Set(), onToggle, onView, onBulkAction }) {
  const headers = ['', 'Student Name', 'Phone', 'Email', 'Course', 'Status', 'Payment Status', 'Applied Date', 'Actions'];
  const rows = (items || []).map((it) => (
    <tr key={it._id || it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: 12 }}>
        <input type="checkbox" checked={selected.has(it._id || it.id)} onChange={() => onToggle(it._id || it.id)} />
      </td>
      <td style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar initials={(it.name||it.fullName||'?').charAt(0).toUpperCase()} size={40} />
        <div>
          <div style={{ fontWeight: 700 }}>{it.name || it.fullName || 'Anonymous'}</div>
        </div>
      </td>
      <td style={{ padding: 12 }}>{it.phone || it.mobile || it.mobileNumber || '—'}</td>
      <td style={{ padding: 12 }}>{it.email || it.contactEmail || '—'}</td>
      <td style={{ padding: 12 }}>{it.assignedCourse || it.programType || it.course || '—'}</td>
      <td style={{ padding: 12 }}><StatusBadge status={it.admissionStatus || it.status || 'Pending'} /></td>
      <td style={{ padding: 12 }}><StatusBadge status={it.paymentStatus || (it.payment?.paymentStatus) || 'Pending'} /></td>
      <td style={{ padding: 12 }}>{new Date(it.createdAt || it.created || Date.now()).toLocaleDateString()}</td>
      <td style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => onView(it._id || it.id)} style={{ border: 'none', background: '#eef2ff', color: '#4f46e5', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>View</button>
          <button onClick={() => onView(it._id || it.id)} style={{ border: 'none', background: '#f8fafc', color: '#64748b', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
          <button onClick={() => onBulkAction('approve', it._id || it.id)} style={{ border: 'none', background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Approve</button>
          <button onClick={() => onBulkAction('reject', it._id || it.id)} style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Reject</button>
          <button onClick={() => { selected.add(it._id || it.id); onBulkAction('assign'); }} style={{ border: 'none', background: '#ffedd5', color: '#c2410c', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Assign</button>
        </div>
      </td>
    </tr>
  ));

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onBulkAction('assign')} style={{ padding: '8px 12px', borderRadius: 10 }}>Assign</button>
          <button onClick={() => onBulkAction('export')} style={{ padding: '8px 12px', borderRadius: 10 }}>Export</button>
        </div>
      </div>
      <TableWrapper headers={headers} rows={rows} />
    </div>
  );
}
