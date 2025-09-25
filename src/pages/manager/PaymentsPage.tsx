import React, { useState, useMemo } from 'react';
import { 
  useGetPaymentsQuery,
  useGetPendingPaymentsQuery,
  useGetOverduePaymentsQuery,
  useGetPaymentStatusesQuery,
  useCreatePaymentMutation,
  useUpdatePaymentStatusMutation,
  useDeletePaymentMutation
} from '../../services/paymentApi';
import { useGetTenantsQuery } from '../../services';

interface PaymentForm {
  tenant: number;
  amount: number;
  status: number;
  due_date: string;
  payment_for_year: number;
  notes?: string;
  payment_method?: string;
  reference_number?: string;
  months_paid?: number[];
  payment_type: string; // NEW: Added payment_type
}

interface UpdatePaymentForm {
  tenant: number;
  amount: number;
  payment_for_year: number;
  due_date: string;
  status_id: number;
  months_paid: number[];
  payment_method: string;
  reference_number: string;
  notes: string;
  payment_type: string; // NEW: Added payment_type
}

export default function PaymentsPageManager() {
  // Tabs & filters
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue'>('all');
  const [filterTenant, setFilterTenant] = useState<number | ''>('');
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<number | ''>('');

  // UI state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // API queries (include filters) + refetch handles
  const { data: allPayments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useGetPaymentsQuery({
    tenant_id: filterTenant || undefined,
    month: filterMonth || undefined,
    year: filterYear,
    status_id: filterStatus || undefined
  });
  const { data: pendingPayments = [], refetch: refetchPending } = useGetPendingPaymentsQuery();
  const { data: overduePayments = [], refetch: refetchOverdue } = useGetOverduePaymentsQuery();
  const { data: paymentStatuses = [], refetch: refetchStatuses } = useGetPaymentStatusesQuery();
  const { data: tenants = [], refetch: refetchTenants } = useGetTenantsQuery({});

  // Mutations
  const [createPayment, { isLoading: creating }] = useCreatePaymentMutation();
  const [updatePaymentStatus, { isLoading: updating }] = useUpdatePaymentStatusMutation();
  const [deletePayment, { isLoading: deleting }] = useDeletePaymentMutation();

  // Form states
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    tenant: 0,
    amount: 0,
    status: 1,
    due_date: '',
    payment_for_year: new Date().getFullYear(),
    notes: '',
    payment_method: '',
    reference_number: '',
    months_paid: [],
    payment_type: '', // NEW: Added payment_type
  });
  const [updateForm, setUpdateForm] = useState<UpdatePaymentForm>({
    tenant: 0,
    amount: 0,
    payment_for_year: new Date().getFullYear(),
    due_date: '',
    status_id: 0,
    months_paid: [],
    payment_method: '',
    reference_number: '',
    notes: '',
    payment_type: '', // NEW: Added payment_type
  });

  // Constants
  const months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];
  const paymentMethods = ['Bank Transfer', 'Cash', 'Mobile Money', 'Cheque', 'Online Payment'];
  const paymentTypes = ['Rent', 'Security Deposit', 'Maintenance', 'Utilities', 'Other']; // NEW: Added payment types

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

  const enhance = (p: any) => p; // Placeholder (API shape already flat)

  const getStatusName = (p:any) => {
    const id = p.status ?? p.status_id;
    const s = paymentStatuses.find(x=>x.id===id);
    const name = s?.name || (typeof p.status === 'string' ? p.status : '');
    return (name||'').toLowerCase();
  };

  const displayedPayments = useMemo(() => {
    let base = activeTab === 'pending' ? pendingPayments : activeTab === 'overdue' ? overduePayments : allPayments;
    // Fallback: if tab array empty, derive from allPayments by status name
    if (activeTab !== 'all' && base.length === 0) {
      base = allPayments.filter(p => {
        const n = getStatusName(p);
        return activeTab === 'pending' ? n === 'pending' : n === 'overdue';
      });
    }

    const filtered = base
      .map(enhance)
      .filter(p => (filterTenant ? p.tenant === filterTenant : true))
      .filter(p => (filterMonth ? p.payment_for_month === filterMonth : true))
      .filter(p => (filterYear ? p.payment_for_year === filterYear : true));

    // Only apply explicit status filter on All tab; Pending/Overdue tabs already imply status
    return activeTab === 'all'
      ? filtered.filter(p => (filterStatus ? (p.status ?? p.status_id) === filterStatus : true))
      : filtered;
  }, [activeTab, pendingPayments, overduePayments, allPayments, filterTenant, filterMonth, filterYear, filterStatus, paymentStatuses]);

  // Derived metrics (filtered)
  const filteredAll = useMemo(() => (
    allPayments
      .map(enhance)
      .filter(p => (filterTenant ? p.tenant === filterTenant : true))
      .filter(p => (filterMonth ? p.payment_for_month === filterMonth : true))
      .filter(p => (filterYear ? p.payment_for_year === filterYear : true))
      .filter(p => (filterStatus ? p.status === filterStatus : true))
  ), [allPayments, filterTenant, filterMonth, filterYear, filterStatus]);

  // Note: we now compute pending/overdue counts from filteredAll for consistency

  const thisMonthRevenue = useMemo(() => (
    filteredAll
      .filter(p => p.payment_for_month === (new Date().getMonth() + 1) && p.payment_for_year === new Date().getFullYear() && paymentStatuses.find(s=>s.id===p.status)?.name?.toLowerCase()==='paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  ), [filteredAll, paymentStatuses]);

  const filteredPendingCount = useMemo(() => (
    filteredAll.filter(p => getStatusName(p) === 'pending').length
  ), [filteredAll, paymentStatuses]);

  const filteredOverdueCount = useMemo(() => (
    filteredAll.filter(p => getStatusName(p) === 'overdue').length
  ), [filteredAll, paymentStatuses]);

  // Handlers
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      await createPayment({ ...paymentForm, payment_type: paymentForm.payment_type }); // NEW: Include payment_type
      setShowPaymentForm(false); 
    } catch (err) { console.error(err); }
  };
  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedPayment) return; try { await updatePaymentStatus({ id: selectedPayment.id, update: { ...updateForm, payment_type: updateForm.payment_type } }).unwrap(); setShowUpdateForm(false); setSelectedPayment(null); } catch (err) { console.error(err); } }; // NEW: Include payment_type
  const handleDelete = async (p:any) => {
    if (!window.confirm('Delete this payment?')) return;
    try { await deletePayment(p.id).unwrap(); } catch(e){ console.error(e); }
  };
  const toggleMonth = (m:number) => setUpdateForm(f=> ({ ...f, months_paid: f.months_paid.includes(m)? f.months_paid.filter(x=>x!==m) : [...f.months_paid, m].sort((a,b)=>a-b) }));
  const toggleCreateMonth = (m:number) =>
    setPaymentForm(f=> ({ ...f, months_paid: f.months_paid?.includes(m) ? f.months_paid.filter(x=>x!==m) : [...(f.months_paid||[]), m].sort((a,b)=>a-b) }));

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPayments(),
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
  const getStatusObj = (p:any) => paymentStatuses.find(s=>s.id===p.status);
  const getTenantObj = (p:any) => tenants.find(t=>t.id===p.tenant);

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
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl"><span className="material-icons text-white text-2xl">payments</span></div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Payment Management</h1>
                <p className="text-gray-600 text-sm mt-1">Track rent invoices, statuses and revenue</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap w-full md:w-auto items-center justify-center">
              <button onClick={handleRefresh} disabled={refreshing} className="px-5 py-3 rounded-xl bg-white/60 text-gray-700 border border-white/40 shadow hover:bg-white/80 text-sm font-medium flex items-center gap-2 disabled:opacity-60">
                <span className={`material-icons text-sm ${refreshing?'animate-spin':''}`}>{refreshing?'progress_activity':'refresh'}</span>
                Refresh
              </button>
              <button onClick={()=>setShowPaymentForm(true)} className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow hover:shadow-lg text-sm font-medium flex items-center gap-2"><span className="material-icons text-sm">add_card</span>New Payment</button>
            </div>
          </div>
        </div>

        {/* Metrics (minor: add sm:grid-cols-2 for narrow) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <MetricCard label="TOTAL" icon="paid" value={filteredAll.length} desc="All records" color="from-blue-500 to-blue-600" />
          <MetricCard label="PENDING" icon="schedule" value={filteredPendingCount} desc="Awaiting" color="from-amber-500 to-amber-600" />
          <MetricCard label="OVERDUE" icon="error" value={filteredOverdueCount} desc="Needs action" color="from-red-500 to-red-600" />
          <MetricCard label="MONTH REVENUE" icon="trending_up" value={formatCurrency(thisMonthRevenue)} desc="Paid this month" color="from-emerald-500 to-emerald-600" />
        </div>

        {/* Filters - UPDATED stacking */}
        <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-xl p-6 space-y-5 mb-10">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 items-end">
            <SelectField label="Tenant" value={filterTenant} onChange={v=>setFilterTenant(v===''? '' : Number(v))} options={[{value:'', label:'All Tenants'}, ...tenants.map(t=>({ value: t.id, label: `${t.user_details?.first_name||''} ${t.user_details?.last_name||''}`.trim() || t.user_details?.username || 'Tenant'}))]} />
            <SelectField label="Status" value={filterStatus} onChange={v=>setFilterStatus(v===''? '' : Number(v))} options={[{value:'', label:'All Status'}, ...paymentStatuses.map(s=>({ value: s.id, label: s.name }))]} />
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
          {paymentsLoading ? (
            <div className="text-center text-sm text-gray-500 py-8">Loading payments...</div>
          ) : displayedPayments.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-8">No payments found</div>
          ) : (
            displayedPayments.map(p => {
              const statusObj = getStatusObj(p);
              const tenant = getTenantObj(p);
              const overdue = isOverdue(p.due_date, statusObj?.name||'');
              return (
                <div key={p.id} className="rounded-2xl bg-white/70 backdrop-blur border border-white/30 p-4 shadow-sm">
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
                    <BadgeMobile label="Amount" value={formatCurrency(p.amount)} />
                    <BadgeMobile label="Period" value={`${months.find(m=>m.value===p.payment_for_month)?.name} ${p.payment_for_year}`} />
                    <BadgeMobile label="Due" value={formatDate(p.due_date)} danger={overdue} />
                    <BadgeMobile label="Type" value={p.payment_type || 'N/A'} /> {/* NEW: Added payment type badge */}
                    {p.payment_method && <BadgeMobile label="Method" value={p.payment_method} />}
                    {p.reference_number && <BadgeMobile label="Ref" value={p.reference_number} />}
                  </div>
                  {overdue && <p className="mt-2 text-[10px] font-semibold text-rose-600">OVERDUE</p>}
                  {p.paid_at && <p className="mt-1 text-[10px] text-emerald-600">Paid {formatDate(p.paid_at)}</p>}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={()=>{
                        setSelectedPayment(p);
                        setUpdateForm({ tenant: p.tenant, amount: p.amount, payment_for_year: p.payment_for_year, due_date: p.due_date, status_id: p.status, months_paid: [p.payment_for_month], payment_method: p.payment_method || '', reference_number: p.reference_number || '', notes: p.notes || '', payment_type: p.payment_type || '' }); // FIXED: Added payment_type
                        setShowUpdateForm(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-600/10 text-blue-600 text-[11px] font-medium flex items-center justify-center gap-1"
                    >
                      <span className="material-icons text-[14px]">edit</span>Edit
                    </button>
                    <button
                      disabled={deleting}
                      onClick={()=>handleDelete(p)}
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
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><span className="material-icons text-blue-600 text-base">table_view</span>Payments <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 font-medium">{displayedPayments.length}</span></h2>
            {paymentsLoading && <span className="text-xs text-blue-600 flex items-center gap-1"><span className="material-icons text-[14px] animate-spin">progress_activity</span>Loading...</span>}
          </div>
          {paymentsLoading ? (
            <div className="py-16 text-center text-sm text-gray-500">Loading payments...</div>
          ) : displayedPayments.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">No payments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white/70 backdrop-blur">
                  <tr className="text-[10px] uppercase tracking-wide text-gray-600">
                    <Th>Tenant</Th><Th>Amount</Th><Th>Type</Th><Th>Period</Th><Th>Due</Th><Th>Status</Th><Th>Method</Th><Th>Actions</Th> {/* NEW: Added Type column */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30">
                  {displayedPayments.map(p => {
                    const statusObj = paymentStatuses.find(s=>s.id===p.status);
                    const tenant = tenants.find(t=>t.id===p.tenant);
                    return (
                      <tr key={p.id} className="hover:bg-white/60">
                        <Td>
                          <div className="font-medium text-gray-800">{tenant ? `${tenant.user_details?.first_name||''} ${tenant.user_details?.last_name||''}`.trim() || tenant.user_details?.username : '—'}</div>
                          <div className="text-[11px] text-gray-500">{tenant?.user_details?.email || '—'}</div>
                        </Td>
                        <Td><span className="font-semibold text-gray-800 tabular-nums block text-right">{formatCurrency(p.amount)}</span></Td>
                        <Td>{p.payment_type || 'N/A'}</Td> {/* NEW: Added payment type cell */}
                        <Td>{months.find(m=>m.value===p.payment_for_month)?.name} {p.payment_for_year}</Td>
                        <Td>
                          <div className="flex flex-col"><span>{formatDate(p.due_date)}</span>{isOverdue(p.due_date, statusObj?.name||'') && <span className="text-[10px] font-semibold text-red-600">OVERDUE</span>}{p.paid_at && <span className="text-[10px] text-emerald-600">Paid {formatDate(p.paid_at)}</span>}</div>
                        </Td>
                        <Td>
                          <span className={`px-2 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 ${statusColor(statusObj?.name||'Unknown')}`}>
                            <span className="material-icons text-[14px]">{(statusObj?.name||'').toLowerCase()==='paid'?'task_alt':(statusObj?.name||'').toLowerCase()==='overdue'?'warning':(statusObj?.name||'').toLowerCase()==='pending'?'schedule':'payments'}</span>
                            {statusObj?.name || '—'}
                          </span>
                        </Td>
                        <Td><span className="text-[11px] text-gray-700">{p.payment_method || '—'}</span></Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <button onClick={()=>{ setSelectedPayment(p); setUpdateForm({ tenant: p.tenant, amount: p.amount, payment_for_year: p.payment_for_year, due_date: p.due_date, status_id: p.status, months_paid: [p.payment_for_month], payment_method: p.payment_method || '', reference_number: p.reference_number || '', notes: p.notes || '', payment_type: p.payment_type || '' }); setShowUpdateForm(true); }} className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 text-[11px] font-medium hover:bg-blue-600/20 flex items-center gap-1"> 
                              <span className="material-icons text-[14px]">edit</span>Edit
                            </button>
                            <button disabled={deleting} onClick={()=>handleDelete(p)} className="px-3 py-1.5 rounded-lg bg-red-600/10 text-red-600 text-[11px] font-medium hover:bg-red-600/20 flex items-center gap-1 disabled:opacity-40">
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

      {/* Create Payment Modal - UPDATED for mobile full screen */}
      {showPaymentForm && (
        <Modal onClose={()=>setShowPaymentForm(false)} title="Create Payment" icon="add_card">
          <form onSubmit={handleCreatePayment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Tenant *" value={paymentForm.tenant||''} required onChange={v=>setPaymentForm(f=>({...f,tenant:Number(v)}))} options={[{value:'', label:'Select Tenant'}, ...tenants.map(t=>({ value: t.id, label: `${t.user_details?.first_name||''} ${t.user_details?.last_name||''}`.trim() || t.user_details?.username }))]} />
              <Input label="Amount (UGX) *" type="number" value={paymentForm.amount||''} required onChange={v=>setPaymentForm(f=>({...f,amount:Number(v)}))} placeholder="500000" />
              {/* <Select label="Month *" value={paymentForm.payment_for_month} required onChange={v=>setPaymentForm(f=>({...f,payment_for_month:Number(v)}))} options={months.map(m=>({ value:m.value, label:m.name }))} /> */}
              <Select label="Year *" value={paymentForm.payment_for_year} required onChange={v=>setPaymentForm(f=>({...f,payment_for_year:Number(v)}))} options={[paymentForm.payment_for_year, paymentForm.payment_for_year+1, paymentForm.payment_for_year-1].map(y=>({ value:y, label:String(y) }))} />
              <Input label="Due Date *" type="date" value={paymentForm.due_date} required onChange={v=>setPaymentForm(f=>({...f,due_date:v}))} />
              <Select label="Status *" value={paymentForm.status} required onChange={v=>setPaymentForm(f=>({...f,status:Number(v)}))} options={paymentStatuses.map(s=>({ value:s.id, label:s.name }))} />
              <Select label="Method" value={paymentForm.payment_method||''} onChange={v=>setPaymentForm(f=>({...f,payment_method:v}))} options={[{value:'',label:'Select'}, ...paymentMethods.map(m=>({ value:m, label:m }))]} />
              <Input label="Reference" value={paymentForm.reference_number||''} onChange={v=>setPaymentForm(f=>({...f,reference_number:v}))} placeholder="TXN123..." />
              <Select label="Payment Type" value={paymentForm.payment_type} onChange={v=>setPaymentForm(f=>({...f,payment_type:v}))} options={[{value:'', label:'Select Type'}, ...paymentTypes.map(t=>({ value:t, label:t }))]} /> {/* NEW: Added payment type select */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Months Paid For</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-[11px]">
                  {months.map(m=> (
                    <button type="button" key={m.value} onClick={()=>toggleCreateMonth(m.value)} className={`px-2 py-1 rounded-lg border transition ${paymentForm.months_paid?.includes(m.value)?'bg-blue-600 text-white border-blue-600':'bg-white/50 border-white/30 hover:bg-white/70'}`}>{m.name.slice(0,3)}</button>
                  ))}
                </div>
              </div>
              <Textarea className="md:col-span-2" label="Notes" value={paymentForm.notes||''} onChange={v=>setPaymentForm(f=>({...f,notes:v}))} placeholder="January rent" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" icon="close" onClick={()=>setShowPaymentForm(false)}>Cancel</Button>
              <Button type="submit" loading={creating} icon="save">Create</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Payment Modal - UPDATED for mobile full screen */}
      {showUpdateForm && selectedPayment && (
        <Modal onClose={()=>setShowUpdateForm(false)} title="Update Payments" icon="edit">
          <div className="mb-4 p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1 flex items-center gap-2"><span className="material-icons text-blue-600 text-base">person</span>Tenant #{selectedPayment.tenant}</p>
            <p className="text-[11px] text-gray-500">Period: {months.find(m=>m.value===selectedPayment.payment_for_month)?.name} {selectedPayment.payment_for_year}</p>
          </div>
          <form onSubmit={handleUpdatePayment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Tenant *" value={updateForm.tenant||''} required onChange={v=>setUpdateForm(f=>({...f,tenant:Number(v)}))} options={[{value:'', label:'Select Tenant'}, ...tenants.map(t=>({ value: t.id, label: `${t.user_details?.first_name||''} ${t.user_details?.last_name||''}`.trim() || t.user_details?.username }))]} />
              <Input label="Amount (UGX) *" type="number" value={updateForm.amount||''} required onChange={v=>setUpdateForm(f=>({...f,amount:Number(v)}))} placeholder="500000" />
              <Select label="Year *" value={updateForm.payment_for_year} required onChange={v=>setUpdateForm(f=>({...f,payment_for_year:Number(v)}))} options={[updateForm.payment_for_year, updateForm.payment_for_year+1, updateForm.payment_for_year-1].map(y=>({ value:y, label:String(y) }))} />
              <Input label="Due Date *" type="date" value={updateForm.due_date} required onChange={v=>setUpdateForm(f=>({...f,due_date:v}))} />
              <Select label="Status *" value={updateForm.status_id||''} required onChange={v=>setUpdateForm(f=>({...f,status_id:Number(v)}))} options={paymentStatuses.map(s=>({ value:s.id, label:s.name }))} />
              <Select label="Method" value={updateForm.payment_method} onChange={v=>setUpdateForm(f=>({...f,payment_method:v}))} options={[{value:'',label:'Select'}, ...paymentMethods.map(m=>({ value:m, label:m }))]} />
              <Input label="Reference" value={updateForm.reference_number} onChange={v=>setUpdateForm(f=>({...f,reference_number:v}))} placeholder="TXN123..." />
              <Select label="Payment Type" value={updateForm.payment_type} onChange={v=>setUpdateForm(f=>({...f,payment_type:v}))} options={[{value:'', label:'Select Type'}, ...paymentTypes.map(t=>({ value:t, label:t }))]} /> {/* NEW: Added payment type select */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Months Paid For</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-[11px]">
                  {months.map(m=> (
                    <button type="button" key={m.value} onClick={()=>toggleMonth(m.value)} className={`px-2 py-1 rounded-lg border transition ${updateForm.months_paid.includes(m.value)?'bg-blue-600 text-white border-blue-600':'bg-white/50 border-white/30 hover:bg-white/70'}`}>{m.name.slice(0,3)}</button>
                  ))}
                </div>
              </div>
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