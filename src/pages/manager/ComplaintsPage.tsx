import React, { useMemo, useState } from 'react';
import {
  useGetComplaintsQuery,
  useGetComplaintStatusesQuery,
  useUpdateComplaintStatusMutation,
  useCloseComplaintMutation
} from '../../services/complaintApi';
import { useGetTenantsQuery } from '../../services';
import { useGetComplaintCategoriesQuery } from '../../services/tenantApi';

export default function ComplaintsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status_id: 0, feedback: '' });

  const statusParam = statusFilter ? Number(statusFilter) : undefined;
  const categoryParam = categoryFilter ? Number(categoryFilter) : undefined;

  const { data: complaints = [], isLoading } = useGetComplaintsQuery({ status_id: statusParam, category_id: categoryParam } as any);
  const { data: statuses = [] } = useGetComplaintStatusesQuery();
  const { data: categoryList = [], isLoading: categoriesLoading } = useGetComplaintCategoriesQuery();
  const { data: tenants = [] } = useGetTenantsQuery({});
  const [updateStatus, { isLoading: updating }] = useUpdateComplaintStatusMutation();
  const [closeComplaint, { isLoading: closing }] = useCloseComplaintMutation();

  const statusMap: Record<number,string> = Object.fromEntries((statuses as any[]).map(s=>[s.id, s.name]));
  const categoryMap: Record<number,string> = useMemo(
    () => Object.fromEntries((categoryList as any[]).map(c => [c.id, c.name])),
    [categoryList]
  );

  const tenantName = (tenantId:number) => {
    const t:any = (tenants as any[]).find(x=>x.id===tenantId); if(!t) return 'Tenant #'+tenantId; const u=t.user_details; return `${u?.first_name||''} ${u?.last_name||''}`.trim() || u?.username || 'Tenant'; };

  const filtered = useMemo(()=> (complaints as any[]).filter((c:any)=>{
    const term = search.toLowerCase();
    const text = `${c.title||''} ${c.description||''} ${tenantName(c.tenant)} ${categoryMap[c.category]||''}`.toLowerCase();
    return !term || text.includes(term);
  }), [complaints, search, tenantName, categoryMap]);

  const selected:any = (complaints as any[]).find(c=>c.id===selectedId);

  const counts = {
    total: (complaints as any[]).length,
    open: (complaints as any[]).filter(c=> (statusMap[c.status]||'').toLowerCase()==='open').length,
    progress: (complaints as any[]).filter(c=> (statusMap[c.status]||'').toLowerCase()==='in progress').length,
    resolved: (complaints as any[]).filter(c=> (statusMap[c.status]||'').toLowerCase()==='resolved').length,
    closed: (complaints as any[]).filter(c=> (statusMap[c.status]||'').toLowerCase()==='closed').length
  };

  const statusColor = (name?:string) => {
    const n = (name||'').toLowerCase();
    if (n==='open') return 'bg-red-100 text-red-700 border-red-200';
    if (n==='in progress') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (n==='resolved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (n==='closed') return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const shortDate = (d?:string) => d ? new Date(d).toLocaleDateString() : '—';

  const openUpdate = (c:any) => { setSelectedId(c.id); setUpdateForm({ status_id: c.status, feedback: c.feedback || '' }); setShowUpdate(true); };
  const submitUpdate = async (e:React.FormEvent) => { e.preventDefault(); if(!selected) return; try { await updateStatus({ id: selected.id as number, update:{...updateForm} }).unwrap(); setShowUpdate(false);} catch(err){ console.error(err);} };
  const handleClose = async () => { if(!selected) return; try { await closeComplaint(selected.id as number).unwrap(); } catch(e){console.error(e);} };

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
        <div className=" mx-auto flex gap-8">
          <div className="flex-1 min-w-0 space-y-8">
            {/* Header */}
            <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-52 h-52 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full blur-3xl" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl shadow-xl"><span className="material-icons text-white text-2xl">report_problem</span></div>
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent">Complaint Management</h1>
                    <p className="text-gray-600 text-sm mt-1">Tenant issues, maintenance & service tracking</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                <Metric label="TOTAL" icon="inbox" value={counts.total} color="from-indigo-500 to-indigo-600" />
                <Metric label="OPEN" icon="error" value={counts.open} color="from-red-500 to-red-600" />
                <Metric label="IN PROG" icon="build" value={counts.progress} color="from-blue-500 to-blue-600" />
                <Metric label="RESOLVED" icon="task_alt" value={counts.resolved} color="from-emerald-500 to-emerald-600" />
                <Metric label="CLOSED" icon="lock" value={counts.closed} color="from-gray-500 to-gray-600" />
              </div>

            {/* Filters */}
            <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-xl p-6 space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[220px] relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, description, tenant..." className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <SelectField label="Status" value={statusFilter} onChange={(v)=>setStatusFilter(v)} options={[{value:'',label:'All Status'}, ...statuses.map(s=>({ value:String(s.id), label:s.name }))]} />
                <SelectField
                  label="Category"
                  value={categoryFilter}
                  onChange={(v)=>setCategoryFilter(v)}
                  options={[
                    { value: '', label: categoriesLoading ? 'Loading...' : 'All Categories' },
                    ...(!categoriesLoading
                      ? (categoryList as any[]).map(c=>({ value:String(c.id), label:c.name }))
                      : [])
                  ]}
                />
                <button onClick={()=>{setStatusFilter('');setCategoryFilter('');setSearch('');}} className="px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur border border-white/30 text-xs font-medium text-gray-600 hover:bg-white/80 flex items-center gap-1"><span className="material-icons text-[16px]">restart_alt</span>Reset</button>
              </div>
            </div>

            {/* LIST (REPLACED) */}
            {/* Old card grid list removed and replaced with mobile cards + desktop table */}
            {/* MOBILE CARDS */}
            { window.innerWidth < 640 ? (
            <div className="space-y-5">
              {isLoading && (
                <div className="text-sm text-indigo-600 flex items-center gap-2">
                  <span className="material-icons text-base animate-spin">progress_activity</span>
                  Loading complaints...
                </div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-xl p-8 text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                    <span className="material-icons text-gray-400 text-2xl">report_gmailerrorred</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No complaints</h3>
                  <p className="text-gray-600 text-sm">Adjust filters or check later.</p>
                </div>
              )}
              {!isLoading && filtered.map((c:any) => {
                const stName = statusMap[c.status];
                const active = c.id === selectedId;
                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl backdrop-blur-md bg-white/70 border border-white/30 shadow transition hover:shadow-xl p-5 space-y-4 ${active?'ring-2 ring-indigo-400/40':''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow">
                        <span className="material-icons text-base">report</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 truncate">{c.title || 'Complaint #'+c.id}</h3>
                        <p className="text-[11px] text-gray-500 truncate">
                          {categoryMap[c.category] || 'Uncategorized'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${statusColor(stName)}`}>
                        {stName || 'Status'}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-gray-600 line-clamp-4">
                      {c.description || 'No description.'}
                    </p>
                    {c.feedback && (
                      <div className="p-3 rounded-xl bg-white/60 border border-white/30 text-[11px] text-gray-600">
                        <span className="font-semibold text-gray-700">Feedback:</span> {c.feedback}
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] font-medium text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-[14px] text-indigo-500">today</span>
                        {shortDate(c.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-[14px] text-indigo-500">person</span>
                        {tenantName(c.tenant)}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setSelectedId(c.id); openUpdate(c); }}
                        className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[11px] font-medium flex items-center justify-center gap-1 hover:shadow"
                      >
                        <span className="material-icons text-[14px]">edit</span>Edit
                      </button>
                      <button
                        onClick={() => { setSelectedId(c.id); handleClose(); }}
                        disabled={(statusMap[c.status]||'').toLowerCase()==='closed'}
                        className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-600 text-[11px] font-medium hover:bg-indigo-50 disabled:opacity-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>) : null}

            {/* DESKTOP TABLE */}
            {window.innerWidth >= 640 ? (
            <div className="sm:block backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="material-icons text-indigo-600 text-base">table_view</span>
                  Complaints
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-600 font-medium">
                    {(filtered as any[]).length}
                  </span>
                </h2>
                {isLoading && (
                  <span className="text-xs text-indigo-600 flex items-center gap-1">
                    <span className="material-icons text-[14px] animate-spin">progress_activity</span>
                    Loading...
                  </span>
                )}
              </div>
              {(!isLoading && filtered.length === 0) ? (
                <div className="py-16 text-center text-sm text-gray-500">
                  No complaints found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/60">
                      <tr className="text-[11px] uppercase tracking-wide text-gray-500">
                        <Th>Title</Th>
                        <Th>Tenant</Th>
                        <Th>Category</Th>
                        <Th>Status</Th>
                        <Th>Created</Th>
                        <Th>Updated</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/30">
                      {filtered.map((c:any) => {
                        const stName = statusMap[c.status];
                        const active = c.id === selectedId;
                        return (
                          <tr
                            key={c.id}
                            className={`hover:bg-white/60 cursor-pointer ${
                              active ? 'bg-white/70' : ''
                            }`}
                            onClick={() => setSelectedId(active ? null : c.id)}
                          >
                            <Td>
                              <div className="font-medium text-gray-800 flex items-center gap-2">
                                <span className="material-icons text-[16px] text-indigo-500">report</span>
                                <span className="truncate max-w-[200px]">
                                  {c.title || 'Complaint #'+c.id}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 line-clamp-2 max-w-[280px]">
                                {c.description || 'No description.'}
                              </div>
                            </Td>
                            <Td>
                              <div className="text-gray-800 font-medium truncate max-w-[140px]">
                                {tenantName(c.tenant)}
                              </div>
                            </Td>
                            <Td>
                              <span className="text-[11px] text-gray-700">
                                {categoryMap[c.category] || '—'}
                              </span>
                            </Td>
                            <Td>
                              <span className={`px-2 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 border ${statusColor(stName)}`}>
                                <span className="material-icons text-[14px]">
                                  {stName?.toLowerCase()==='open' ? 'error'
                                    : stName?.toLowerCase()==='in progress' ? 'build'
                                    : stName?.toLowerCase()==='resolved' ? 'task_alt'
                                    : stName?.toLowerCase()==='closed' ? 'lock'
                                    : 'report'}
                                </span>
                                {stName || '—'}
                              </span>
                            </Td>
                            <Td>
                              <div className="flex flex-col">
                                <span>{shortDate(c.created_at)}</span>
                              </div>
                            </Td>
                            <Td>
                              <span>{shortDate(c.updated_at)}</span>
                            </Td>
                            <Td>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openUpdate(c); }}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-600 text-[11px] font-medium hover:bg-indigo-600/20 flex items-center gap-1"
                                >
                                  <span className="material-icons text-[14px]">edit</span>
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); handleClose(); }}
                                  disabled={(stName||'').toLowerCase()==='closed'}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600/10 text-rose-600 text-[11px] font-medium hover:bg-rose-600/20 flex items-center gap-1 disabled:opacity-40"
                                >
                                  <span className="material-icons text-[14px]">close</span>
                                  Close
                                </button>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>) : null}
            {/* END Desktop Table */}
          </div>

          {/* Side Panel */}
          <div className={`hidden xl:block w-[380px] transition-all duration-500 ${selected ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6 pointer-events-none'} relative`}>
            <div className="sticky top-6 space-y-6">
              <div className="backdrop-blur-xl bg-white/70 border border-white/30 rounded-3xl shadow-2xl p-6 min-h-[300px]">
                {selected ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow"><span className="material-icons text-base">report</span></div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-800 truncate">{selected.title || 'Complaint #'+selected.id}</h2>
                        <p className="text-[11px] text-indigo-600 flex items-center gap-1"><span className="material-icons text-[14px]">category</span>{categoryMap[selected.category] || '—'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <Info label="Status" icon="flag" value={statusMap[selected.status] || '—'} />
                      <Info label="Created" icon="today" value={shortDate(selected.created_at)} />
                      <Info label="Tenant" icon="person" value={tenantName(selected.tenant)} />
                      <Info label="ID" icon="tag" value={'#'+selected.id} />
                    </div>
                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 text-[12px] text-gray-700 leading-relaxed max-h-40 overflow-auto custom-scroll">
                      {selected.description || 'No description provided.'}
                    </div>
                    {selected.attachment && (
                      <a href={selected.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] text-indigo-600 font-medium hover:underline">
                        <span className="material-icons text-[16px]">attach_file</span>View Attachment
                      </a>
                    )}
                    {selected.feedback && (
                      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-700">
                        <span className="font-semibold mr-1">Feedback:</span>{selected.feedback}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={()=>openUpdate(selected)} className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg text-[11px] font-medium flex items-center justify-center gap-1"><span className="material-icons text-[14px]">edit</span>Edit</button>
                      <button onClick={handleClose} disabled={(statusMap[selected.status]||'').toLowerCase()==='closed'} className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 text-[11px] font-medium disabled:opacity-50">Close</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 text-sm">
                    <span className="material-icons text-4xl text-indigo-300 mb-4">inbox</span>Select a complaint card
                  </div>
                )}
              </div>
              <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-600/90 to-indigo-700/90 text-white rounded-3xl shadow-2xl p-6">
                <h3 className="text-sm font-semibold tracking-wide mb-4 flex items-center gap-2"><span className="material-icons text-[16px]">tips_and_updates</span>Resolution Tips</h3>
                <ul className="space-y-3 text-xs">
                  <li className="flex gap-2"><span className="material-icons text-emerald-300 text-[16px]">schedule</span>Acknowledge new complaints within 2h.</li>
                  <li className="flex gap-2"><span className="material-icons text-amber-300 text-[16px]">build</span>Prioritize maintenance impact issues.</li>
                  <li className="flex gap-2"><span className="material-icons text-blue-200 text-[16px]">task_alt</span>Add feedback notes for transparency.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Update Modal */}
        {showUpdate && selected && (
          <Modal onClose={()=>setShowUpdate(false)} title="Update Complaint" icon="edit">
            <form onSubmit={submitUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select label="Status *" value={updateForm.status_id||''} required onChange={(v)=>setUpdateForm(f=>({...f,status_id:Number(v)}))} options={statuses.map(s=>({ value:s.id, label:s.name }))} />
                <Textarea label="Feedback" value={updateForm.feedback} onChange={(v)=>setUpdateForm(f=>({...f,feedback:v}))} placeholder="Maintenance scheduled..." />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" icon="close" onClick={()=>setShowUpdate(false)}>Cancel</Button>
                <Button type="submit" loading={updating || closing} icon="save">Save</Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}

/* Reusable */
function Metric({ label, icon, value, color }:{label:string;icon:string;value:any;color:string}) {
  return (
    <div className="relative p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 flex flex-col gap-1 shadow overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
      <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 tracking-wide"><span className="material-icons text-[16px] text-gray-600">{icon}</span>{label}</div>
      <div className="text-2xl font-bold text-gray-900 leading-tight">{value}</div>
    </div>
  );
}
function Info({ label, value, icon }:{label:string; value:any; icon:string}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-gray-500 tracking-wide flex items-center gap-1"><span className="material-icons text-[12px] text-indigo-500">{icon}</span>{label}</span>
      <span className="text-[11px] text-gray-700 truncate">{value}</span>
    </div>
  );
}
function SelectField({ label, value, onChange, options }:{label:string; value:any; onChange:(v:any)=>void; options:{value:any; label:string}[]}) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className="px-4 py-2.5 rounded-lg bg-white/60 border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]">
        {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Modal({ children, onClose, title, icon }:{children:React.ReactNode; onClose:()=>void; title:string; icon:string}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] xl:max-w-4xl max-w-none sm:max-w-2xl overflow-y-auto backdrop-blur-xl bg-white/90 sm:bg-white/80 rounded-none sm:rounded-3xl shadow-2xl border border-white/30 p-6 sm:p-8 xl:p-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span className="material-icons text-indigo-600">{icon}</span>{title}</h2>
            <p className="text-xs text-gray-500 mt-1">Complaint lifecycle update</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/60 transition"><span className="material-icons text-gray-500">close</span></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Select({ label, value, onChange, options, required }:{label:string; value:any; onChange:(v:any)=>void; options:{value:any; label:string}[]; required?:boolean}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} required={required} onChange={e=>onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
        {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder }:{label:string; value:string; onChange:(v:string)=>void; placeholder?:string}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea rows={3} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
    </div>
  );
}
function Button({ children, type='button', variant='primary', icon, loading, onClick }:{children:React.ReactNode; type?:'button'|'submit'; variant?:'primary'|'secondary'; icon?:string; loading?:boolean; onClick?:()=>void}) {
  const base = 'px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition shadow';
  const styles = variant==='primary' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02]' : 'bg-white/60 backdrop-blur border border-white/30 text-gray-700 hover:bg-white/80';
  return (
    <button type={type} onClick={onClick} disabled={loading} className={`${base} ${styles} disabled:opacity-60 disabled:cursor-not-allowed`}>
      {loading && <span className="material-icons text-sm animate-spin">progress_activity</span>}
      {icon && !loading && <span className="material-icons text-sm">{icon}</span>}
      {children}
    </button>
  );
}
function Th({ children }:{children:any}) {
  return <th className="px-6 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children }:{children:any}) {
  return <td className="px-6 py-4 align-top">{children}</td>;
}