import React, { useState, useEffect } from 'react';
import { useEstates } from '../../hooks/useEstates';
import { Building, Home, RefreshCw, Plus, Edit, Trash2, Eye, EyeOff, X, Search, Table, TreePine, DoorOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function EstatesPage() {
  const {
    estates,
    loading,
    error,
    refresh,
    createEstate,
    creating,
    createError,
    fetchEstateMetrics,
    metricsCache,
    fetchEstateStructure,
    structureCache,
    updateEstate,
    deleteEstate,
    // NEW: available apartments
    availableState,
    fetchAvailableApartments
  } = useEstates();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<null | number>(null);
  const [form, setForm] = useState({ name: '', address: '', size: '', description: '' });
  const [createBlocks, setCreateBlocks] = useState<any[]>([]); // blocks for create modal
  const [editForm, setEditForm] = useState({ name: '', address: '', size: '', description: '' });
  const [editBlocks, setEditBlocks] = useState<any[]>([]); // blocks (existing + new) for edit modal
  const [amenities, setAmenities] = useState<any[]>([]); // fetched amenities for checkboxes
  const [selectedEstate, setSelectedEstate] = useState<number | null>(null);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number|null>(null); // added

  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<{ min_rooms?: string; max_rent?: string; estate_id?: string }>({});

  const filteredEstates = estates.filter(estate =>
    estate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (estate.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) return;
    const blocksPayload = createBlocks.filter(b=>b.name?.trim()).map(b=> ({
      name: b.name.trim(),
      description: b.description?.trim()||undefined,
      apartments: (b.apartments||[]).filter((a:any)=>a.number?.trim()).map((a:any)=> ({
        number:a.number.trim(),
        size:a.size?.trim()||undefined,
        rent_amount:a.rent_amount||undefined,
        number_of_rooms:a.number_of_rooms||undefined,
        color:a.color||undefined,
        description:a.description||undefined,
        amenities:a.amenities||[]
      }))
    }));
    const ok = await createEstate({ name: form.name.trim(), address: form.address.trim(), size: form.size.trim() || undefined, description: form.description.trim() || undefined, blocks: blocksPayload.length? blocksPayload: undefined } as any);
    if (ok) { setForm({ name: '', address: '', size: '', description: '' }); setCreateBlocks([]); setShowAddModal(false); }
  };

  const openEstate = (id: number) => {
    const newId = id === selectedEstate ? null : id;
    setSelectedEstate(newId);
    if (newId) { fetchEstateMetrics(newId); fetchEstateStructure(newId); setActiveBlock(null); }
  };

  const openEdit = (estateId: number) => {
    const est = estates.find(e => e.id === estateId);
    if (est) {
      setEditForm({ name: est.name || '', address: est.address || '', size: est.size || '', description: est.description || '' });
      const structure = structureCache[estateId];
      if (structure?.blocks) {
        setEditBlocks(structure.blocks.map((b:any)=> ({
          existing:true,
          id:b.id,
          name:b.name||'',
          description:b.description||'',
          apartments:(b.apartments||[]).map((a:any)=>({
            existing:true,
            id:a.id,
            number:a.number||'',
            size:a.size||'',
            rent_amount:a.rent_amount||'',
            number_of_rooms:a.number_of_rooms||'',
            color:a.color||'',
            description:a.description||'',
            // Store both ID and name mapping for cleaner UI while preserving IDs for API
            amenityIds:(a.amenities||[]).map((am:any)=>am.id),
            amenities:(a.amenities||[]).map((am:any)=>am.id) // keep original for backend
          }))
        })));
      } else {
        setEditBlocks([]);
        fetchEstateStructure(estateId);
      }
      setShowEditModal(estateId);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    const blocksPayload = editBlocks.map(b=> ({
      id: b.existing? b.id: undefined,
      name: b.name?.trim()||undefined,
      description: b.description?.trim()||undefined,
      apartments: (b.apartments||[]).filter((a:any)=>a.number?.trim()).map((a:any)=> ({
        id: a.existing? a.id: undefined,
        number:a.number.trim(),
        size:a.size?.trim()||undefined,
        rent_amount:a.rent_amount||undefined,
        number_of_rooms:a.number_of_rooms||undefined,
        color:a.color||undefined,
        description:a.description||undefined,
        amenities:a.amenities||[]
      }))
    })).filter(b=> b.name);
    const ok = await updateEstate(showEditModal, { name: editForm.name || undefined, address: editForm.address || undefined, size: editForm.size || undefined, description: editForm.description || undefined, blocks: blocksPayload.length? blocksPayload: undefined } as any);
    if (ok) setShowEditModal(null);
  };

  const handleDeleteEstate = async (id:number) => {
    if (!window.confirm('Delete this estate? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      await deleteEstate?.(id);
      if (selectedEstate === id) setSelectedEstate(null);
    } finally {
      setDeletingId(null);
    }
  };

  const estateStructure = (estateId: number) => structureCache[estateId];

  useEffect(()=> {
    const token = localStorage.getItem('access_token');
    fetch('/api/core/amenities/', { headers: { 'Authorization': `Bearer ${token||''}` } })
      .then(r=> r.ok? r.json(): [])
      .then(data=> { if (Array.isArray(data)) setAmenities(data); })
      .catch(()=>{});
  }, []);

  // When modal opens fetch with current filters
  useEffect(()=> {
    if (showAvailableModal) {
      fetchAvailableApartments({
        ...(availableFilters.min_rooms ? { min_rooms: availableFilters.min_rooms } : {}),
        ...(availableFilters.max_rent ? { max_rent: availableFilters.max_rent } : {}),
        ...(availableFilters.estate_id ? { estate_id: availableFilters.estate_id } : {}),
      });
    }
  }, [showAvailableModal, availableFilters, fetchAvailableApartments]);

  const fetchAmenityNames = (amenityIds: any[]): string[] => {
    if (!Array.isArray(amenityIds) || !amenities.length) return [];
    
    return amenityIds
      .filter(id => id !== null && id !== undefined)
      .map(id => {
        const found = amenities.find(am => am.id === id);
        return found ? found.name : String(id);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 lg:p-6 xl:p-8" style={{ paddingTop:'100px'}}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl shadow-xl mb-8 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Building className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Property Management
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                  Live estates, blocks and apartments overview
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              {/* Added flex-wrap for small screens */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={()=> setShowAvailableModal(true)}                             
                  className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium text-indigo-700"
                >
                  <Home className="w-5 h-5" />
                  Available
                </button>
                <button
                  onClick={refresh}
                  className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium text-blue-700"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Estate</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-xl mb-8 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Search estates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-white/30 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-3 border border-white/30 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors flex items-center gap-2">
                <span className="material-icons text-sm">filter_list</span>
                <span className="hidden sm:inline">Filter</span>
              </button>
              <button className="px-4 py-3 border border-white/30 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors flex items-center gap-2">
                <span className="material-icons text-sm">sort</span>
                <span className="hidden sm:inline">Sort</span>
              </button>
            </div>
          </div>
          {loading && (
            <div className="text-sm text-blue-600 flex items-center gap-2">
              <span className="material-icons text-base animate-spin">progress_activity</span>
              Loading estates...
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <span className="material-icons text-base">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Mobile Cards (hidden ≥ sm) */}
        {filteredEstates.length > 0 && window.innerWidth < 640 ? (
          <div className=" space-y-4 mb-10">
            {filteredEstates.map(estate => {
              const metrics = metricsCache[estate.id];
              const structure = structureCache[estate.id];
              const expanded = selectedEstate === estate.id;
              return (
                <div
                  key={estate.id}
                  className={`rounded-2xl border border-white/30 bg-white/70 backdrop-blur p-4 shadow-sm transition ${
                    expanded ? 'ring-2 ring-blue-300/40' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-1 text-sm">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span className="truncate">{estate.name}</span>
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate">
                        {estate.address || 'No address'}
                      </p>
                      {estate.description && (
                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                          {estate.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openEstate(estate.id)}
                      className="p-2 rounded-lg bg-white/60 border border-white/30 text-gray-600 hover:bg-white/80"
                    >
                      {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniStatMobile label="Blocks" value={metrics?.blocks ?? '—'} />
                    <MiniStatMobile label="Apts" value={metrics?.apartments ?? '—'} />
                    <MiniStatMobile label="Avail" value={metrics?.availableApartments ?? '—'} />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEdit(estate.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-600/10 text-blue-600 text-[11px] font-medium flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      disabled={deletingId === estate.id}
                      onClick={() => handleDeleteEstate(estate.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-rose-600/10 text-rose-600 text-[11px] font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {deletingId === estate.id ? '...' : 'Delete'}
                    </button>
                  </div>

                  {expanded && (
                    <div className="mt-5 space-y-4">
                      {/* Metrics loading / error */}
                      {metrics?.loading && (
                        <p className="text-[10px] text-blue-600 flex items-center gap-1">
                          <span className="material-icons text-[12px] animate-spin">progress_activity</span>
                          Updating metrics...
                        </p>
                      )}
                      {metrics?.error && (
                        <p className="text-[10px] text-rose-600 flex items-center gap-1">
                          <span className="material-icons text-[12px]">error</span>
                          {metrics.error}
                        </p>
                      )}

                      {/* Blocks */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                          <TreePine className="w-4 h-4 text-blue-500" />
                          Structure
                        </p>
                        {structure?.loading && (
                          <p className="text-[10px] text-blue-600">Loading blocks...</p>
                        )}
                        {structure?.error && (
                          <p className="text-[10px] text-rose-600">Failed to load blocks</p>
                        )}
                        <div className="space-y-2">
                          {structure?.blocks.slice(0, 3).map(b => (
                            <div
                              key={b.id}
                              className="p-3 rounded-xl bg-white/60 border border-white/30"
                            >
                              <p className="text-[11px] font-medium text-gray-700 truncate">
                                {b.name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {(b.apartments || []).length} apartments
                              </p>
                            </div>
                          ))}
                          {structure &&
                            structure.blocks.length === 0 &&
                            !structure.loading && (
                              <p className="text-[10px] text-gray-400">No blocks yet.</p>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Desktop / Tablet Table (hidden on mobile) */}
        { window.innerWidth >= 640 ? (
          <div className="sm:block backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl shadow-xl mb-10 overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/20">
              <h2 className="text-sm font-semibold tracking-wide text-gray-700 flex items-center gap-2">
                <Table className="w-5 h-5 text-blue-600" />
                Estates
              <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 text-[11px] font-medium">
                {filteredEstates.length}
              </span>
            </h2>
            {loading && (
              <span className="text-[11px] text-blue-600 flex items-center gap-1">
                <span className="material-icons text-[14px] animate-spin">progress_activity</span>
                Loading...
              </span>
            )}
          </div>
          {filteredEstates.length === 0 && !loading ? (
            <div className="py-16 text-center text-sm text-gray-500">No estates found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/60 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <Th />
                    <Th>Name</Th>
                    <Th>Address</Th>
                    <Th>Size</Th>
                    <Th>Blocks</Th>
                    <Th>Apts</Th>
                    <Th>Avail</Th> {/* re-enabled */}
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30">
                  {filteredEstates.map(estate => {
                    const metrics = metricsCache[estate.id];
                    const expanded = selectedEstate === estate.id;
                    const structure = estateStructure(estate.id);
                    return (
                      <React.Fragment key={estate.id}>
                        <tr className={`hover:bg-white/60 ${expanded ? 'bg-white/70' : ''}`}>
                          <Td>
                            <button
                              onClick={() => openEstate(estate.id)}
                              className="p-2 rounded-lg bg-white/60 border border-white/30 hover:bg-white/80 transition flex items-center justify-center"
                            >
                              <span className="material-icons text-[18px] text-gray-600">
                                {expanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </span>
                            </button>
                          </Td>
                          <Td>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              <span className="material-icons text-[16px] text-blue-600">business</span>
                              {estate.name}
                            </div>
                            {estate.description && (
                              <div className="text-[10px] text-gray-500 line-clamp-1">
                                {estate.description}
                              </div>
                            )}
                          </Td>
                          <Td>
                            <span className="text-gray-700">{estate.address || '—'}</span>
                          </Td>
                          <Td>{estate.size || '—'}</Td>
                          <Td>{metrics?.blocks ?? '—'}</Td>
                          <Td>{metrics?.apartments ?? '—'}</Td>
                          <Td>{metrics?.availableApartments ?? '—'}</Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEdit(estate.id)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 text-[11px] font-medium hover:bg-blue-600/20 flex items-center gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                disabled={deletingId===estate.id}
                                onClick={()=>handleDeleteEstate(estate.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-600/10 text-rose-600 text-[11px] font-medium hover:bg-rose-600/20 flex items-center gap-1 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                {deletingId===estate.id?'Deleting':'Delete'}
                              </button>
                            </div>
                          </Td>
                        </tr>
                        {expanded && (
                          <tr className="bg-white/70">
                            <td colSpan={8} className="px-8 pb-8 pt-4">
                              <div className="space-y-6">
                                {/* Description */}
                                <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 text-sm text-gray-700 leading-relaxed">
                                  {estate.description || 'No description provided.'}
                                </div>

                                {/* Metrics state */}
                                {metrics?.loading && (
                                  <p className="text-[11px] text-blue-600 flex items-center gap-1">
                                    <span className="material-icons text-[14px] animate-spin">progress_activity</span>
                                    Updating metrics...
                                  </p>
                                )}
                                {metrics?.error && (
                                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                                    <span className="material-icons text-[14px]">error</span>
                                    {metrics.error}
                                  </p>
                                )}

                                {/* Structure */}
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 tracking-wide">
                                    <TreePine className="w-5 h-5 text-blue-500" />
                                    Estate Structure
                                  </div>
                                  {structure?.loading && (
                                    <p className="text-[11px] text-blue-600 flex items-center gap-1">
                                      <span className="material-icons text-[14px] animate-spin">progress_activity</span>
                                      Loading blocks...
                                    </p>
                                  )}
                                  {structure?.error && (
                                    <p className="text-[11px] text-red-600 flex items-center gap-1">
                                      <span className="material-icons text-[14px]">error</span>
                                      {structure.error}
                                    </p>
                                  )}
                                  <div className="space-y-3">
                                    {structure?.blocks.map((block: any) => {
                                      const active = activeBlock === block.id;
                                      return (
                                        <div
                                          key={block.id}
                                          className="rounded-2xl border border-white/30 bg-white/50 backdrop-blur overflow-hidden"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => setActiveBlock(active ? null : block.id)}
                                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow">
                                                <Building className="w-5 h-5" />
                                              </div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-800">{block.name}</p>
                                                {block.description && (
                                                  <p className="text-[11px] text-gray-500 line-clamp-1">
                                                    {block.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <span className="material-icons text-gray-500 text-sm">
                                              {active ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </span>
                                          </button>
                                          <div
                                            className={`transition-all duration-300 ${
                                              active ? 'max-h-80' : 'max-h-0'
                                            } overflow-hidden`}
                                          >
                                            <div className="px-5 pb-5 space-y-4">
                                              {block.apartmentsLoading && (
                                                <p className="text-[11px] text-blue-600 flex items-center gap-1">
                                                  <span className="material-icons text-[14px] animate-spin">
                                                    progress_activity
                                                  </span>
                                                  Loading apartments...
                                                </p>
                                              )}
                                              {block.apartmentsError && (
                                                <p className="text-[11px] text-red-600 flex items-center gap-1">
                                                  <span className="material-icons text-[14px]">error</span>
                                                  {block.apartmentsError}
                                                </p>
                                              )}
                                              <div className="grid grid-cols-2 gap-3">
                                                {block.apartments.slice(0, 10).map((a: any) => (
                                                  <div
                                                    key={a.id}
                                                    className="p-3 rounded-xl bg-white/70 border border-white/40 shadow hover:shadow-md text-xs flex flex-col gap-1"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <DoorOpen className="w-4 h-4 text-indigo-500" />
                                                      <p className="font-semibold text-gray-700 truncate">
                                                        {a.number || 'Unit'}
                                                      </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                                                      {a.size && (
                                                        <span className="flex items-center gap-1">
                                                          <span className="material-icons text-[12px] text-blue-500">
                                                            straighten
                                                          </span>
                                                          {a.size}m²
                                                        </span>
                                                      )}
                                                      {a.rent_amount && (
                                                        <span className="flex items-center gap-1">
                                                          <span className="material-icons text-[12px] text-emerald-500">
                                                            payments
                                                          </span>
                                                          {a.rent_amount}
                                                        </span>
                                                      )}
                                                      {a.number_of_rooms && (
                                                        <span className="flex items-center gap-1">
                                                          <span className="material-icons text-[12px] text-amber-500">
                                                            meeting_room
                                                          </span>
                                                          {a.number_of_rooms}r
                                                        </span>
                                                      )}
                                                      {a.color && (
                                                        <span className="flex items-center gap-1">
                                                          <span
                                                            className="material-icons text-[12px]"
                                                            style={{ color: a.color }}
                                                          >
                                                            palette
                                                          </span>
                                                          {a.color}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {Array.isArray(a.amenities) && a.amenities.length > 0 && (
                                                      <div className="flex flex-wrap gap-1">
                                                        {/* If amenities is array of objects with names, use those; otherwise try to find names */}
                                                        {a.amenities.slice(0, 3).map((am: any, i: number) => {
                                                          // Handle both object format and ID format
                                                          const amenityName = am.name || fetchAmenityNames([am])[0] || String(am);
                                                          return (
                                                            <span
                                                              key={`${a.id}-amenity-${i}`}
                                                              className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-medium"
                                                            >
                                                              {amenityName}
                                                            </span>
                                                          );
                                                        })}
                                                        {a.amenities.length > 3 && (
                                                          <span className="text-[9px] text-gray-400">
                                                            +{a.amenities.length - 3}
                                                          </span>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                                {!block.apartmentsLoading &&
                                                  block.apartments.length === 0 && (
                                                    <p className="col-span-2 text-[11px] text-gray-500">
                                                      No apartments found.
                                                    </p>
                                                  )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {structure &&
                                      structure.blocks.length === 0 &&
                                      !structure.loading &&
                                      !structure.error && (
                                        <p className="text-[11px] text-gray-500">No blocks yet.</p>
                                      )}
                                  </div>
                                </div>

                                {/* Inline Actions under expansion (optional) */}
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => openEdit(estate.id)}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2 text-sm font-medium"
                                  >
                                    <span className="material-icons text-sm">edit</span>
                                    Edit Estate
                                  </button>
                                  <button
                                    disabled={deletingId===estate.id}
                                    onClick={()=>handleDeleteEstate(estate.id)}
                                    className="px-4 py-2 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                  >
                                    <span className="material-icons text-sm">{deletingId===estate.id?'hourglass_top':'delete'}</span>
                                    {deletingId===estate.id?'Deleting...':'Delete'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>) : null }

        {/* Empty State */}
        {!loading && filteredEstates.length === 0 && (
          <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-xl p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="material-icons text-gray-400 text-2xl">search_off</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No estates found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or add a new estate.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <span className="material-icons text-sm">add</span>
              <span className="font-medium">Add First Estate</span>
            </button>
          </div>
        )}
      </div>

      {/* Available Apartments Modal */}
      {showAvailableModal && (
        <Modal onClose={()=>setShowAvailableModal(false)} title="Available Apartments" icon="home_work">
          <div className="space-y-5">
            {/* Filters */}
            <div className="grid grid-cols-3 gap-3">
              <input
                placeholder="Min Rooms"
                value={availableFilters.min_rooms||''}
                onChange={e=>setAvailableFilters(f=>({...f,min_rooms:e.target.value}))}
                className="px-3 py-2 rounded-lg border bg-white/60 text-xs"
              />
              <input
                placeholder="Max Rent"
                value={availableFilters.max_rent||''}
                onChange={e=>setAvailableFilters(f=>({...f,max_rent:e.target.value}))}
                className="px-3 py-2 rounded-lg border bg-white/60 text-xs"
              />
              <select
                value={availableFilters.estate_id||''}
                onChange={e=>setAvailableFilters(f=>({...f,estate_id:e.target.value||undefined}))}
                className="px-3 py-2 rounded-lg border bg-white/60 text-xs"
              >
                <option value="">All Estates</option>
                {estates.map(es=> <option key={es.id} value={es.id}>{es.name}</option>)}
              </select>
              <div className="col-span-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={()=>fetchAvailableApartments({
                    ...(availableFilters.min_rooms?{min_rooms:availableFilters.min_rooms}:{}),
                    ...(availableFilters.max_rent?{max_rent:availableFilters.max_rent}:{}),
                    ...(availableFilters.estate_id?{estate_id:availableFilters.estate_id}:{}),
                  })}
                  className="px-4 py-2 rounded-lg bg-blue-600/90 text-black text-xs font-medium hover:bg-blue-600"
                  disabled={availableState.loading}
                >
                  {availableState.loading ? 'Filtering...' : 'Apply Filters'}
                </button>
                <button
                  type="button"
                  onClick={()=>setAvailableFilters({})}
                  className="px-3 py-2 rounded-lg bg-white/60 border border-white/30 text-[11px]"
                  disabled={availableState.loading}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="flex flex-wrap gap-3 text-[11px]">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                Total: {availableState.total}
              </span>
              {availableState.summary?.furnished_count !== undefined && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                  Furnished: {availableState.summary.furnished_count}
                </span>
              )}
              {availableState.summary?.average_rent && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                  Avg Rent: {availableState.summary.average_rent}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                {availableState.loading
                  ? 'Loading available units...'
                  : availableState.error
                    ? 'Error loading units'
                    : `${availableState.total} unit${availableState.total===1?'':'s'} available`}
              </p>
              <button
                onClick={()=>fetchAvailableApartments({
                  ...(availableFilters.min_rooms?{min_rooms:availableFilters.min_rooms}:{}),
                  ...(availableFilters.max_rent?{max_rent:availableFilters.max_rent}:{}),
                  ...(availableFilters.estate_id?{estate_id:availableFilters.estate_id}:{}),
                })}
                disabled={availableState.loading}
                className="px-3 py-1.5 rounded-lg bg-white/60 border border-white/30 text-[11px] font-medium flex items-center gap-1 hover:bg-white/80 disabled:opacity-50"
              >
                <span className={`material-icons text-[14px] ${availableState.loading?'animate-spin':''}`}>
                  {availableState.loading?'progress_activity':'refresh'}
                </span>
                Refresh
              </button>
            </div>

            {availableState.error && (
              <div className="text-xs text-rose-600 flex items-center gap-1">
                <span className="material-icons text-[14px]">error</span>{availableState.error}
              </div>
            )}

            {!availableState.loading && !availableState.error && availableState.apartments.length===0 && (
              <div className="text-xs text-gray-500 py-8 text-center">No available apartments.</div>
            )}

            {availableState.apartments.length>0 && (
              <div className="overflow-x-auto border border-white/30 rounded-2xl">
                <table className="min-w-full text-xs">
                  <thead className="bg-white/60 text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      {/* <th className="px-3 py-2 text-left font-semibold">ID</th> */}
                      {/* <th className="px-3 py-2 text-left font-semibold">Address</th> */}
                      <th className="px-3 py-2 text-left font-semibold">Rooms</th>
                      <th className="px-3 py-2 text-left font-semibold">Size</th>
                      <th className="px-3 py-2 text-left font-semibold">Rent</th>
                      <th className="px-3 py-2 text-left font-semibold">Score</th>
                      {/* <th className="px-3 py-2 text-left font-semibold">Categories</th> */}
                      <th className="px-3 py-2 text-left font-semibold">Amenities</th>
                      {/* <th className="px-3 py-2 text-left font-semibold">Furnish</th> */}
                      <th className="px-3 py-2 text-left font-semibold">Estate</th>
                      <th className="px-3 py-2 text-left font-semibold">Block</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30">
                    {availableState.apartments.map(a=> (
                      <tr key={a.id} className="hover:bg-white/60">
                        {/* <td className="px-3 py-2">{a.id}</td> */}
                        {/* <td className="px-3 py-2 font-semibold text-gray-800">
                          {a.full_address || `${a.block?.estate?.name||''} ${a.block?.name?'- '+a.block?.name:''} ${a.number?'- '+a.number:''}`}
                        </td> */}
                        <td className="px-3 py-2">{a.number_of_rooms ?? '—'}</td>
                        <td className="px-3 py-2">{a.size ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{a.rent_amount || '—'}</td>
                        <td className="px-3 py-2">{a.allocation_score ?? '—'}</td>
                        {/* <td className="px-3 py-2">
                          <div className="flex flex-col gap-0.5">
                            {a.room_category && <span className="text-[10px] text-gray-600">{a.room_category}</span>}
                            {a.size_category && <span className="text-[10px] text-gray-500">{a.size_category}</span>}
                            {a.rent_category && <span className="text-[10px] text-gray-400">{a.rent_category}</span>}
                          </div>
                        </td> */}
                        <td className="px-3 py-2">{a.amenities_count ?? a.amenities?.length ?? 0}</td>
                        {/* <td className="px-3 py-2">{a.furnishings_count ?? a.furnishings?.length ?? 0}</td> */}
                        <td className="px-3 py-2">{a.block?.estate?.name || '—'}</td>
                        <td className="px-3 py-2">{a.block?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" icon="close" onClick={()=>setShowAvailableModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Estate Modal */}
      {showAddModal && (
        <Modal onClose={() => !creating && setShowAddModal(false)} title="Create Estate" icon="add_business">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Name *" required value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Sunset Gardens" />
              <Input label="Size" value={form.size} onChange={v=>setForm(f=>({...f,size:v}))} placeholder="e.g. 5 acres" />
              <Input className="md:col-span-2" label="Address *" required value={form.address} onChange={v=>setForm(f=>({...f,address:v}))} placeholder="Full address" />
              <Textarea className="md:col-span-2" label="Description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="Brief description" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <span className="material-icons text-[14px] text-blue-500">account_tree</span>
                  Blocks & Apartments (optional)
                </h4>
                <button
                  type="button"
                  onClick={()=>setCreateBlocks(b=>[...b,{ tempId: Date.now()+Math.random(), name:'', description:'', apartments:[] }])}
                  className="text-[11px] px-2 py-1 rounded-md bg-blue-50 text-blue-600 flex items-center gap-1"
                >
                  <span className="material-icons text-[14px]">add</span>
                  Add Block
                </button>
              </div>
              {createBlocks.length===0 && <p className="text-[11px] text-gray-500">No blocks added.</p>}
              <div className="space-y-4 max-h-80 overflow-auto pr-1">
                {createBlocks.map((b,bi)=> (
                  <div key={b.tempId} className="p-4 rounded-xl bg-white/60 border border-white/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-gray-700">Block {bi+1}</p>
                      <button
                        type="button"
                        onClick={()=>setCreateBlocks(list=>list.filter(x=>x.tempId!==b.tempId))}
                        className="text-rose-500 hover:text-rose-600 text-[11px] flex items-center gap-1"
                      >
                        <span className="material-icons text-[14px]">delete</span>
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <input
                        placeholder="Block name"
                        value={b.name}
                        onChange={e=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x,name:e.target.value}:x))}
                        className="px-3 py-2 rounded-lg border bg-white/70"
                      />
                      <input
                        placeholder="Description"
                        value={b.description}
                        onChange={e=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x,description:e.target.value}:x))}
                        className="px-3 py-2 rounded-lg border bg-white/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-500">Apartments</span>
                        <button
                          type="button"
                          onClick={()=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:[...x.apartments,{ tempId: Date.now()+Math.random(), number:'', size:'', rent_amount:'', number_of_rooms:'', color:'', amenities:[], furnishings:[], description:'' }]}:x))}
                          className="text-[10px] text-blue-600 flex items-center gap-1"
                        >
                          <span className="material-icons text-[14px]">add</span>
                          Add Apt
                        </button>
                      </div>
                      {b.apartments.length===0 && <p className="text-[10px] text-gray-400">No apartments</p>}
                      <div className="space-y-2 max-h-40 overflow-auto pr-1">
                        {b.apartments.map((a:any)=> (
                          <div key={a.tempId} className="p-3 rounded-lg border bg-white/70 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-medium text-gray-600">Apartment</p>
                              <button
                                type="button"
                                onClick={()=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:x.apartments.filter((ap:any)=> ap.tempId!==a.tempId)}:x))}
                                className="text-rose-500 hover:text-rose-600"
                              >
                                <span className="material-icons text-[16px]">close</span>
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                placeholder="Number"
                                value={a.number}
                                onChange={e=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:x.apartments.map((ap:any)=> ap.tempId===a.tempId? {...ap, number:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <input
                                placeholder="Rent"
                                value={a.rent_amount||''}
                                onChange={e=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:x.apartments.map((ap:any)=> ap.tempId===a.tempId? {...ap, rent_amount:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <input
                                placeholder="Size"
                                value={a.size||''}
                                onChange={e=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:x.apartments.map((ap:any)=> ap.tempId===a.tempId? {...ap, size:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <input
                                placeholder="Rooms"
                                value={a.number_of_rooms||''}
                                onChange={e=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:x.apartments.map((ap:any)=> ap.tempId===a.tempId? {...ap, number_of_rooms:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <input
                                placeholder="Color"
                                value={a.color||''}
                                onChange={e=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:x.apartments.map((ap:any)=> ap.tempId===a.tempId? {...ap, color:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <div className="col-span-3">
                                <p className="text-[10px] font-medium text-gray-500 mb-1">Amenities</p>
                                <div className="flex flex-wrap gap-2 max-h-20 overflow-auto">
                                  {amenities.map(am=> (
                                    <label key={am.id} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border bg-white/60">
                                      <input
                                        type="checkbox"
                                        className="accent-blue-600"
                                        checked={(a.amenities||[]).includes(am.id)}
                                        onChange={()=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:x.apartments.map((ap:any)=> ap.tempId===a.tempId? {...ap, amenities:(ap.amenities||[]).includes(am.id)? ap.amenities.filter((id:number)=>id!==am.id): [...(ap.amenities||[]), am.id]}:ap)}:x))}
                                      />
                                      {am.name}
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <input
                                placeholder="Description"
                                value={a.description||''}
                                onChange={e=>setCreateBlocks(list=> list.map(x=> x.tempId===b.tempId? {...x, apartments:x.apartments.map((ap:any)=> ap.tempId===a.tempId? {...ap, description:e.target.value}:ap)}:x))}
                                className="col-span-3 px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {createError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="material-icons text-[14px]">error</span>
                {createError}
              </p>
            )}
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button type="button" variant="secondary" icon="close" onClick={()=>!creating && setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating} icon="save">
                Create Estate
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Estate Modal */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(null)} title="Edit Estate" icon="edit">
          <form onSubmit={handleEdit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Name" value={editForm.name} onChange={v=>setEditForm(f=>({...f,name:v}))} />
              <Input label="Size" value={editForm.size} onChange={v=>setEditForm(f=>({...f,size:v}))} />
              <Input className="md:col-span-2" label="Address" value={editForm.address} onChange={v=>setEditForm(f=>({...f,address:v}))} />
              <Textarea className="md:col-span-2" label="Description" value={editForm.description} onChange={v=>setEditForm(f=>({...f,description:v}))} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <span className="material-icons text-[14px] text-blue-500">view_module</span>
                  Edit Blocks & Apartments
                </h4>
                <button
                  type="button"
                  onClick={()=>setEditBlocks(b=>[...b,{ tempId: Date.now()+Math.random(), name:'', description:'', apartments:[] }])}
                  className="text-[11px] px-2 py-1 rounded-md bg-blue-50 text-blue-600 flex items-center gap-1"
                >
                  <span className="material-icons text-[14px]">add</span>
                  Add Block
                </button>
              </div>
              {editBlocks.length===0 && <p className="text-[11px] text-gray-500">No blocks loaded (expand estate card first to load structure or add new blocks).</p>}
              <div className="space-y-4 max-h-80 overflow-auto pr-1">
                {editBlocks.map((b:any,bi:number)=> (
                  <div key={b.id||b.tempId} className="p-4 rounded-xl bg-white/60 border border-white/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                        {b.existing && <span className="material-icons text-[14px] text-emerald-500">verified</span>}
                        Block {bi+1}
                      </p>
                      {!b.existing && (
                        <button
                          type="button"
                          onClick={()=>setEditBlocks(list=>list.filter(x=> (x.id||x.tempId)!==(b.id||b.tempId)))}
                          className="text-rose-500 hover:text-rose-600 text-[11px] flex items-center gap-1"
                        >
                          <span className="material-icons text-[14px]">delete</span>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <input
                        placeholder="Block name"
                        value={b.name}
                        onChange={e=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x,name:e.target.value}:x))}
                        className="px-3 py-2 rounded-lg border bg-white/70"
                      />
                      <input
                        placeholder="Description"
                        value={b.description}
                        onChange={e=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x,description:e.target.value}:x))}
                        className="px-3 py-2 rounded-lg border bg-white/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-500">Apartments</span>
                        <button
                          type="button"
                          onClick={()=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:[...x.apartments,{ tempId: Date.now()+Math.random(), number:'', size:'', rent_amount:'', number_of_rooms:'', color:'', amenities:[], furnishings:[], description:'' }]}:x))}
                          className="text-[10px] text-blue-600 flex items-center gap-1"
                        >
                          <span className="material-icons text-[14px]">add</span>
                          Add Apt
                        </button>
                      </div>
                      {(!b.apartments || b.apartments.length===0) && <p className="text-[10px] text-gray-400">No apartments</p>}
                      <div className="space-y-2 max-h-40 overflow-auto pr-1">
                        {b.apartments?.map((a:any)=> (
                          <div key={a.id||a.tempId} className="p-3 rounded-lg border bg-white/70 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-medium text-gray-600">Apartment</p>
                              {!a.existing && (
                                <button
                                  type="button"
                                  onClick={()=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:x.apartments.filter((ap:any)=> (ap.id||ap.tempId)!==(a.id||a.tempId))}:x))}
                                  className="text-rose-500 hover:text-rose-600"
                                >
                                  <span className="material-icons text-[16px]">close</span>
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                placeholder="Number"
                                value={a.number}
                                onChange={e=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:x.apartments.map((ap:any)=> (ap.id||ap.tempId)===(a.id||a.tempId)? {...ap, number:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <input
                                placeholder="Rent"
                                value={a.rent_amount||''}
                                onChange={e=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:x.apartments.map((ap:any)=> (ap.id||ap.tempId)===(a.id||a.tempId)? {...ap, rent_amount:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <input
                                placeholder="Size"
                                value={a.size||''}
                                onChange={e=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:x.apartments.map((ap:any)=> (ap.id||ap.tempId)===(a.id||a.tempId)? {...ap, size:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <input
                                placeholder="Rooms"
                                value={a.number_of_rooms||''}
                                onChange={e=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:x.apartments.map((ap:any)=> (ap.id||ap.tempId)===(a.id||a.tempId)? {...ap, number_of_rooms:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <input
                                placeholder="Color"
                                value={a.color||''}
                                onChange={e=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:x.apartments.map((ap:any)=> (ap.id||ap.tempId)===(a.id||a.tempId)? {...ap, color:e.target.value}:ap)}:x))}
                                className="px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                              <div className="col-span-3">
                                <p className="text-[10px] font-medium text-gray-500 mb-1">Amenities</p>
                                <div className="flex flex-wrap gap-2 max-h-20 overflow-auto">
                                  {amenities.map(am=> (
                                    <label key={am.id} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border bg-white/60">
                                      <input
                                        type="checkbox"
                                        className="accent-blue-600"
                                        checked={(a.amenities||[]).includes(am.id)}
                                        onChange={()=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:x.apartments.map((ap:any)=> (ap.id||ap.tempId)===(a.id||a.tempId)? {...ap, amenities:(ap.amenities||[]).includes(am.id)? ap.amenities.filter((id:number)=>id!==am.id): [...(ap.amenities||[]), am.id]}:ap)}:x))}
                                      />
                                      {am.name}
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <input
                                placeholder="Description"
                                value={a.description||''}
                                onChange={e=>setEditBlocks(list=> list.map(x=> (x.id||x.tempId)===(b.id||b.tempId)? {...x, apartments:x.apartments.map((ap:any)=> (ap.id||ap.tempId)===(a.id||a.tempId)? {...ap, description:e.target.value}:ap)}:x))}
                                className="col-span-3 px-2 py-1 rounded border bg-white/70 text-[10px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button type="button" variant="secondary" icon="close" onClick={()=>setShowEditModal(null)}>
                Cancel
              </Button>
              <Button type="submit" icon="save">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* Reusable UI atoms */
function MetricMini({ icon, label, value, color }:{icon:string;label:string;value:any;color:string}) {
  return (
    <div className="relative p-3 rounded-2xl bg-white/60 backdrop-blur border border-white/30 flex flex-col items-center justify-center shadow">
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} opacity-10`} />
      <span className="material-icons text-[18px] text-gray-700 mb-1">{icon}</span>
      <p className="text-xs font-medium text-gray-500 tracking-wide">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* NEW: MiniStatMobile helper (mobile only) */
function MiniStatMobile({ label, value }:{label:string; value:any}) {
  return (
    <div className="p-2 rounded-lg bg-white/60 border border-white/30 flex flex-col items-center">
      <span className="text-[10px] text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

/* UPDATED: Modal for mobile full-screen */
function Modal({ children, onClose, title, icon }:{children:React.ReactNode;onClose:()=>void;title:string;icon:string}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] max-w-none sm:max-w-lg overflow-y-auto backdrop-blur-xl bg-white/90 sm:bg-white/80 rounded-none sm:rounded-3xl shadow-2xl border border-white/30 p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              {title}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {icon==='edit'?'Update estate information':'Add a new managed estate to the portfolio.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/60 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, required, placeholder, className='' }:{label:string;value:string;onChange:(v:string)=>void;required?:boolean;placeholder?:string;className?:string}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={value}
        required={required}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, className='' }:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;className?:string}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
      />
    </div>
  );
}

function Button({ children, type='button', variant='primary', icon, loading, onClick }:{children:React.ReactNode;type?:'button'|'submit';variant?:'primary'|'secondary';icon?:string;loading?:boolean;onClick?:()=>void}) {
  const base = 'px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition shadow';
  const styles = variant==='primary' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:scale-[1.02]' : 'bg-white/60 backdrop-blur border border-white/30 text-gray-700 hover:bg-white/80';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`${base} ${styles} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {loading && <span className="material-icons text-sm animate-spin">progress_activity</span>}
      {icon && !loading && <span className="material-icons text-sm">{icon}</span>}
      {children}
    </button>
  );
}
function Th({ children }:{children:React.ReactNode}) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children }:{children:React.ReactNode}) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}