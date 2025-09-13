import { useCallback, useEffect, useState } from 'react';

export interface EstateApi {
  id: number;
  name: string;
  address?: string;
  size?: string;
  description?: string;
  created_at?: string;
}

export interface ApartmentApi { id: number; number?: string; size?: string; rent_amount?: string; number_of_rooms?: number; color?: string; description?: string; amenities?: any[]; furnishings?: any[]; block?: { id:number; name:string; estate?: { id:number } }; }
export interface BlockApi { id: number; name: string; description?: string; }

// Added input helper types for nested create/update
interface CreateApartmentInput { id?: number; number?: string; size?: string; rent_amount?: string | number; number_of_rooms?: string | number; color?: string; description?: string; amenities?: number[]; furnishings?: number[]; }
interface CreateBlockInput { id?: number; name?: string; description?: string; apartments?: CreateApartmentInput[]; }

interface EstateMetrics {
  blocks: number;
  apartments: number;
  availableApartments: number;
  loading: boolean;
  error: string | null;
}

interface EstateStructureEntry {
  loading: boolean;
  error: string | null;
  blocks: Array<BlockApi & { apartments: ApartmentApi[]; apartmentsLoading: boolean; apartmentsError: string | null }>;
}

const apiBase = 'http://127.0.0.1:8000';

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json'
});

// Added: Available Apartments API types
export interface AvailableApartment {
  id: number;
  number?: string;
  rent_amount?: string;
  number_of_rooms?: number;
  size?: string;
  color?: string;
  description?: string;
  allocation_score?: number;
  rent_per_room?: number;
  rent_per_sqm?: number;
  is_furnished?: boolean;
  amenities_count?: number;
  furnishings_count?: number;
  room_category?: string;
  size_category?: string;
  rent_category?: string;
  full_address?: string;
  block?: {
    id: number;
    name: string;
    description?: string;
    estate?: { id: number; name: string; address?: string; description?: string };
  };
  amenities?: { id: number; name: string; description?: string }[];
  furnishings?: { id: number; name: string; description?: string }[];
  created_at?: string;
  updated_at?: string;
}
interface AvailableApartmentsSummary {
  by_room_category?: Record<string, number>;
  by_size_category?: Record<string, number>;
  by_rent_category?: Record<string, number>;
  by_estate?: Record<string, number>;
  average_rent?: number;
  average_size?: number;
  furnished_count?: number;
  unfurnished_count?: number;
}
interface AvailableApartmentsResponse {
  total_available?: number;
  apartments?: AvailableApartment[];
  summary?: AvailableApartmentsSummary;
  filters_applied?: Record<string, any>;
  error?: string;
}

