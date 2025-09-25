import React, { useState, useMemo } from 'react';
import { 
  useGetPaymentsQuery, // CHANGED: Use payment APIs
  useGetPendingPaymentsQuery,
  useGetOverduePaymentsQuery,
  useGetPaymentStatusesQuery,
  useCreatePaymentMutation, // CHANGED: Use payment APIs
  useUpdatePaymentStatusMutation,
  useDeletePaymentMutation
} from '../../services/paymentApi'; // CHANGED: Use payment API
import { useGetTenantsQuery } from '../../services';

interface SecurityDepositForm {
  tenant: number;
  amount: number;
  status: number;
  due_date: string;
  payment_for_year: number;
  notes?: string;
  payment_method?: string;
  reference_number?: string;
  refund_status?: string;
  payment_type: string; // ADDED: To set as 'Security Deposit'
}

interface UpdateSecurityDepositForm {
  tenant: number;
  amount: number;
  payment_for_year: number;
  due_date: string;
  status_id: number;
  payment_method: string;
  reference_number: string;
  notes: string;
  refund_status: string;
  payment_type: string; // ADDED: To set as 'Security Deposit'
}

export default function SecurityDepositsPageManager() {
  // Tabs & filters
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue'>('all');
  const [filterTenant, setFilterTenant] = useState<number | ''>('');
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<number | ''>('');

  // UI state
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);

  // API queries (include filters) + refetch handles
  const { data: allDeposits = [], isLoading: depositsLoading, refetch: refetchDeposits } = useGetPaymentsQuery({
    tenant_id: filterTenant || undefined,
    month: filterMonth || undefined,
    year: filterYear,
    status_id: filterStatus || undefined,
    payment_type: 'Security Deposit'
  });
  const { data: pendingDeposits = [], refetch: refetchPending } = useGetPendingPaymentsQuery(); // REMOVED: payment_type param
  const { data: overdueDeposits = [], refetch: refetchOverdue } = useGetOverduePaymentsQuery(); // REMOVED: payment_type param
  const { data: depositStatuses = [], refetch: refetchStatuses } = useGetPaymentStatusesQuery();
  const { data: tenants = [], refetch: refetchTenants } = useGetTenantsQuery({});

  // Mutations
  const [createDeposit, { isLoading: creating }] = useCreatePaymentMutation(); // CHANGED: Use payment API
  const [updateDepositStatus, { isLoading: updating }] = useUpdatePaymentStatusMutation(); // CHANGED: Use payment API
  const [deleteDeposit, { isLoading: deleting }] = useDeletePaymentMutation(); // CHANGED: Use payment API

  // Form states
  const [depositForm, setDepositForm] = useState<SecurityDepositForm>({
    tenant: 0,
    amount: 0,
    status: 1,
    due_date: '',
    payment_for_year: new Date().getFullYear(),
    notes: '',
    payment_method: '',
    reference_number: '',
    refund_status: '',
    payment_type: 'Security Deposit', // NEW: Set default to Security Deposit
  });
  const [updateForm, setUpdateForm] = useState<UpdateSecurityDepositForm>({
    tenant: 0,
    amount: 0,
    payment_for_year: new Date().getFullYear(),
    due_date: '',
    status_id: 0,
    payment_method: '',
    reference_number: '',
    notes: '',
    refund_status: '',
    payment_type: 'Security Deposit', // NEW: Set default to Security Deposit
  });

  // Constants
  const months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];
  const paymentMethods = ['Bank Transfer', 'Cash', 'Mobile Money', 'Cheque', 'Online Payment'];
  const refundStatuses = ['Pending', 'Refunded', 'Withheld'];

  // Helpers
  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatCurrency = (a: string | number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(Number(a));
  const isOverdue = (due: string, status: string) => new Date(due) < new Date() && status.toLowerCase() !== 'paid';
  const statusColor = (name: string) => {
    const n = name?.toLowerCase();
    if (n === 'paid') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (n === 'pending') return 'bg-amber-100 text-amber-700 border border-amber-200';
    if (n === 'overdue') return 'bg-red-100 text-red-700 border border-red-200';
    if (n === 'partial') return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const enhance = (p: any) => p; // Placeholder

  const statusNameOf = (d:any) => (depositStatuses.find(s=>s.id===d.status)?.name||'').toLowerCase();
  const displayedDeposits = useMemo(() => {
    let base = activeTab === 'pending' ? pendingDeposits : activeTab === 'overdue' ? overdueDeposits : allDeposits;
    // Fallback when tab endpoints don't filter by type or return empty
    if (activeTab !== 'all') {
      if (base.length === 0) {
        base = allDeposits.filter(d => activeTab==='pending' ? statusNameOf(d)==='pending' : statusNameOf(d)==='overdue');
      }
    }
    // Always enforce Security Deposit type
    base = base.filter(d => (d.payment_type||'').toLowerCase() === 'security deposit');
    return base
      .map(enhance)
      .filter(d => (filterTenant ? d.tenant === filterTenant : true))
      .filter(d => (filterMonth ? d.payment_for_month === filterMonth : true))
      .filter(d => (filterYear ? d.payment_for_year === filterYear : true))
      .filter(d => (filterStatus ? d.status === filterStatus : true));
  }, [activeTab, pendingDeposits, overdueDeposits, allDeposits, depositStatuses, filterTenant, filterMonth, filterYear, filterStatus]);

  // Derived metrics
  const filteredAll = useMemo(() => (
    allDeposits
      .filter(d => (d.payment_type||'').toLowerCase() === 'security deposit')
      .map(enhance)
      .filter(d => (filterTenant ? d.tenant === filterTenant : true))
      .filter(d => (filterMonth ? d.payment_for_month === filterMonth : true))
      .filter(d => (filterYear ? d.payment_for_year === filterYear : true))
      .filter(d => (filterStatus ? d.status === filterStatus : true))
  ), [allDeposits, filterTenant, filterMonth, filterYear, filterStatus]);

  const totalDeposits = filteredAll.length;
  const pendingDepositsCount = filteredAll.filter(d => statusNameOf(d)==='pending').length;
  const overdueDepositsCount = filteredAll.filter(d => statusNameOf(d)==='overdue').length;
  const refundedDeposits = filteredAll.filter(d => (d.refund_status||'').toLowerCase() === 'refunded').length;

  // Helper function to get status name from ID
  const getStatusName = (statusId: number) => {
    const status = depositStatuses.find(s => s.id === statusId);
    return status?.name || 'Unknown';
  };

  // Handlers
  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      await createDeposit(depositForm).unwrap(); // CHANGED: Use payment API
      setShowDepositForm(false); 
    } catch (err) { console.error(err); }
  };
  const handleUpdateDeposit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedDeposit) return; try { await updateDepositStatus({ id: selectedDeposit.id, update: updateForm }).unwrap(); setShowUpdateForm(false); setSelectedDeposit(null); } catch (err) { console.error(err); } }; // CHANGED: Use payment API
  const handleDelete = async (d:any) => {
    if (!window.confirm('Delete this security deposit?')) return;
    try { await deleteDeposit(d.id).unwrap(); } catch(e){ console.error(e); } // CHANGED: Use payment API
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchDeposits(),
        refetchPending(),
        refetchOverdue(),
        refetchStatuses(),
        refetchTenants()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // NEW: derive tenant + status helpers once
  const getStatusObj = (d:any) => depositStatuses.find(s=>s.id===d.status);
  const getTenantObj = (d:any) => tenants.find(t=>t.id===d.tenant);

  return (
    <div className="min-h-screen p-4 lg:p-6 xl:p-8 relative overflow-hidden">
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
      <div className="max-w-none mx-auto relative z-10">
        {/* Header - UPDATED for wrap */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden mb-10">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl"><span className="material-icons text-white text-2xl">security</span></div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Security Deposits Management</h1>
                <p className="text-gray-600 text-sm mt-1">Track security deposits, statuses and refunds</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap w-full md:w-auto items-center justify-center">
              <button onClick={handleRefresh} disabled={refreshing} className="px-5 py-3 rounded-xl bg-white/60 text-gray-700 border border-white/40 shadow hover:bg-white/80 text-sm font-medium flex items-center gap-2 disabled:opacity-60">
                <span className={`material-icons text-sm ${refreshing?'animate-spin':''}`}>{refreshing?'progress_activity':'refresh'}</span>
                Refresh
              </button>
              <button onClick={()=>setShowDepositForm(true)} className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow hover:shadow-lg text-sm font-medium flex items-center gap-2"><span className="material-icons text-sm">add_card</span>New Deposit</button>
            </div>
          </div>
        </div>

        {/* Metrics (minor: add sm:grid-cols-2 for narrow) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <MetricCard label="TOTAL" icon="security" value={totalDeposits} desc="All deposits" color="from-blue-500 to-blue-600" />
          <MetricCard label="PENDING" icon="schedule" value={pendingDepositsCount} desc="Awaiting" color="from-amber-500 to-amber-600" />
          <MetricCard label="REFUNDED" icon="check_circle" value={refundedDeposits} desc="Returned" color="from-emerald-500 to-emerald-600" />
          <MetricCard label="OVERDUE" icon="error" value={overdueDepositsCount} desc="Needs action" color="from-red-500 to-red-600" /> {/* UPDATED: Use filtered count */}
        </div>

        {/* Filters - UPDATED stacking */}
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-xl p-6 space-y-5 mb-10">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 items-end">
            <SelectField label="Tenant" value={filterTenant} onChange={v=>setFilterTenant(v===''? '' : Number(v))} options={[{value:'', label:'All Tenants'}, ...tenants.map(t=>({ value: t.id, label: `${t.user_details?.first_name||''} ${t.user_details?.last_name||''}`.trim() || t.user_details?.username || 'Tenant'}))]} />
            <SelectField label="Status" value={filterStatus} onChange={v=>setFilterStatus(v===''? '' : Number(v))} options={[{value:'', label:'All Status'}, ...depositStatuses.map(s=>({ value: s.id, label: s.name }))]} />
            <SelectField label="Month" value={filterMonth} onChange={v=>setFilterMonth(v===''? '' : Number(v))} options={[{value:'', label:'All Months'}, ...months.map(m=>({ value: m.value, label: m.name }))]} />
            <SelectField label="Year" value={filterYear} onChange={v=>setFilterYear(Number(v))} options={[{value: filterYear, label: String(filterYear)}, {value: filterYear-1, label: String(filterYear-1)}, {value: filterYear+1, label: String(filterYear+1)}]} />
          </div>
          <div className="flex gap-3 text-xs font-medium overflow-x-auto">
            {['all','pending','overdue'].map(t => (
              <button key={t} onClick={()=>setActiveTab(t as any)} className={`px-4 py-2 rounded-lg border backdrop-blur transition ${activeTab===t ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow' : 'bg-white/60 border-white/30 text-gray-600 hover:bg-white/80'}`}>{t.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* MOBILE CARDS (NEW) */}
        {window.innerWidth < 640 ? (
        <div className="space-y-4">
          {depositsLoading ? (
            <div className="text-center text-sm text-gray-500 py-8">Loading deposits...</div>
          ) : displayedDeposits.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-8">No deposits found</div>
          ) : (
            displayedDeposits.map(d => {
              const statusObj = getStatusObj(d);
              const tenant = getTenantObj(d);
              const overdue = isOverdue(d.due_date, statusObj?.name||'');
              return (
                <div key={d.id} className="rounded-2xl bg-white/70 backdrop-blur border border-white/30 p-4 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {tenant ? `${tenant.user_details?.first_name||''} ${tenant.user_details?.last_name||''}`.trim() || tenant.user_details?.username : 'Tenant'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">{tenant?.user_details?.email || '—'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-medium ${statusColor(statusObj?.name||'Unknown')}`}>
                      {statusObj?.name || '—'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                    <BadgeMobile label="Amount" value={formatCurrency(d.amount)} />
                    <BadgeMobile label="Refund" value={d.refund_status || 'N/A'} />
                    <BadgeMobile label="Due" value={formatDate(d.due_date)} danger={overdue} />
                    <BadgeMobile label="Status" value={getStatusName(d.status)} /> {/* UPDATED: Show status name */}
                    {d.payment_method && <BadgeMobile label="Method" value={d.payment_method} />}
                    {d.reference_number && <BadgeMobile label="Ref" value={d.reference_number} />}
                  </div>
                  {overdue && <p className="mt-2 text-[10px] font-semibold text-rose-600">OVERDUE</p>}
                  {d.paid_at && <p className="mt-1 text-[10px] text-emerald-600">Paid {formatDate(d.paid_at)}</p>}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={()=>{
                        setSelectedDeposit(d);
                        setUpdateForm({ tenant: d.tenant, amount: d.amount, payment_for_year: d.payment_for_year, due_date: d.due_date, status_id: d.status, payment_method: d.payment_method || '', reference_number: d.reference_number || '', notes: d.notes || '', refund_status: d.refund_status || '', payment_type: 'Security Deposit' }); // NEW: Set payment_type
                        setShowUpdateForm(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-600/10 text-blue-600 text-[11px] font-medium flex items-center justify-center gap-1"
                    >
                      <span className="material-icons text-[14px]">edit</span>Edit
                    </button>
                    <button
                      disabled={deleting}
                      onClick={()=>handleDelete(d)}
                      className="flex-1 px-3 py-2 rounded-lg bg-rose-600/10 text-rose-600 text-[11px] font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <span className="material-icons text-[14px]">{deleting?'hourglass_top':'delete'}</span>
                      Del
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>) : null}

        {/* DESKTOP TABLE (hidden on mobile) */}
        {window.innerWidth >= 640 ? (
        <div className="sm:block backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/20">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><span className="material-icons text-blue-600 text-base">security</span>Security Deposits <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 font-medium">{displayedDeposits.length}</span></h2>
            {depositsLoading && <span className="text-xs text-blue-600 flex items-center gap-1"><span className="material-icons text-[14px] animate-spin">progress_activity</span>Loading...</span>}
          </div>
          {depositsLoading ? (
            <div className="py-16 text-center text-sm text-gray-500">Loading deposits...</div>
          ) : displayedDeposits.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">No deposits found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white/70 backdrop-blur">
                  <tr className="text-[10px] uppercase tracking-wide text-gray-600">
                    <Th>Tenant</Th><Th>Amount</Th><Th>Refund Status</Th><Th>Due</Th><Th>Status</Th><Th>Method</Th><Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30">
                  {displayedDeposits.map(d => {
                    const statusObj = depositStatuses.find(s=>s.id===d.status);
                    const tenant = tenants.find(t=>t.id===d.tenant);
                    return (
                      <tr key={d.id} className="hover:bg-white/60">
                        <Td>
                          <div className="font-medium text-gray-800">{tenant ? `${tenant.user_details?.first_name||''} ${tenant.user_details?.last_name||''}`.trim() || tenant.user_details?.username : '—'}</div>
                          <div className="text-[11px] text-gray-500">{tenant?.user_details?.email || '—'}</div>
                        </Td>
                        <Td><span className="font-semibold text-gray-800">{formatCurrency(d.amount)}</span></Td>
                        <Td>{d.refund_status || 'N/A'}</Td>
                        <Td>
                          <div className="flex flex-col"><span>{formatDate(d.due_date)}</span>{isOverdue(d.due_date, statusObj?.name||'') && <span className="text-[10px] font-semibold text-red-600">OVERDUE</span>}{d.paid_at && <span className="text-[10px] text-emerald-600">Paid {formatDate(d.paid_at)}</span>}</div>
                        </Td>
                        <Td>
                          <span className={`px-2 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 ${statusColor(statusObj?.name||'Unknown')}`}>
                            <span className="material-icons text-[14px]">{(statusObj?.name||'').toLowerCase()==='paid'?'task_alt':(statusObj?.name||'').toLowerCase()==='overdue'?'warning':(statusObj?.name||'').toLowerCase()==='pending'?'schedule':'security'}</span>
                            {statusObj?.name || 'Unknown'} {/* UPDATED: Ensure status name is displayed */}
                          </span>
                        </Td>
                        <Td><span className="text-[11px] text-gray-700">{d.payment_method || '—'}</span></Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <button onClick={()=>{ setSelectedDeposit(d); setUpdateForm({ tenant: d.tenant, amount: d.amount, payment_for_year: d.payment_for_year, due_date: d.due_date, status_id: d.status, payment_method: d.payment_method || '', reference_number: d.reference_number || '', notes: d.notes || '', refund_status: d.refund_status || '', payment_type: 'Security Deposit' }); setShowUpdateForm(true); }} className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 text-[11px] font-medium hover:bg-blue-600/20 flex items-center gap-1"> 
                              <span className="material-icons text-[14px]">edit</span>Edit
                            </button>
                            <button disabled={deleting} onClick={()=>handleDelete(d)} className="px-3 py-1.5 rounded-lg bg-red-600/10 text-red-600 text-[11px] font-medium hover:bg-red-600/20 flex items-center gap-1 disabled:opacity-40">
                              <span className="material-icons text-[14px]">{deleting?'hourglass_top':'delete'}</span>Del
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
      </div>

      {/* Create Deposit Modal - UPDATED for mobile full screen */}
      {showDepositForm && (
        <Modal onClose={()=>setShowDepositForm(false)} title="Create Security Deposit" icon="add_card">
          <form onSubmit={handleCreateDeposit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Tenant *" value={depositForm.tenant||''} required onChange={v=>setDepositForm(f=>({...f,tenant:Number(v)}))} options={[{value:'', label:'Select Tenant'}, ...tenants.map(t=>({ value: t.id, label: `${t.user_details?.first_name||''} ${t.user_details?.last_name||''}`.trim() || t.user_details?.username }))]} />
              <Input label="Amount (UGX) *" type="number" value={depositForm.amount||''} required onChange={v=>setDepositForm(f=>({...f,amount:Number(v)}))} placeholder="500000" />
              <Select label="Year *" value={depositForm.payment_for_year} required onChange={v=>setDepositForm(f=>({...f,payment_for_year:Number(v)}))} options={[depositForm.payment_for_year, depositForm.payment_for_year+1, depositForm.payment_for_year-1].map(y=>({ value:y, label:String(y) }))} />
              <Input label="Due Date *" type="date" value={depositForm.due_date} required onChange={v=>setDepositForm(f=>({...f,due_date:v}))} />
              <Select label="Status *" value={depositForm.status} required onChange={v=>setDepositForm(f=>({...f,status:Number(v)}))} options={depositStatuses.map(s=>({ value:s.id, label:s.name }))} />
              <Select label="Method" value={depositForm.payment_method||''} onChange={v=>setDepositForm(f=>({...f,payment_method:v}))} options={[{value:'',label:'Select'}, ...paymentMethods.map(m=>({ value:m, label:m }))]} />
              <Input label="Reference" value={depositForm.reference_number||''} onChange={v=>setDepositForm(f=>({...f,reference_number:v}))} placeholder="TXN123..." />
              <Select label="Refund Status" value={depositForm.refund_status||''} onChange={v=>setDepositForm(f=>({...f,refund_status:v}))} options={[{value:'',label:'Select'}, ...refundStatuses.map(r=>({ value:r, label:r }))]} />
              <Textarea className="md:col-span-2" label="Notes" value={depositForm.notes||''} onChange={v=>setDepositForm(f=>({...f,notes:v}))} placeholder="Deposit details" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" icon="close" onClick={()=>setShowDepositForm(false)}>Cancel</Button>
              <Button type="submit" loading={creating} icon="save">Create</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Deposit Modal - UPDATED for mobile full screen */}
      {showUpdateForm && selectedDeposit && (
        <Modal onClose={()=>setShowUpdateForm(false)} title="Update Security Deposit" icon="edit">
          <div className="mb-4 p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><span className="material-icons text-blue-600 text-base">person</span>Tenant #{selectedDeposit.tenant}</p>
            <p className="text-[11px] text-gray-500">Deposit for {selectedDeposit.payment_for_year}</p>
          </div>
          <form onSubmit={handleUpdateDeposit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Tenant *" value={updateForm.tenant||''} required onChange={v=>setUpdateForm(f=>({...f,tenant:Number(v)}))} options={[{value:'', label:'Select Tenant'}, ...tenants.map(t=>({ value: t.id, label: `${t.user_details?.first_name||''} ${t.user_details?.last_name||''}`.trim() || t.user_details?.username }))]} />
              <Input label="Amount (UGX) *" type="number" value={updateForm.amount||''} required onChange={v=>setUpdateForm(f=>({...f,amount:Number(v)}))} placeholder="500000" />
              <Select label="Year *" value={updateForm.payment_for_year} required onChange={v=>setUpdateForm(f=>({...f,payment_for_year:Number(v)}))} options={[updateForm.payment_for_year, updateForm.payment_for_year+1, updateForm.payment_for_year-1].map(y=>({ value:y, label:String(y) }))} />
              <Input label="Due Date *" type="date" value={updateForm.due_date} required onChange={v=>setUpdateForm(f=>({...f,due_date:v}))} />
              <Select 
                label="Status *" 
                value={updateForm.status_id||''} 
                required 
                onChange={v=>setUpdateForm(f=>({...f,status_id:Number(v)}))} 
                options={depositStatuses.map(s=>({ 
                  value:s.id, 
                  label:s.name 
                }))} 
              />
              <Select label="Method" value={updateForm.payment_method} onChange={v=>setUpdateForm(f=>({...f,payment_method:v}))} options={[{value:'',label:'Select'}, ...paymentMethods.map(m=>({ value:m, label:m }))]} />
              <Input label="Reference" value={updateForm.reference_number} onChange={v=>setUpdateForm(f=>({...f,reference_number:v}))} placeholder="TXN123..." />
              <Select label="Refund Status" value={updateForm.refund_status} onChange={v=>setUpdateForm(f=>({...f,refund_status:v}))} options={[{value:'',label:'Select'}, ...refundStatuses.map(r=>({ value:r, label:r }))]} />
              <Textarea className="md:col-span-2" label="Notes" value={updateForm.notes} onChange={v=>setUpdateForm(f=>({...f,notes:v}))} placeholder="Update details" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" icon="close" onClick={()=>setShowUpdateForm(false)}>Cancel</Button>
              <Button type="submit" loading={updating} icon="save">Update & Notify</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ===== Reusable UI Components ===== */
function MetricCard({ label, icon, value, desc, color }:{label:string;icon:string;value:any;desc:string;color:string}) {
  return (
    <div className="relative p-5 rounded-2xl bg-white/60 backdrop-blur border border-white/30 shadow flex flex-col gap-1 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-gray-500"><span className="material-icons text-[16px] text-gray-600">{icon}</span>{label}</div>
      <div className="text-2xl font-bold text-gray-900 leading-tight">{value}</div>
      <div className="text-[11px] text-gray-500">{desc}</div>
    </div>
  );
}
function Th({ children }:{children:any}) { return <th className="px-6 py-3 text-left font-semibold">{children}</th>; }
function Td({ children }:{children:any}) { return <td className="px-6 py-4 align-top">{children}</td>; }

// NEW: Mobile badge helper
function BadgeMobile({ label, value, danger }:{label:string; value:any; danger?:boolean}) {
  return (
    <span className={`px-2 py-1 rounded-lg text-[10px] font-medium bg-white/60 border border-white/30 ${danger?'text-rose-600':'text-gray-700'}`}>
      <span className="text-[9px] uppercase tracking-wide text-gray-400 mr-1">{label}</span>{value}
    </span>
  );
}

// UPDATED: Modal for responsive full-screen on mobile
function Modal({ children, onClose, title, icon }:{children:React.ReactNode; onClose:()=>void; title:string; icon:string}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] xl:max-w-4xl max-w-none sm:max-w-3xl overflow-y-auto backdrop-blur-xl bg-white/90 sm:bg-white/80 rounded-none sm:rounded-3xl shadow-2xl border border-white/30 p-6 sm:p-8 xl:p-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="material-icons text-blue-600">{icon}</span>{title}
            </h2>
            <p className="text-[10px] text-gray-500 mt-1">Secure transaction management</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/60 transition">
            <span className="material-icons text-gray-500">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type='text', placeholder, required }: {label:string; value:any; onChange:(v:string)=>void; type?:string; placeholder?:string; required?:boolean}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} required={required} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
    </div>
  );
}
function Select({ label, value, onChange, options, required }: {label:string; value:any; onChange:(v:any)=>void; options:{value:any; label:string}[]; required?:boolean}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} required={required} onChange={e=>onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder, className='' }:{label:string; value:string; onChange:(v:string)=>void; placeholder?:string; className?:string}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea rows={3} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
    </div>
  );
}
function Button({ children, type='button', variant='primary', icon, loading, onClick }:{children:React.ReactNode; type?:'button'|'submit'; variant?:'primary'|'secondary'; icon?:string; loading?:boolean; onClick?:()=>void}) {
  const base = 'px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition shadow';
  const styles = variant==='primary' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:scale-[1.02]' : 'bg-white/60 backdrop-blur border border-white/30 text-gray-700 hover:bg-white/80';
  return (
    <button type={type} onClick={onClick} disabled={loading} className={`${base} ${styles} disabled:opacity-60 disabled:cursor-not-allowed`}>
      {loading && <span className="material-icons text-sm animate-spin">progress_activity</span>}
      {icon && !loading && <span className="material-icons text-sm">{icon}</span>}
      {children}
    </button>
  );
}
function SelectField({ label, value, onChange, options }:{label:string; value:any; onChange:(v:any)=>void; options:{value:any; label:string}[]}) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className="px-4 py-2.5 rounded-lg bg-white/60 border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]">
        {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}