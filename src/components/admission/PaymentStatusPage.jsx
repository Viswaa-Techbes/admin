import React, { useState } from 'react';
import { PageHeader, Card, ActionBtn, StatusBadge, useToast } from '../UI';
import useAdmissionApplications from './useAdmissionApplications';

export default function PaymentStatusPage({ onView }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { items, loading, error, refresh } = useAdmissionApplications({ page, limit: 100, search });
  const toast = useToast();

  async function verify(id) {
    try {
      const res = await fetch(`/api/v2/admission/${id}/payment/verify`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to verify payment');
      toast('Payment verified successfully');
      await refresh();
    } catch (e) { toast(e.message || 'Verification failed'); }
  }

  return (
    <div>
      <PageHeader title="Payment Management" subtitle="Manage student fees and transaction verifications" />
      <Card style={{ padding: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <input 
            placeholder="Search by student name or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none' }}
          />
        </div>

        {loading && <div style={{ padding: 20, textAlign: 'center' }}>Loading payment data...</div>}
        {error && <div style={{ padding: 20, color: '#b91c1c' }}>{error}</div>}
        
        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                  {['Student Name', 'Course', 'Total Fees', 'Paid', 'Pending', 'Status', 'Last Payment', 'Actions'].map(h => (
                    <th key={h} style={{ padding: 12, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(items||[]).map(it => {
                  const p = it.payment || {};
                  const lastPay = it.updatedAt ? new Date(it.updatedAt).toLocaleDateString() : '—';
                  return (
                    <tr key={it._id || it.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: 12, fontWeight: 600, color: '#0f172a' }}>{it.fullName || it.name}</td>
                      <td style={{ padding: 12, color: '#64748b', fontSize: 13 }}>{it.assignedCourse || it.programType || '—'}</td>
                      <td style={{ padding: 12, fontWeight: 700 }}>₹{(p.totalFees || 0).toLocaleString()}</td>
                      <td style={{ padding: 12, color: '#10b981', fontWeight: 700 }}>₹{(p.paidAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: 12, color: '#f43f5e', fontWeight: 700 }}>₹{(p.pendingAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: 12 }}><StatusBadge status={p.paymentStatus || 'pending'} /></td>
                      <td style={{ padding: 12, color: '#94a3b8', fontSize: 12 }}>{lastPay}</td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => onView(it._id || it.id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>
                          <button onClick={() => onView(it._id || it.id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Update</button>
                          {p.paymentStatus !== 'paid' && (
                            <button onClick={() => verify(it._id || it.id)} style={{ padding: '4px 8px', borderRadius: 6, background: '#6366f1', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Verify</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No payment records found.</div>}
          </div>
        )}
      </Card>
    </div>
  );
}
