import React from 'react';
import { PageHeader, Card, ActionBtn } from '../UI';
import useAdmissionApplications from './useAdmissionApplications';

export default function PaymentStatusPage() {
  const { items, loading, error, refresh } = useAdmissionApplications({ page: 1, limit: 100 });

  async function verify(id) {
    try {
      const res = await fetch(`/api/v2/admission/${id}/payment/verify`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to verify');
      await refresh();
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <PageHeader title="Payments" subtitle="Admission payment status and actions" />
      <Card style={{ padding: 16 }}>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>Applicant</th><th>Amount</th><th>Paid</th><th>Method</th><th>Action</th></tr></thead>
          <tbody>
            {(items||[]).map(it => (
              <tr key={it._id || it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12 }}>{it.name}</td>
                <td style={{ padding: 12 }}>{it.payment?.totalFees || '—'}</td>
                <td style={{ padding: 12 }}>{it.payment?.paidAmount || 0}</td>
                <td style={{ padding: 12 }}>{it.payment?.method || '—'}</td>
                <td style={{ padding: 12 }}><ActionBtn label="Verify" onClick={() => verify(it._id || it.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
