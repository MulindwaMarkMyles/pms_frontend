import { useEffect, useState, useCallback } from 'react';

interface DashboardStats {
  estates: number;
  tenants: number;
  complaints: number;
  pendingComplaints: number;
  paymentsPending: number;
  paymentsOverdue: number;
  monthlyRevenue: number; // sum of paid payments (current month)
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Helper fetch with auth
const authFetch = async (url: string) => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`http://127.0.0.1:8000${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

export const useManagerDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    estates: 0,
    tenants: 0,
    complaints: 0,
    pendingComplaints: 0,
    paymentsPending: 0,
    paymentsOverdue: 0,
    monthlyRevenue: 0,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const load = useCallback(async () => {
    setStats(s => ({ ...s, loading: true, error: null }));
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [estates, tenants, complaints, pendingPayments, overduePayments, paidPayments] = await Promise.all([
        authFetch('/api/core/estates/'),
        authFetch('/api/tenants/tenants/'),
        authFetch('/api/complaints/complaints/'),
        authFetch('/api/payments/payments/pending_payments/'),
        authFetch('/api/payments/payments/overdue_payments/'),
        authFetch(`/api/payments/payments/?status_id=2&month=${month}&year=${year}`)
      ]);

      const monthlyRevenue = Array.isArray(paidPayments)
        ? paidPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
        : 0;

      const pendingComplaints = Array.isArray(complaints)
        ? complaints.filter((c: any) => (c.status?.name || '').toLowerCase() === 'open').length
        : 0;

      setStats({
        estates: estates?.length || 0,
        tenants: tenants?.length || 0,
        complaints: complaints?.length || 0,
        pendingComplaints,
        paymentsPending: pendingPayments?.length || 0,
        paymentsOverdue: overduePayments?.length || 0,
        monthlyRevenue,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (e: any) {
      setStats(s => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...stats, refresh: load };
};
