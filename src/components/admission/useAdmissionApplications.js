import { useState, useEffect, useRef } from 'react';

export default function useAdmissionApplications({ page = 1, limit = 20, search = '', status = 'All' } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const paramsRef = useRef({ page, limit, search, status });
  const timeoutRef = useRef(null);

  useEffect(() => {
    paramsRef.current = { page, limit, search, status };
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [page, limit, search, status]);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const p = paramsRef.current;
      const q = new URLSearchParams();
      q.set('page', p.page);
      q.set('limit', p.limit);
      if (p.search) q.set('search', p.search);
      if (p.status && p.status !== 'All') q.set('status', p.status);
      const res = await fetch('/api/v2/admission?' + q.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch admissions');
      const payload = await res.json();
      setItems(payload.items || payload.data || payload || []);
      setTotal((payload.total != null) ? payload.total : (payload.count || (payload.items || []).length));
    } catch (e) {
      setError(e.message || 'Failed');
    } finally { setLoading(false); }
  }

  return { items, loading, error, total, refresh: load, setItems };
}
