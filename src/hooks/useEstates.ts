import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export interface EstateApi {
  id: number;
  name: string;
  address?: string;
  size?: string;
  description?: string;
  created_at?: string;
  image?: string; // URL string from backend
}

export interface ApartmentApi { 
  id: number; 
  number?: string; 
  size?: string; 
  rent_amount?: string; 
  number_of_rooms?: number; 
  color?: string; 
  description?: string; 
  amenities?: any[]; 
  furnishings?: any[]; 
  image?: string; // URL from backend
  block?: { id:number; name:string; estate?: { id:number } }; 
}
export interface BlockApi { id: number; name: string; description?: string; }

// Added input helper types for nested create/update
interface CreateApartmentInput { 
  id?: number; 
  number?: string; 
  size?: string; 
  rent_amount?: string | number; 
  number_of_rooms?: string | number; 
  color?: string; 
  description?: string; 
  amenities?: number[]; 
  furnishings?: number[]; 
  image?: File; // File object for upload
}

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

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
});

const authHeadersJson = () => ({
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
      const res = await axios.get('/api/core/estates/', { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
      setData(Array.isArray(res.data) ? res.data : []);
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
      const blocksRes = await axios.get(`/api/core/blocks/?estate_id=${estateId}`, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
      const blocksJson = blocksRes.data;
      let apartmentsCount = 0;
      for (const b of blocksJson.slice(0, 5)) {
        try {
          const aRes = await axios.get(`/api/core/apartments/?block_id=${b.id}`, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
          if (aRes.status === 200) {
            const aJson = aRes.data;
            if (Array.isArray(aJson)) apartmentsCount += aJson.length;
          }
        } catch { /* ignore */ }
      }
      // UPDATED: use new available apartments response (filtered server-side)
      const availRes = await axios.get(`/api/core/apartments/available/?estate_id=${estateId}`, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
      let availableForEstate = 0;
      if (availRes.status === 200) {
        const availJson: AvailableApartmentsResponse = availRes.data;
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
      const res = await axios.get(`/api/core/apartments/available/${qs ? `?${qs}` : ''}`, {
        baseURL: 'http://localhost:8000',
        headers: authHeadersJson()
      });
      const json: AvailableApartmentsResponse | AvailableApartment[] = res.data;
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
      const blocksRes = await axios.get(`/api/core/blocks/?estate_id=${estateId}`, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
      const blocksJson: BlockApi[] = blocksRes.data;
      const blocksWithMeta: EstateStructureEntry['blocks'] = blocksJson.map(b => ({ ...b, apartments: [], apartmentsLoading: true, apartmentsError: null }));
      setStructureCache(prev => ({ ...prev, [estateId]: { loading: false, error: null, blocks: blocksWithMeta } }));
      // fetch apartments per block in parallel
      await Promise.all(blocksWithMeta.map(async (b) => {
        try {
          const aRes = await axios.get(`/api/core/apartments/?block_id=${b.id}`, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
          if (aRes.status === 200) {
            const aJson = aRes.data;
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

  const createEstate = useCallback(async (payload: { name: string; address: string; size?: string; description?: string; blocks?: CreateBlockInput[]; image?: File }) => {
    setCreating(true);
    setCreateError(null);
    try {
      const { blocks = [], image, ...estateData } = payload;
      
      // 1. Create estate with image using FormData
      const formData = new FormData();
      formData.append('name', estateData.name);
      formData.append('address', estateData.address);
      if (estateData.size) formData.append('size', estateData.size);
      if (estateData.description) formData.append('description', estateData.description);
      if (image) formData.append('image', image);

      const res = await axios.post('/api/core/estates/', formData, { 
        baseURL: 'http://localhost:8000', 
        headers: authHeaders() // Don't set Content-Type, let browser set it with boundary
      });
      const estate = res.data;
      const estateId = estate.id;
      
      // 2. Create blocks & apartments sequentially (ignore failures per item but collect first error)
      for (const b of blocks.filter(b=> (b.name||'').trim())) {
        try {
          const bRes = await axios.post('/api/core/blocks/', { estate: estateId, name: b.name, description: b.description||undefined }, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
          const bJson = bRes.data;
          const blockId = bJson.id;
          for (const a of (b.apartments||[]).filter(a=> (a.number||'').trim())) {
            try {
              // Use FormData for apartment with image
              if (a.image) {
                const aptFormData = new FormData();
                aptFormData.append('block', String(blockId));
                aptFormData.append('number', a.number);
                if (a.size) aptFormData.append('size', a.size);
                if (a.rent_amount) aptFormData.append('rent_amount', String(a.rent_amount));
                if (a.number_of_rooms) aptFormData.append('number_of_rooms', String(a.number_of_rooms));
                if (a.color) aptFormData.append('color', a.color);
                if (a.description) aptFormData.append('description', a.description);
                if (a.amenities?.length) {
                  a.amenities.forEach(amenityId => aptFormData.append('amenities', String(amenityId)));
                }
                if (a.furnishings?.length) {
                  a.furnishings.forEach(furnishingId => aptFormData.append('furnishings', String(furnishingId)));
                }
                aptFormData.append('image', a.image);
                await axios.post('/api/core/apartments/', aptFormData, { baseURL: 'http://localhost:8000', headers: authHeaders() });
              } else {
                // JSON for apartment without image
                const aptPayload:any = { block: blockId, number: a.number };
                if (a.size) aptPayload.size = a.size; 
                if (a.rent_amount) aptPayload.rent_amount = parseFloat(a.rent_amount as any); 
                if (a.number_of_rooms) aptPayload.number_of_rooms = parseInt(a.number_of_rooms as any); 
                if (a.color) aptPayload.color = a.color; 
                if (a.description) aptPayload.description = a.description; 
                if (a.amenities?.length) aptPayload.amenities = a.amenities; 
                if (a.furnishings?.length) aptPayload.furnishings = a.furnishings;
                await axios.post('/api/core/apartments/', aptPayload, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
              }
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

  const updateEstate = useCallback(async (estateId: number, payload: { name?: string; address?: string; size?: string; description?: string; blocks?: CreateBlockInput[]; image?: File }) => {
    try {
      const { blocks = [], image, ...estateData } = payload;
      
      // 1. Update estate core fields (with image if provided)
      if (Object.keys(estateData).length > 0 || image) {
        const formData = new FormData();
        if (estateData.name) formData.append('name', estateData.name);
        if (estateData.address) formData.append('address', estateData.address);
        if (estateData.size) formData.append('size', estateData.size);
        if (estateData.description) formData.append('description', estateData.description);
        if (image) formData.append('image', image);

        await axios.patch(`/api/core/estates/${estateId}/`, formData, { 
          baseURL: 'http://localhost:8000', 
          headers: authHeaders() // Don't set Content-Type, let browser set it with boundary
        });
      }
      
      // 2. Process blocks
      for (const b of blocks.filter(b=> (b.name||'').trim())) {
        if (b.id) {
          // existing block update
          try { await axios.patch(`/api/core/blocks/${b.id}/`, { name: b.name, description: b.description||undefined }, { baseURL: 'http://localhost:8000', headers: authHeadersJson() }); } catch {/* ignore */}
        } else {
          // create new block
          try {
            const bRes = await axios.post('/api/core/blocks/', { estate: estateId, name: b.name, description: b.description||undefined }, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
            const bJson = bRes.data;
            b.id = bJson.id; // mutate local to allow apartments creation
          } catch {/* ignore */}
        }
        // Apartments inside block
        if (b.id && b.apartments) {
          for (const a of b.apartments.filter(a=> (a.number||'').trim())) {
            // Use FormData if image is present
            if (a.image) {
              const aptFormData = new FormData();
              aptFormData.append('number', a.number);
              if (a.size) aptFormData.append('size', a.size);
              if (a.rent_amount) aptFormData.append('rent_amount', String(a.rent_amount));
              if (a.number_of_rooms) aptFormData.append('number_of_rooms', String(a.number_of_rooms));
              if (a.color) aptFormData.append('color', a.color);
              if (a.description) aptFormData.append('description', a.description);
              const validAmenities = (a.amenities||[]).filter(am=> am!=null);
              if (validAmenities.length) {
                validAmenities.forEach(amenityId => aptFormData.append('amenities', String(amenityId)));
              }
              if (a.furnishings?.length) {
                a.furnishings.forEach(furnishingId => aptFormData.append('furnishings', String(furnishingId)));
              }
              aptFormData.append('image', a.image);

              if (a.id) {
                try { await axios.patch(`/api/core/apartments/${a.id}/`, aptFormData, { baseURL: 'http://localhost:8000', headers: authHeaders() }); } catch {/* ignore */}
              } else {
                aptFormData.append('block', String(b.id));
                try { await axios.post('/api/core/apartments/', aptFormData, { baseURL: 'http://localhost:8000', headers: authHeaders() }); } catch{/* ignore */}
              }
            } else {
              // JSON for apartment without image
              const aptPayload:any = { number: a.number };
              if (a.size) aptPayload.size = a.size; 
              if (a.rent_amount) aptPayload.rent_amount = parseFloat(a.rent_amount as any); 
              if (a.number_of_rooms) aptPayload.number_of_rooms = parseInt(a.number_of_rooms as any); 
              if (a.color) aptPayload.color = a.color; 
              if (a.description) aptPayload.description = a.description;
              aptPayload.amenities = (a.amenities||[]).filter(am=> am!=null);
              aptPayload.furnishings = a.furnishings||[];
              
              if (a.id) {
                try { await axios.patch(`/api/core/apartments/${a.id}/`, aptPayload, { baseURL: 'http://localhost:8000', headers: authHeadersJson() }); } catch {/* ignore */}
              } else {
                try { await axios.post('/api/core/apartments/', { block: b.id, ...aptPayload }, { baseURL: 'http://localhost:8000', headers: authHeadersJson() }); } catch{/* ignore */}
              }
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
      await axios.delete(`/api/core/estates/${estateId}/`, { baseURL: 'http://localhost:8000', headers: authHeadersJson() });
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
