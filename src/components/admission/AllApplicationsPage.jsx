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
  function onBulkAction(action) {
    if (action === 'export') {
      const data = items.filter(it => selected.has(it._id || it.id));
      // simple CSV export
      const csv = [Object.keys(data[0]||{}).join(','), ...data.map(r => Object.values(r).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'admissions.csv'; a.click();
      toast('Export started');
    } else if (action === 'assign') {
      if (!selected.size) return toast('Select applications first');
      setAssignOpen(true);
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
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Showing {items.length} of {total}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
            <div>Page {page}</div>
            <button onClick={() => setPage(p => p+1)}>Next</button>
          </div>
        </div>
      </Card>
      <AssignmentModal open={assignOpen} onClose={() => setAssignOpen(false)} selectedIds={[...selected]} onAssigned={onAssigned} />
    </div>
  );
}
