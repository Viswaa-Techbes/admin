import React, { useState } from 'react';
import { Modal } from '../UI';

export default function AssignmentModal({ open, onClose, selectedIds = [], onAssigned }) {
  const [course, setCourse] = useState('');
  const [internship, setInternship] = useState('');
  const [saving, setSaving] = useState(false);

  async function assign() {
    try {
      setSaving(true);
      const res = await fetch('/api/v2/admission/assign', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, assignedCourse: course, assignedInternship: internship }) });
      if (!res.ok) throw new Error('Failed to assign');
      onAssigned && onAssigned();
      onClose && onClose();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to assign');
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${selectedIds.length} application(s)`}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Course</label>
          <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Course name or code" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Internship</label>
          <input value={internship} onChange={(e) => setInternship(e.target.value)} placeholder="Internship program" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8 }}>Cancel</button>
          <button onClick={assign} disabled={saving} style={{ padding: '8px 12px', borderRadius: 8 }}>{saving ? 'Assigning...' : 'Assign'}</button>
        </div>
      </div>
    </Modal>
  );
}
