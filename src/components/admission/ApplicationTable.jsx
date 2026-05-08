import React from 'react';
import { Avatar, StatusBadge, ActionBtn, TableWrapper } from '../UI';

export default function ApplicationTable({ items = [], selected = new Set(), onToggle, onView, onBulkAction }) {
  const headers = ['', 'Applicant', 'Course', 'Phone', 'Email', 'Status', 'Applied'];
  const rows = (items || []).map((it) => (
    <tr key={it._id || it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: 12 }}>
        <input type="checkbox" checked={selected.has(it._id || it.id)} onChange={() => onToggle(it._id || it.id)} />
      </td>
      <td style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar initials={(it.name||'?').charAt(0).toUpperCase()} size={40} />
        <div>
          <div style={{ fontWeight: 700 }}>{it.name || it.fullName || 'Anonymous'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{it.city || it.location || ''}</div>
        </div>
      </td>
      <td style={{ padding: 12 }}>{it.assignedCourse || it.course || it.program || '—'}</td>
      <td style={{ padding: 12 }}>{it.phone || it.mobile || it.mobileNumber || '—'}</td>
      <td style={{ padding: 12 }}>{it.email || it.contactEmail || '—'}</td>
      <td style={{ padding: 12 }}><StatusBadge status={it.admissionStatus || it.status || 'Pending'} /></td>
      <td style={{ padding: 12 }}>{new Date(it.createdAt || it.created || Date.now()).toLocaleDateString()}</td>
      <td style={{ padding: 12 }}>
        <ActionBtn label="View" onClick={() => onView(it._id || it.id)} />
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
