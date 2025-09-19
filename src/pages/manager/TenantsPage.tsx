import { useState, useMemo, useEffect } from 'react';
import { useTenants } from '../../hooks/useTenants';

export default function TenantsPage() {
  const { tenants, loading, error, refresh } = useTenants();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [layout, setLayout] = useState<'grid'|'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);
  const [tenantTypes, setTenantTypes] = useState<any[]>([]);
  const [availableApartments, setAvailableApartments] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emptyForm = { username:'', email:'', first_name:'', last_name:'', password:'', tenant_type:'', apartment:'', lease_start:'', lease_end:'', phone_number:'', emergency_contact:'' };
  const [createForm, setCreateForm] = useState({...emptyForm});
  const [editForm, setEditForm] = useState({...emptyForm, password: undefined as any});

  const decorateTenant = (t: any) => {
    const anyT = t as any;
    const user = anyT.user_details || anyT.user || {};
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Tenant';
    // lease status + days left
    let rentStatus: 'paid'|'pending'|'overdue' = 'paid';
    let daysLeft: number | null = null;
    if (anyT.lease_end) {
      const end = new Date(anyT.lease_end).getTime();
      const today = Date.now();
      const diffDays = Math.floor((end - today)/(1000*60*60*24));
      daysLeft = diffDays;
      if (diffDays < 0) rentStatus = 'overdue'; else if (diffDays <= 14) rentStatus = 'pending';
    }
    const apt = anyT.apartment_details || {};
    const block = apt.block || {};
    const estate = block.estate || {};
    const apartmentLabel = apt.number || `APT ${apt.id || anyT.apartment || ''}`;
    const estateName = estate.name || '';
    const blockName = block.name || '';
    const tenantTypeName = (anyT.tenant_type_details && anyT.tenant_type_details.name) || '';
    return { ...anyT, rentStatus, name, email: user.email, apartmentLabel, estateName, blockName, tenantTypeName, daysLeft };
  };

  const computed = tenants.map(decorateTenant);

  const filteredTenants = useMemo(()=>computed.filter(tenant => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = tenant.name.toLowerCase().includes(term) ||
      (tenant.email || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || tenant.rentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }), [computed, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const getStatusIcon = (status: string) => status === 'paid' ? 'check_circle' : status === 'pending' ? 'schedule' : status === 'overdue' ? 'warning' : 'help';
  const initials = (name: string) => name.split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('').toUpperCase();
  const openTenant = (id:number) => { setSelectedTenant(id === selectedTenant ? null : id); };
  const openEdit = (tenantId:number) => {
    const t: any = tenants.find(x=> (x as any).id===tenantId);
    if (!t) return;
    const user = t.user_details || t.user || {};
    setEditForm({
      username: user.username||'', email:user.email||'', first_name:user.first_name||'', last_name:user.last_name||'', password: '' as any,
      tenant_type: (t.tenant_type || t.tenant_type_details?.id || '') + '',
      apartment: (t.apartment || t.apartment_details?.id || '') + '',
      lease_start: t.lease_start || '', lease_end: t.lease_end || '', phone_number: t.phone_number||'', emergency_contact: t.emergency_contact||''
    });
    setShowEditModal(tenantId);
  };

  const handleCreateTenant = async (e:React.FormEvent) => {
    e.preventDefault(); if (creating) return; setFormError(null);
    if (!createForm.username || !createForm.email || !createForm.first_name || !createForm.last_name || !createForm.password || !createForm.tenant_type || !createForm.apartment || !createForm.lease_start || !createForm.lease_end) { setFormError('Please fill required fields.'); return; }
    setCreating(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/tenants/tenants/', { method:'POST', headers:{ 'Authorization':`Bearer ${token||''}`, 'Content-Type':'application/json' }, body: JSON.stringify({
        user:{ username:createForm.username, email:createForm.email, first_name:createForm.first_name, last_name:createForm.last_name, password:createForm.password },
        tenant_type: parseInt(createForm.tenant_type), apartment: parseInt(createForm.apartment), lease_start:createForm.lease_start, lease_end:createForm.lease_end,
        phone_number: createForm.phone_number||undefined, emergency_contact:createForm.emergency_contact||undefined
      }) });
      if (!res.ok) { const j = await res.json().catch(()=>({error:'Create failed'})); throw new Error(j.error||'Create failed'); }
      setShowAddModal(false); setCreateForm({...emptyForm}); refresh();
    } catch(err:any){ setFormError(err.message); } finally { setCreating(false); }
  };
  const handleUpdateTenant = async (e:React.FormEvent) => {
    e.preventDefault(); if (!showEditModal || updating) return; setFormError(null);
    setUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      const payload:any = { tenant_type: parseInt(editForm.tenant_type), apartment: parseInt(editForm.apartment), lease_start: editForm.lease_start, lease_end: editForm.lease_end, phone_number: editForm.phone_number||undefined, emergency_contact: editForm.emergency_contact||undefined };
      payload.user = { username: editForm.username, email: editForm.email, first_name: editForm.first_name, last_name: editForm.last_name };
      const res = await fetch(`/api/tenants/tenants/${showEditModal}/`, { method:'PATCH', headers:{ 'Authorization':`Bearer ${token||''}`, 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const j = await res.json().catch(()=>({error:'Update failed'})); throw new Error(j.error||'Update failed'); }
      setShowEditModal(null); refresh();
    } catch(err:any){ setFormError(err.message); } finally { setUpdating(false); }
  };

  useEffect(()=> {
    const token = localStorage.getItem('access_token');
    const headers: any = { 'Authorization': `Bearer ${token||''}`, 'Content-Type':'application/json' };
    fetch('/api/tenants/tenant-types/', { headers }).then(r=>r.ok?r.json():[]).then(d=> Array.isArray(d)&& setTenantTypes(d));
    // FIX: Use all apartments instead of available to ensure selection works
    fetch('/api/core/apartments/', { headers })
      .then(r => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        return r.json();
      })
      .then(d => {
        console.log('Fetched apartments:', d); // Debug log
        if (Array.isArray(d)) {
          setAvailableApartments(d.filter(a => a && a.id)); // Filter out null/undefined
        } else {
          console.error('Apartments response is not an array:', d);
          setAvailableApartments([]);
        }
      })
      .catch(err => {
        console.error('Error fetching apartments:', err);
        setAvailableApartments([]);
      });
  }, []);

  const activeTenant = computed.find(t=>t.id===selectedTenant);

  return (
    <div className="min-h-screen p-4 lg:p-6 xl:p-8 relative overflow-hidden" style={{ paddingTop:'100px'}}>
      {/* Creative SVG Blobs */}
      {/* <div className="absolute top-10 left-20 w-48 h-48 opacity-20" style={{ transform: 'rotate(45deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10c20 0 30 20 30 40s-10 40-30 40S10 70 10 50 30 10 50 10z" fill="#3b82f6" />
        </svg>
      </div>
      <div className="absolute top-40 right-32 w-36 h-36 opacity-15" style={{ transform: 'rotate(-30deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 20c15-5 35 5 40 25s-5 35-25 40S15 75 10 55 15 25 30 20z" fill="#10b981" />
        </svg>
      </div>
      <div className="absolute bottom-20 left-1/4 w-56 h-56 opacity-10" style={{ transform: 'rotate(60deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 30c10-10 30-10 40 0s10 30 0 40-30 10-40 0S10 40 20 30z" fill="#f59e0b" />
        </svg>
      </div>
      <div className="absolute top-1/3 right-10 w-40 h-40 opacity-25" style={{ transform: 'rotate(120deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 10c15 5 25 25 20 40s-25 25-40 20S5 55 10 40 25 5 40 10z" fill="#ef4444" />
        </svg>
      </div>
      <div className="absolute bottom-10 right-1/3 w-52 h-52 opacity-20" style={{ transform: 'rotate(-45deg)' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5c20 10 25 35 15 50s-35 25-50 15S-5 55 5 40 30-5 50 5z" fill="#8b5cf6" />
        </svg>
      </div> */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className=" mx-auto flex gap-6 xl:gap-8">
          <div className="flex-1 min-w-0">
            <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl shadow-xl mb-8 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg"><span className="material-icons text-white text-2xl">people</span></div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">Tenant Management</h1>
                    <p className="text-gray-600 text-sm lg:text-base">Live tenant roster and lease insights</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={refresh} className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium text-indigo-700"><span className="material-icons text-base">refresh</span>Refresh</button>
                  <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2" onClick={()=> setShowAddModal(true)}><span className="material-icons text-sm">person_add</span><span className="font-medium">Add Tenant</span></button>
                </div>
              </div>
            </div>

              <div className="backdrop-blur-md  bg-white/70 border border-white/20 rounded-2xl shadow-xl mb-8 p-6">
              <div className="flex flex-row sm:flex-row sm:items-center gap-4">
                <div className="flex-1 relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search tenants by name or email..." className="w-full pl-10 pr-4 py-3 border border-white/30 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500" />
                </div>
                <div className="flex flex-row sm:flex-row gap-2">
                <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)} className="px-4 py-3 border border-white/30 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
                {/* <button onClick={()=>setLayout(l=> l==='grid' ? 'list' : 'grid')} className="px-4 py-3 border border-white/30 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition flex items-center gap-2"><span className="material-icons text-sm">{layout==='grid' ? 'view_list' : 'grid_view'}</span><span className="hidden sm:inline">Layout</span></button> */}
                </div>
              </div>
              {loading && <div className="text-sm text-indigo-600 flex items-center gap-2"><span className="material-icons text-base animate-spin">progress_activity</span>Loading tenants...</div>}
              {error && <div className="text-sm text-red-600 flex items-center gap-2"><span className="material-icons text-base">error</span>{error}</div>}
            </div>

            <div className={`${layout === 'grid'
              ? 'columns-1 sm:columns-3 xl:columns-3 gap-6 space-y-6'
              : 'space-y-4'} relative`}>
              {filteredTenants.map((tenant) => {
                const selected = selectedTenant === tenant.id;
                const rentStatus = tenant.rentStatus;
                return (
                  <div key={tenant.id} onClick={()=>openTenant(tenant.id)} className={`group cursor-pointer break-inside-avoid rounded-3xl backdrop-blur-md bg-white/70 border border-white/20 shadow-xl transition-all duration-500 overflow-hidden ${selected ? 'ring-2 ring-indigo-400/40 scale-[1.015]' : 'hover:shadow-2xl hover:scale-[1.01]'}`}>                  
                    <div className="relative p-6 space-y-5">
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1 shadow-sm bg-white/60 backdrop-blur ${getStatusColor(rentStatus)}`}>
                        <span className="material-icons text-[14px]">{getStatusIcon(rentStatus)}</span>{rentStatus}
                      </div>
                      {/* Header */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">{initials(tenant.name)}</div>
                          <span className="absolute -bottom-1 -right-1 p-1 rounded-xl bg-white shadow border border-white/40"><span className="material-icons text-[16px] text-indigo-500">badge</span></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate flex items-center gap-2">{tenant.name}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><span className="material-icons text-[14px]">mail</span>{tenant.email || '—'}</p>
                        </div>
                      </div>
                      {/* At-a-glance info */}
                      <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <Info icon="domain" label="Apartment" value={tenant.apartmentLabel || tenant.apartment || '—'} />
                        <Info icon="apartment" label="Block" value={tenant.blockName || '—'} />
                        <Info icon="villa" label="Estate" value={tenant.estateName || '—'} />
                        <Info icon="badge" label="Type" value={tenant.tenantTypeName || '—'} />
                        <Info icon="event" label="Start" value={tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString() : '—'} />
                        <Info icon="event_available" label="End" value={tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString() : '—'} />
                        <Info icon="schedule" label="Days Left" value={tenant.daysLeft!=null ? (tenant.daysLeft < 0 ? `${Math.abs(tenant.daysLeft)} overdue` : tenant.daysLeft) : '—'} />
                        <Info icon="call" label="Phone" value={tenant.phone_number || '—'} />
                        <Info icon="contact_phone" label="Emergency" value={tenant.emergency_contact || '—'} />
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button onClick={(e)=> { e.stopPropagation(); openEdit(tenant.id); }} className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-xs font-medium"><span className="material-icons text-sm">edit</span>Edit</button>
                        {/* <button onClick={(e)=> { e.stopPropagation(); openEdit(tenant.id); }} className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"><span className="material-icons text-sm">edit</span></button>
                        <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"><span className="material-icons text-sm">more_vert</span></button> */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && filteredTenants.length === 0 && (
              <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-xl p-12 text-center mt-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"><span className="material-icons text-gray-400 text-2xl">people_outline</span></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tenants found</h3>
                <p className="text-gray-600 mb-6">Try adjusting filters or import tenant data.</p>
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"><span className="material-icons text-sm">person_add</span><span className="font-medium">Add First Tenant</span></button>
              </div>
            )}
          </div>

          <div className={`hidden xl:block w-[360px] transition-all duration-500 ${activeTenant ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6 pointer-events-none'} relative`}>          
            <div className="sticky top-6 space-y-6">
              <div className="backdrop-blur-xl bg-white/70 border border-white/30 rounded-3xl shadow-2xl p-6 min-h-[280px]">
                {activeTenant ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">{initials(activeTenant.name)}</div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-gray-800 truncate">{activeTenant.name}</h2>
                        <p className="text-xs text-indigo-600 flex items-center gap-1"><span className="material-icons text-[14px]">domain</span>{activeTenant.apartment || '—'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <Info icon="schedule" value={activeTenant.lease_start ? new Date(activeTenant.lease_start).toLocaleDateString():'—'} label="Start" />
                      <Info icon="event_available" value={activeTenant.lease_end ? new Date(activeTenant.lease_end).toLocaleDateString():'—'} label="End" />
                      <Info icon="call" value={activeTenant.phone_number || '—'} label="Phone" />
                      <Info icon="contact_phone" value={activeTenant.emergency_contact || '—'} label="Emergency" />
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-xs font-medium"><span className="material-icons text-sm">email</span>Email</button>
                      <button className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"><span className="material-icons text-sm">call</span></button>
                      <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"><span className="material-icons text-sm">more_horiz</span></button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 text-sm"><span className="material-icons text-4xl text-indigo-300 mb-4">groups</span>Select a tenant card to view details</div>
                )}
              </div>
              <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-600/90 to-indigo-700/90 text-white rounded-3xl shadow-2xl p-6">
                <h3 className="text-sm font-semibold tracking-wide mb-4 flex items-center gap-2"><span className="material-icons text-[16px]">insights</span>Performance Tips</h3>
                <ul className="space-y-3 text-xs">
                  <li className="flex gap-2"><span className="material-icons text-emerald-300 text-[16px]">verified</span>Keep contact info updated for timely rent reminders.</li>
                  <li className="flex gap-2"><span className="material-icons text-amber-300 text-[16px]">schedule</span>Monitor approaching lease expirations early.</li>
                  <li className="flex gap-2"><span className="material-icons text-blue-200 text-[16px]">support_agent</span>Respond to tenant issues within 24h.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Create Tenant Modal */}
      {showAddModal && (
        <Modal onClose={()=>!creating && setShowAddModal(false)} title="Add Tenant" icon="person_add">
          <form onSubmit={handleCreateTenant} className="space-y-5">
            <Section title="User Account">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <Input label="Username *" value={createForm.username} onChange={v=>setCreateForm(f=>({...f,username:v}))} />
                <Input label="Email *" value={createForm.email} onChange={v=>setCreateForm(f=>({...f,email:v}))} />
                <Input label="First Name *" value={createForm.first_name} onChange={v=>setCreateForm(f=>({...f,first_name:v}))} />
                <Input label="Last Name *" value={createForm.last_name} onChange={v=>setCreateForm(f=>({...f,last_name:v}))} />
                <Input label="Password *" type="password" value={createForm.password} onChange={v=>setCreateForm(f=>({...f,password:v}))} className="col-span-2" />
              </div>
            </Section>
            <Section title="Tenancy Details">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <Select label="Tenant Type *" value={createForm.tenant_type} onChange={v=>setCreateForm(f=>({...f,tenant_type:v}))} options={tenantTypes.map(t=>({value:t.id,label:t.name}))} />
                <Select label="Apartment *" value={createForm.apartment} onChange={v=>setCreateForm(f=>({...f,apartment:v}))} options={availableApartments.map(a=>({value:a.id,label:a.number || `APT ${a.id}`}))} />
                <Input label="Lease Start *" type="date" value={createForm.lease_start} onChange={v=>setCreateForm(f=>({...f,lease_start:v}))} />
                <Input label="Lease End *" type="date" value={createForm.lease_end} onChange={v=>setCreateForm(f=>({...f,lease_end:v}))} />
                <Input label="Phone" value={createForm.phone_number} onChange={v=>setCreateForm(f=>({...f,phone_number:v}))} />
                <Input label="Emergency Contact" value={createForm.emergency_contact} onChange={v=>setCreateForm(f=>({...f,emergency_contact:v}))} />
              </div>
            </Section>
            {formError && <p className="text-[11px] text-red-600 flex items-center gap-1"><span className="material-icons text-[14px]">error</span>{formError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={()=>!creating && setShowAddModal(false)} icon="close">Cancel</Button>
              <Button type="submit" loading={creating} icon="save">Create</Button>
            </div>
          </form>
        </Modal>
      )}
      {/* Edit Tenant Modal */}
      {showEditModal && (
        <Modal onClose={()=>!updating && setShowEditModal(null)} title="Edit Tenant" icon="edit">
          <form onSubmit={handleUpdateTenant} className="space-y-5">
            <Section title="User Account">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <Input label="Username *" value={editForm.username} onChange={v=>setEditForm(f=>({...f,username:v}))} />
                <Input label="Email *" value={editForm.email} onChange={v=>setEditForm(f=>({...f,email:v}))} />
                <Input label="First Name *" value={editForm.first_name} onChange={v=>setEditForm(f=>({...f,first_name:v}))} />
                <Input label="Last Name *" value={editForm.last_name} onChange={v=>setEditForm(f=>({...f,last_name:v}))} />
              </div>
            </Section>
            <Section title="Tenancy Details">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <Select label="Tenant Type *" value={editForm.tenant_type} onChange={v=>setEditForm(f=>({...f,tenant_type:v}))} options={tenantTypes.map(t=>({value:t.id,label:t.name}))} />
                <Select label="Apartment *" value={editForm.apartment} onChange={v=>setEditForm(f=>({...f,apartment:v}))} options={[...availableApartments, ...(activeTenant?.apartment ? [{ id: (activeTenant as any).apartment, number: (activeTenant as any).apartment_details?.number || (activeTenant as any).apartment_details?.id }] : [])].filter((v,i,a)=> a.findIndex(x=>x.id===v.id)===i).map(a=>({value:a.id,label:a.number || `APT ${a.id}`}))} />
                <Input label="Lease Start *" type="date" value={editForm.lease_start} onChange={v=>setEditForm(f=>({...f,lease_start:v}))} />
                <Input label="Lease End *" type="date" value={editForm.lease_end} onChange={v=>setEditForm(f=>({...f,lease_end:v}))} />
                <Input label="Phone" value={editForm.phone_number} onChange={v=>setEditForm(f=>({...f,phone_number:v}))} />
                <Input label="Emergency Contact" value={editForm.emergency_contact} onChange={v=>setEditForm(f=>({...f,emergency_contact:v}))} />
              </div>
            </Section>
            {formError && <p className="text-[11px] text-red-600 flex items-center gap-1"><span className="material-icons text-[14px]">error</span>{formError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={()=>!updating && setShowEditModal(null)} icon="close">Cancel</Button>
              <Button type="submit" loading={updating} icon="save">Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Info({ icon, value, label }:{icon:string; value:any; label?:string}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] font-semibold text-gray-500 tracking-wide flex items-center gap-1"><span className="material-icons text-[12px] text-indigo-500">{icon}</span>{label}</span>}
      {!label && <span className="text-[10px] font-semibold text-gray-400 tracking-wide uppercase flex items-center gap-1"><span className="material-icons text-[12px] text-indigo-400">{icon}</span></span>}
      <span className="text-[11px] text-gray-700 truncate">{value}</span>
    </div>
  );
}
// New small reusable components for modal forms
function Modal({ children, onClose, title, icon }:{children:React.ReactNode;onClose:()=>void;title:string;icon:string}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] xl:max-w-4xl max-w-none sm:max-w-lg overflow-y-auto backdrop-blur-xl bg-white/90 sm:bg-white/80 rounded-none sm:rounded-3xl shadow-2xl border border-white/30 p-6 sm:p-8 xl:p-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span className="material-icons text-indigo-600">{icon}</span>{title}</h2>
            <p className="text-[11px] text-gray-500 mt-1">Ensure lease dates & user info are correct.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/60 transition"><span className="material-icons text-gray-500">close</span></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Section({ title, children }:{title:string;children:React.ReactNode}) { return (
  <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 space-y-3">
    <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1"><span className="material-icons text-[14px] text-indigo-500">widgets</span>{title}</p>
    {children}
  </div>
); }
function Input({ label, value, onChange, type='text', className='' }:{label:string; value:string; onChange:(v:string)=>void; type?:string; className?:string}) { return (
  <label className={`flex flex-col gap-1 ${className}`}>
    <span className="text-[10px] font-medium text-gray-500">{label}</span>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="px-3 py-2 rounded-lg bg-white/70 border border-white/30 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
  </label>
); }
function Select({ label, value, onChange, options }:{label:string; value:string; onChange:(v:string)=>void; options:{value:any;label:string}[]}) { return (
  <label className="flex flex-col gap-1">
    <span className="text-[10px] font-medium text-gray-500">{label}</span>
    <select value={value} onChange={e=>onChange(e.target.value)} className="px-3 py-2 rounded-lg bg-white/70 border border-white/30 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
      <option value="">Select...</option>
      {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
); }
function Button({ children, type='button', variant='primary', icon, loading, onClick }:{children:React.ReactNode;type?:'button'|'submit';variant?:'primary'|'secondary';icon?:string;loading?:boolean;onClick?:()=>void}) {
  const base = 'px-5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition shadow';
  const styles = variant==='primary' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02]' : 'bg-white/60 backdrop-blur border border-white/30 text-gray-700 hover:bg-white/80';
  return (
    <button type={type} onClick={onClick} disabled={loading} className={`${base} ${styles} disabled:opacity-60 disabled:cursor-not-allowed`}>
      {loading && <span className="material-icons text-sm animate-spin">progress_activity</span>}
      {icon && !loading && <span className="material-icons text-sm">{icon}</span>}
      {children}
    </button>
  );
}