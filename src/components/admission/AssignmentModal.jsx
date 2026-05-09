import React, { useState } from 'react';
import { Modal, useToast } from '../UI';

export default function AssignmentModal({ open, onClose, selectedIds = [], onAssigned }) {
  const [course, setCourse] = useState('');
  const [internship, setInternship] = useState('');
  const [saving, setSaving] = useState(false);
  const showToast = useToast();
  const [courses, setCourses] = useState([]);
  const [previewItems, setPreviewItems] = useState([]);
  const [programType, setProgramType] = useState('course');

  React.useEffect(() => {
    let active = true;
    async function loadCourses() {
      try {
        const res = await fetch('/api/v2/courses', { credentials: 'include' });
        if (!res.ok) return;
        const j = await res.json();
        if (!active) return;
        setCourses(j.data || j.courses || j || []);
      } catch (e) {}
    }
    if (open) loadCourses();
    return () => { active = false; };
  }, [open]);

  React.useEffect(() => {
    let active = true;
    async function loadPreview() {
      if (!open || !selectedIds || !selectedIds.length) { setPreviewItems([]); return; }
      try {
        const res = await fetch('/api/v2/admission/preview', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds }) });
        if (!res.ok) return;
        const j = await res.json();
        if (!active) return;
        setPreviewItems(j.data || j || []);
      } catch (e) { setPreviewItems([]); }
    }
    loadPreview();
    return () => { active = false; };
  }, [open, selectedIds]);

  async function assign() {
    try {
      setSaving(true);
      const res = await fetch('/api/v2/admission/assign', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, assignedCourse: course, assignedInternship: internship }) });
      if (!res.ok) throw new Error('Failed to assign');
      onAssigned && onAssigned();
      onClose && onClose();
    } catch (e) {
      console.error(e);
      showToast(e.message || 'Failed to assign', { duration: 5000 });
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${selectedIds.length} application(s)`}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Course</label>
          <select value={course} onChange={(e) => setCourse(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <option value="">-- Select course --</option>
            {courses.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.title || c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Internship</label>
          <input value={internship} onChange={(e) => setInternship(e.target.value)} placeholder="Internship program" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Program Type</label>
            <select value={programType} onChange={(e) => setProgramType(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <option value="course">Course</option>
              <option value="internship">Internship</option>
              <option value="placement_program">Placement Program</option>
            </select>
          </div>

          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Preview ({previewItems.length})</div>
            <div style={{ maxHeight: 160, overflow: 'auto', border: '1px solid #f1f5f9', borderRadius: 8, padding: 8, background: '#fff' }}>
              {previewItems.length === 0 && <div style={{ color: '#64748b' }}>No items selected or preview unavailable.</div>}
              {previewItems.map(it => (
                <div key={it._id || it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid #f8fafc' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{it.fullName}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{it.admissionStatus} • {it.paymentStatus}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {it.assignedCourse ? <div style={{ fontSize: 12, color: '#94a3b8' }}>Course: {it.assignedCourse}</div> : null}
                    {it.assignedInternship ? <div style={{ fontSize: 12, color: '#94a3b8' }}>Internship: {it.assignedInternship}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
            <button 
              onClick={onClose} 
              style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              onClick={assign} 
              disabled={saving || (!course && !internship)} 
              style={{ 
                padding: '10px 24px', 
                borderRadius: 10, 
                border: 'none', 
                background: '#6366f1', 
                color: '#fff', 
                fontWeight: 700, 
                cursor: (saving || (!course && !internship)) ? 'not-allowed' : 'pointer',
                opacity: (saving || (!course && !internship)) ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(99,102,241,0.2)'
              }}
            >
              {saving ? 'Assigning...' : `Assign ${selectedIds.length} Student(s)`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