export const useEstates = () => {
  const [data, setData] = useState<EstateApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [metricsCache, setMetricsCache] = useState<Record<number, EstateMetrics>>({});
  const [structureCache, setStructureCache] = useState<Record<number, EstateStructureEntry>>({});
  // Added: available apartments state
  const [availableState, setAvailableState] = useState<{
    loading: boolean;
    error: string | null;
    apartments: AvailableApartment[];
    summary: AvailableApartmentsSummary | null;
    total: number;
    filters: Record<string, any>;
  }>({ loading: false, error: null, apartments: [], summary: null, total: 0, filters: {} });

  const fetchEstates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/core/estates/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEstateMetrics = useCallback(async (estateId: number) => {
    if (metricsCache[estateId]?.loading) return;
    setMetricsCache(prev => ({
      ...prev,
      [estateId]: prev[estateId]
        ? { ...prev[estateId], loading: true, error: null }
        : { blocks: 0, apartments: 0, availableApartments: 0, loading: true, error: null }
    }));
    try {
      const blocksRes = await fetch(`${apiBase}/api/core/blocks/?estate_id=${estateId}`, { headers: authHeaders() });
      const blocksJson = blocksRes.ok ? await blocksRes.json() : [];
      let apartmentsCount = 0;
      for (const b of blocksJson.slice(0, 5)) {
        try {
          const aRes = await fetch(`${apiBase}/api/core/apartments/?block_id=${b.id}`, { headers: authHeaders() });
          if (aRes.ok) {
            const aJson = await aRes.json();
            if (Array.isArray(aJson)) apartmentsCount += aJson.length;
          }
        } catch { /* ignore */ }
      }
      // UPDATED: use new available apartments response (filtered server-side)
      const availRes = await fetch(`${apiBase}/api/core/apartments/available/?estate_id=${estateId}`, { headers: authHeaders() });
      let availableForEstate = 0;
      if (availRes.ok) {
        const availJson: AvailableApartmentsResponse = await availRes.json();
        availableForEstate = availJson.total_available ??
          (Array.isArray(availJson.apartments) ? availJson.apartments.length : 0);
      }
      setMetricsCache(prev => ({
        ...prev,
        [estateId]: {
          blocks: blocksJson.length || 0,
            apartments: apartmentsCount,
            availableApartments: availableForEstate,
            loading: false,
            error: null
        }
      }));
    } catch (e: any) {
      setMetricsCache(prev => ({
        ...prev,
        [estateId]: { blocks: 0, apartments: 0, availableApartments: 0, loading: false, error: e.message }
      }));
    }
  }, [metricsCache]);
  
  // Added: fetchAvailableApartments with smart filtering support
  const fetchAvailableApartments = useCallback(async (filters: {
    min_rooms?: number | string;
    max_rooms?: number | string;
    min_rent?: number | string;
    max_rent?: number | string;
    min_size?: number | string;
    max_size?: number | string;
    estate_id?: number | string;
    block_id?: number | string;
    amenities?: (number | string)[];
    furnishings?: (number | string)[];
  } = {}) => {
    setAvailableState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
        if (Array.isArray(v)) {
          v.forEach(item => params.append(k, String(item)));
        } else {
          params.append(k, String(v));
        }
      });
      const qs = params.toString();
      const res = await fetch(`${apiBase}/api/core/apartments/available/${qs ? `?${qs}` : ''}`, {
        headers: authHeaders()
      });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const json: AvailableApartmentsResponse | AvailableApartment[] = await res.json();
      // Backwards compatibility: if API returns a plain array
      let apartments: AvailableApartment[] = [];
      let summary: AvailableApartmentsSummary | null = null;
      let total = 0;
      let filtersApplied: Record<string, any> = {};
      if (Array.isArray(json)) {
        apartments = json;
        total = json.length;
      } else {
        apartments = json.apartments || [];
        total = json.total_available ?? apartments.length;
        summary = json.summary || null;
        filtersApplied = json.filters_applied || {};
      }
      setAvailableState({
        loading: false,
        error: null,
        apartments,
        summary,
        total,
        filters: filtersApplied
      });
      return { apartments, summary, total, filters: filtersApplied };
    } catch (e: any) {
      setAvailableState(prev => ({ ...prev, loading: false, error: e.message || 'Failed to load' }));
      return { apartments: [], summary: null, total: 0, filters: {} };
    }
  }, []);
  
  const fetchEstateStructure = useCallback(async (estateId: number) => {
    setStructureCache(prev => ({
      ...prev,
      [estateId]: prev[estateId] ? { ...prev[estateId], loading: true, error: null } : { loading: true, error: null, blocks: [] }
    }));
    try {
      const blocksRes = await fetch(`${apiBase}/api/core/blocks/?estate_id=${estateId}`, { headers: authHeaders() });
      const blocksJson: BlockApi[] = blocksRes.ok ? await blocksRes.json() : [];
      const blocksWithMeta: EstateStructureEntry['blocks'] = blocksJson.map(b => ({ ...b, apartments: [], apartmentsLoading: true, apartmentsError: null }));
      setStructureCache(prev => ({ ...prev, [estateId]: { loading: false, error: null, blocks: blocksWithMeta } }));
      // fetch apartments per block in parallel
      await Promise.all(blocksWithMeta.map(async (b) => {
        try {
          const aRes = await fetch(`${apiBase}/api/core/apartments/?block_id=${b.id}`, { headers: authHeaders() });
          if (aRes.ok) {
            const aJson = await aRes.json();
            setStructureCache(prev => ({
              ...prev,
              [estateId]: {
                ...prev[estateId],
                blocks: prev[estateId].blocks.map(bl => bl.id === b.id ? { ...bl, apartments: Array.isArray(aJson)?aJson:[], apartmentsLoading:false } : bl)
              }
            }));
          } else {
            throw new Error('Apartments fetch failed');
          }
        } catch (err: any) {
          setStructureCache(prev => ({
            ...prev,
            [estateId]: {
              ...prev[estateId],
              blocks: prev[estateId].blocks.map(bl => bl.id === b.id ? { ...bl, apartments: [], apartmentsLoading:false, apartmentsError: err.message } : bl)
            }
          }));
        }
      }));
    } catch (e: any) {
      setStructureCache(prev => ({ ...prev, [estateId]: { loading: false, error: e.message, blocks: [] } }));
    }
  }, []);

  const createEstate = useCallback(async (payload: { name: string; address: string; size?: string; description?: string; blocks?: CreateBlockInput[] }) => {
    setCreating(true);
    setCreateError(null);
    try {
      const { blocks = [], ...estateData } = payload;
      // 1. Create estate (no nested support server-side)
      const res = await fetch(`${apiBase}/api/core/estates/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(estateData) });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
      const estate = await res.json();
      const estateId = estate.id;
      // 2. Create blocks & apartments sequentially (ignore failures per item but collect first error)
      for (const b of blocks.filter(b=> (b.name||'').trim())) {
        try {
          const bRes = await fetch(`${apiBase}/api/core/blocks/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ estate: estateId, name: b.name, description: b.description||undefined }) });
          if (!bRes.ok) throw new Error(`Block fail (${bRes.status})`);
          const bJson = await bRes.json();
          const blockId = bJson.id;
          for (const a of (b.apartments||[]).filter(a=> (a.number||'').trim())) {
            try {
              const aptPayload:any = { block: blockId, number: a.number };
              if (a.size) aptPayload.size = a.size; if (a.rent_amount) aptPayload.rent_amount = parseFloat(a.rent_amount as any); if (a.number_of_rooms) aptPayload.number_of_rooms = parseInt(a.number_of_rooms as any); if (a.color) aptPayload.color = a.color; if (a.description) aptPayload.description = a.description; if (a.amenities?.length) aptPayload.amenities = a.amenities; if (a.furnishings?.length) aptPayload.furnishings = a.furnishings;
              await fetch(`${apiBase}/api/core/apartments/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(aptPayload) });
            } catch { /* ignore apartment error */ }
          }
        } catch (err:any) { if (!createError) setCreateError(err.message); }
      }
      await fetchEstates();
      // Preload structure if blocks were added
      if (blocks.length) fetchEstateStructure(estateId);
      return true;
    } catch (e:any) {
      setCreateError(e.message);
      return false;
    } finally { setCreating(false); }
  }, [fetchEstates, fetchEstateStructure, createError]);

  const updateEstate = useCallback(async (estateId: number, payload: { name?: string; address?: string; size?: string; description?: string; blocks?: CreateBlockInput[] }) => {
    try {
      const { blocks = [], ...estateData } = payload;
      // 1. Update estate core fields if any provided
      if (Object.keys(estateData).length) {
        const res = await fetch(`${apiBase}/api/core/estates/${estateId}/`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(estateData) });
        if (!res.ok) throw new Error(`Update failed (${res.status})`);
      }
      // 2. Process blocks
      for (const b of blocks.filter(b=> (b.name||'').trim())) {
        if (b.id) {
          // existing block update
            try { await fetch(`${apiBase}/api/core/blocks/${b.id}/`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ name: b.name, description: b.description||undefined }) }); } catch {/* ignore */}
        } else {
          // create new block
          try {
            const bRes = await fetch(`${apiBase}/api/core/blocks/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ estate: estateId, name: b.name, description: b.description||undefined }) });
            if (bRes.ok) {
              const bJson = await bRes.json();
              b.id = bJson.id; // mutate local to allow apartments creation
            }
          } catch {/* ignore */}
        }
        // Apartments inside block
        if (b.id && b.apartments) {
          for (const a of b.apartments.filter(a=> (a.number||'').trim())) {
            const aptPayload:any = { number: a.number };
            if (a.size) aptPayload.size = a.size; if (a.rent_amount) aptPayload.rent_amount = parseFloat(a.rent_amount as any); if (a.number_of_rooms) aptPayload.number_of_rooms = parseInt(a.number_of_rooms as any); if (a.color) aptPayload.color = a.color; if (a.description) aptPayload.description = a.description;
            // FIX: filter out null/undefined amenity IDs
            aptPayload.amenities = (a.amenities||[]).filter(am=> am!=null);
            aptPayload.furnishings = a.furnishings||[];
            if (a.id) {
              try { await fetch(`${apiBase}/api/core/apartments/${a.id}/`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(aptPayload) }); } catch {/* ignore */}
            } else {
              try { await fetch(`${apiBase}/api/core/apartments/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ block: b.id, ...aptPayload }) }); } catch{/* ignore */}
            }
          }
        }
      }
      await fetchEstates();
      if (blocks.length) fetchEstateStructure(estateId);
      return true;
    } catch (e) {
      return false;
    }
  }, [fetchEstates, fetchEstateStructure]);

  const deleteEstate = useCallback(async (estateId: number) => {
    try {
      const res = await fetch(`${apiBase}/api/core/estates/${estateId}/`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await fetchEstates();
      setMetricsCache(prev => {
        const copy = { ...prev };
        delete copy[estateId];
        return copy;
      });
      setStructureCache(prev => {
        const copy = { ...prev };
        delete copy[estateId];
        return copy;
      });
      return true;
    } catch {
      return false;
    }
  }, [fetchEstates]);

  useEffect(() => { fetchEstates(); }, [fetchEstates]);

  return {
    estates: data,
    loading,
    error,
    refresh: fetchEstates,
    createEstate,
    creating,
    createError,
    fetchEstateMetrics,
    metricsCache,
    fetchEstateStructure,
    structureCache,
    updateEstate,
    deleteEstate,
    // Added exports
    availableState,
    fetchAvailableApartments
  };
};
