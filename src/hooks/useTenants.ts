import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export interface TenantApi {
  id: number;
  user_details?: { id:number; username?: string; email?: string; first_name?: string; last_name?: string };
  tenant_type?: number; // id reference
  apartment?: number; // id reference
  lease_start?: string;
  lease_end?: string;
  phone_number?: string;
  emergency_contact?: string;
  created_at?: string;
}

const hdrs = () => ({ 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' });

export const useTenants = (filters?: { apartment_id?: number; tenant_type_id?: number; estate_id?: number }) => {
  const [data, setData] = useState<TenantApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = () => {
    if (filters?.estate_id) return `/api/tenants/tenants/by_estate/?estate_id=${filters.estate_id}`;
    const params = new URLSearchParams();
    if (filters?.apartment_id) params.append('apartment_id', String(filters.apartment_id));
    if (filters?.tenant_type_id) params.append('tenant_type_id', String(filters.tenant_type_id));
    const qs = params.toString();
    return `/api/tenants/tenants/${qs ? `?${qs}` : ''}`;
  };

  const fetchTenants = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(buildUrl(), { baseURL: 'http://localhost:8000', headers: hdrs() });
      setData(Array.isArray(res.data) ? res.data : []);
      console.log(res.data);
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [filters?.apartment_id, filters?.tenant_type_id, filters?.estate_id]);

  useEffect(()=>{ fetchTenants(); }, [fetchTenants]);

  return { tenants:data, loading, error, refresh:fetchTenants };
};
