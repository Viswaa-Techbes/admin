"use client";
import AdminGuard from '../../components/AdminGuard';

export const metadata = { title: 'Admin' };

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  );
}
