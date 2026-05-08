import React from 'react';
import { PageHeader, Card } from '../UI';
import useAdmissionApplications from './useAdmissionApplications';
import ApplicationTable from './ApplicationTable';

export default function StudentProfilesPage({ onView }) {
  const { items, loading, error } = useAdmissionApplications({ page: 1, limit: 50 });

  return (
    <div>
      <PageHeader title="Student Profiles" subtitle="View and manage enrolled students" />
      <Card style={{ padding: 16 }}>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
        <ApplicationTable items={items} onView={onView} />
      </Card>
    </div>
  );
}
