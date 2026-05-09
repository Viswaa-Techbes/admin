import React, { useState } from 'react';
import { PageHeader, Card, SearchFilter, useToast } from '../UI';
import useAdmissionApplications from './useAdmissionApplications';
import ApplicationTable from './ApplicationTable';

export default function StudentProfilesPage({ onView }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('approved'); // Default to approved students
  const toast = useToast();
  
  // Fetch only students (approved, enrolled, completed)
  const { items, loading, error, total, refresh } = useAdmissionApplications({ 
    page, 
    limit: 50, 
    search, 
    status: status === 'All' ? 'approved,enrolled,completed' : status 
  });

  async function handleAction(action, id) {
    try {
      if (action === 'delete') {
        if (!window.confirm("Delete student profile permanently?")) return;
        const res = await fetch(`/api/v2/admission/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast('Student profile deleted');
      } else if (action === 'suspend' || action === 'approve') {
        const newStatus = action === 'suspend' ? 'suspended' : 'approved';
        const res = await fetch(`/api/v2/admission/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admissionStatus: newStatus })
        });
        if (!res.ok) throw new Error('Status update failed');
        toast(`Student status updated to ${newStatus}`);
      }
      refresh();
    } catch (e) {
      toast(e.message || 'Action failed');
    }
  }

  return (
    <div>
      <PageHeader title="Student Management" subtitle={`Managing ${total} enrolled students`} />
      <Card style={{ padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <SearchFilter 
            searchQuery={search} 
            onSearchChange={setSearch} 
            statusFilter={status} 
            onStatusChange={setStatus} 
            serviceFilter={'All'} 
            onServiceChange={()=>{}} 
            groupByPincode={false} 
            onGroupToggle={()=>{}} 
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {['approved', 'enrolled', 'completed', 'suspended', 'All'].map(s => (
              <button 
                key={s} 
                onClick={() => setStatus(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: status === s ? '#6366f1' : '#fff',
                  color: status === s ? '#fff' : '#64748b',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && <div style={{ padding: 20, textAlign: 'center' }}>Loading students...</div>}
        {error && <div style={{ padding: 20, color: '#b91c1c' }}>{error}</div>}
        
        {!loading && !error && (
          <>
            <ApplicationTable 
              items={items} 
              onView={onView} 
              onBulkAction={(action, id) => {
                if (action === 'approve' || action === 'reject') handleAction(action, id);
                else if (action === 'delete') handleAction('delete', id);
                else if (action === 'suspend') handleAction('suspend', id);
              }} 
            />
            
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Showing {items.length} students</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', px: 12, fontSize: 13, fontWeight: 600 }}>Page {page}</div>
                <button 
                  disabled={items.length < 50} 
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: items.length < 50 ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
