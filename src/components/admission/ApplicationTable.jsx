import React from 'react';
import { Avatar, StatusBadge, ActionBtn, TableWrapper, TrashIcon, EditIcon } from '../UI';

export default function ApplicationTable({ items = [], selected = new Set(), onToggle, onView, onBulkAction }) {
  const headers = ['', 'Student Name', 'Phone', 'Email', 'Course', 'Status', 'Payment', 'Applied Date', 'Actions'];
  const rows = (items || []).map((it) => (
    <tr key={it._id || it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: 12 }}>
        <input type="checkbox" checked={selected.has(it._id || it.id)} onChange={() => onToggle(it._id || it.id)} />
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar initials={(it.fullName||it.name||'?').charAt(0).toUpperCase()} size={36} />
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.fullName || it.name || 'Anonymous'}</div>
        </div>
      </td>
      <td style={{ padding: 12, color: '#64748b' }}>{it.phone || it.mobileNumber || '—'}</td>
      <td style={{ padding: 12, color: '#64748b' }}>{it.email || '—'}</td>
      <td style={{ padding: 12 }}>{it.assignedCourse || it.programType || '—'}</td>
      <td style={{ padding: 12 }}><StatusBadge status={it.admissionStatus || 'pending'} /></td>
      <td style={{ padding: 12 }}><StatusBadge status={it.paymentStatus || (it.payment?.paymentStatus) || 'pending'} /></td>
      <td style={{ padding: 12, color: '#94a3b8', fontSize: 12 }}>{new Date(it.createdAt || Date.now()).toLocaleDateString()}</td>
      <td style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button title="View Details" onClick={() => onView(it._id || it.id)} style={{ border: 'none', background: '#f1f5f9', color: '#475569', padding: '6px', borderRadius: 8, cursor: 'pointer' }}>View</button>
          <button title="Edit" onClick={() => onView(it._id || it.id)} style={{ border: 'none', background: '#f1f5f9', color: '#475569', padding: '6px', borderRadius: 8, cursor: 'pointer' }}><EditIcon /></button>
          
          <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
          
          {it.admissionStatus === 'pending' || it.admissionStatus === 'review' ? (
            <>
              <button title="Approve" onClick={() => onBulkAction('approve', it._id || it.id)} style={{ border: 'none', background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Approve</button>
              <button title="Reject" onClick={() => onBulkAction('reject', it._id || it.id)} style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Reject</button>
            </>
          ) : (
             <button title="Assign Course" onClick={() => onBulkAction('assign', it._id || it.id)} style={{ border: 'none', background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Assign</button>
          )}

          <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

          <button title="Delete" onClick={() => onBulkAction('delete', it._id || it.id)} style={{ border: 'none', background: '#fff1f2', color: '#e11d48', padding: '6px', borderRadius: 8, cursor: 'pointer' }}><TrashIcon /></button>
        </div>
      </td>
    </tr>
  ));

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button 
            disabled={selected.size === 0} 
            onClick={() => onBulkAction('assign')} 
            style={{ padding: '8px 16px', borderRadius: 10, background: selected.size > 0 ? '#6366f1' : '#f1f5f9', color: selected.size > 0 ? '#fff' : '#94a3b8', border: 'none', fontWeight: 600, cursor: selected.size > 0 ? 'pointer' : 'not-allowed' }}
          >
            Bulk Assign ({selected.size})
          </button>
          <button 
            onClick={() => onBulkAction('export')} 
            style={{ padding: '8px 16px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
          >
            Export CSV
          </button>
      </div>
      <TableWrapper headers={headers} rows={rows} />
    </div>
  );
}
