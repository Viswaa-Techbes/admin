import React, { useState } from 'react';
import { PageHeader, Card, SearchFilter } from '../UI';
import useAdmissionApplications from './useAdmissionApplications';
import ApplicationTable from './ApplicationTable';
import { useToast } from '../UI';
import AssignmentModal from './AssignmentModal';

export default function AllApplicationsPage({ onView }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const { items, loading, error, total, refresh } = useAdmissionApplications({ page, limit: 20, search, status });
  const [selected, setSelected] = useState(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const toast = useToast();

  function toggle(id) { const s = new Set(selected); if (s.has(id)) s.delete(id); else s.add(id); setSelected(s); }
  async function onBulkAction(action, id) {
    if (action === 'export') {
      const data = items.filter(it => selected.has(it._id || it.id));
      if (!data.length) return toast('No items selected for export');
      const csv = [Object.keys(data[0]||{}).join(','), ...data.map(r => Object.values(r).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'admissions.csv'; a.click();
      toast('Export successful');
    } else if (action === 'assign') {
      if (!id && !selected.size) return toast('Select applications first');
      if (id) {
        setSelected(new Set([id]));
      }
      setAssignOpen(true);
    } else if (action === 'delete') {
      const targetId = id || [...selected][0];
      if (!targetId) return;
      if (!window.confirm("Permanently delete this application?")) return;
      try {
        const res = await fetch(`/api/v2/admission/${targetId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast('Application deleted');
        refresh();
      } catch (e) { toast(e.message); }
    } else if (action === 'approve' || action === 'reject') {
      if (!id) return;
      try {
        await fetch(`/api/v2/admission/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admissionStatus: action === 'approve' ? 'approved' : 'rejected' })
        });
        toast(`Application ${action === 'approve' ? 'Approved' : 'Rejected'}`);
        refresh();
      } catch (e) {
        toast('Failed to update status');
      }
    }
  }

  async function onAssigned() {
    toast('Assigned — refreshing');
    await refresh();
    setSelected(new Set());
  }

  return (
    <div>
      <PageHeader title="All Applications" subtitle="Manage incoming applications" />
      <Card style={{ padding: 16 }}>
        <SearchFilter searchQuery={search} onSearchChange={setSearch} statusFilter={status} onStatusChange={setStatus} serviceFilter={'All'} onServiceChange={()=>{}} groupByPincode={false} onGroupToggle={()=>{}} />
        {loading && <div style={{ padding: 12 }}>Loading...</div>}
        {error && <div style={{ padding: 12, color: '#b91c1c' }}>{error}</div>}
        <ApplicationTable items={items} selected={selected} onToggle={toggle} onView={onView} onBulkAction={onBulkAction} />
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Showing {items.length} of {total} applications</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}
            >
              Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Page {page}</div>
            <button 
              disabled={items.length < 20} 
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: items.length < 20 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}
            >
              Next
            </button>
          </div>
        </div>
      </Card>
      <AssignmentModal open={assignOpen} onClose={() => setAssignOpen(false)} selectedIds={[...selected]} onAssigned={onAssigned} />
    </div>
  );
}
