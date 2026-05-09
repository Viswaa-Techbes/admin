import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, PageHeader, SectionHeader } from '../UI';

export default function DomainAnalyticsPage({ domain, title }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v2/analytics/visitors/dashboard?domain=${encodeURIComponent(domain)}`, { credentials: 'include' });
        const payload = await res.json();
        if (active) setStats(payload.data || payload);
      } catch (e) {
        if (active) setError(e.message || 'Failed to load domain analytics');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [domain]);

  if (loading) return <Card style={{ padding: 20 }}>Loading {title} analytics...</Card>;
  if (error) return <Card style={{ padding: 20, color: '#b91c1c' }}>{error}</Card>;
  if (!stats) return null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PageHeader title={title} subtitle={`Analytics for ${domain}`} />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Total Visitors</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalVisitors || 0}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Visitors Today</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.todayVisitors || 0}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Returning Visitors</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.returningVisitors || 0}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Leads / Enquiries</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.leads || 0}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <SectionHeader title="Traffic Trends" />
          <div style={{ height: 240, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trafficTrends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <SectionHeader title="Top Cities" />
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(stats.topCities || []).slice(0,6).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#334155', textTransform: 'capitalize' }}>{c.city}</span>
                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{c.visitors}</span>
              </div>
            ))}
            {!(stats.topCities?.length) && <div style={{ fontSize: 13, color: '#94a3b8' }}>No data</div>}
          </div>
        </Card>
      </div>

      <Card style={{ padding: 16 }}>
        <SectionHeader title="Top Pages" />
        <div style={{ height: 240, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topPages || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{fontSize: 12}} />
              <YAxis dataKey="page" type="category" width={150} tick={{fontSize: 11}} />
              <Tooltip />
              <Bar dataKey="visitors" fill="#6366f1" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
