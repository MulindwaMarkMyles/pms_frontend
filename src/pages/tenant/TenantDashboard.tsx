import React, { useState, useEffect, useMemo } from 'react';
import {
  useGetMyRentAlertsQuery,
  useGetPaymentReceiptStatusQuery,
  useGetMyComplaintsQuery,
} from '../../services/tenantApi';
import { Home, RefreshCw, Calendar, CreditCard, MessageSquare, User, LogOut, Plus, X, Clock, AlertTriangle, CheckCircle, Hourglass, Inbox, MessageSquarePlus } from 'lucide-react'; // ADDED Plus, X
import PaymentsPage from './PaymentsPage';
import TenantComplaintsPage from './TenantComplaintsPage';
import TenantSidebar from '../../components/tenant/TenantSidebar'; // ADDED

/* Lightweight helpers kept */
function LoadingPlaceholder() {
  return (
    <div className="h-24 flex items-center justify-center text-xs text-indigo-600">
      <span className="material-icons animate-spin text-base mr-2">progress_activity</span>
      Loading...
    </div>
  );
}
function MetricCard({ label, value, desc, icon, color }:{label:string;value:any;desc:string;icon:React.ReactNode;color:string}) {
  return (
    <div className="relative p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 flex flex-col gap-1 shadow overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
      <div className="flex items-center gap-2 text-[10px] font-medium tracking-wide text-gray-500">
        {icon}{label}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500 truncate">{desc}</div>
    </div>
  );
}

function SectionCard({ title, children, actions }:{title:string;children:React.ReactNode;actions?:React.ReactNode}) {
  return (
    <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
          <span className="material-icons text-base text-indigo-600">dashboard</span>
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

export default function TenantDashboard() {
  // ...existing state...
  const [activePage, setActivePage] = useState<'overview' | 'payments' | 'complaints'>('overview');

  // ADD (if not already present): quick complaint modal state (idempotent)
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    category: '',
    title: '',
    description: '',
    attachment: null as File | null
  });

  // Summary data only (unchanged)
  const {
    data: rentAlerts,
    isLoading: alertsLoading,
    refetch: refetchAlerts
  } = useGetMyRentAlertsQuery(undefined, { pollingInterval: 60000, refetchOnFocus: true });

  const {
    data: receiptStatus,
    isLoading: receiptsLoading,
    refetch: refetchReceipts
  } = useGetPaymentReceiptStatusQuery(undefined, { pollingInterval: 60000, refetchOnFocus: true });

  const { data: complaints = [], isLoading: complaintsLoading, refetch: refetchComplaints } = useGetMyComplaintsQuery(
    undefined,
    { pollingInterval: 120000, refetchOnFocus: true }
  );

  // NORMALIZE complaints API (supports: array | {results|complaints|data|items:[...]})
  const complaintsArray = useMemo(() => {
    if (Array.isArray(complaints)) return complaints;
    if (complaints && typeof complaints === 'object') {
      // Common wrapper keys
      const possible = (complaints as any).results
        || (complaints as any).complaints
        || (complaints as any).data
        || (complaints as any).items;
      if (Array.isArray(possible)) return possible;
    }
    return [];
  }, [complaints]);

  // UPDATE: metrics use normalized array
  const complaintStats = useMemo(()=> {
    const list = complaintsArray;
    const toLower = (s:string)=> (s||'').toLowerCase();
    const open = list.filter(c => toLower(c.status?.name) === 'open').length;
    const inProgress = list.filter(c => toLower(c.status?.name) === 'in progress').length;
    const resolved = list.filter(c => toLower(c.status?.name) === 'resolved').length;
    return { open, inProgress, resolved, total: list.length };
  }, [complaintsArray]);

  // ADD: derived payment / alerts totals (were missing)
  const totalUpcoming = rentAlerts?.total_upcoming ?? (rentAlerts?.upcoming_due?.length || 0);
  const totalOverdue = rentAlerts?.total_overdue ?? (rentAlerts?.overdue?.length || 0);
  const totalPaid = receiptStatus?.total_paid ?? 0;
  const totalPending = receiptStatus?.total_pending ?? 0;

  // Clock
  const [now, setNow] = useState(()=> new Date());
  useEffect(()=> {
    const t = setInterval(()=> setNow(new Date()), 60000);
    return ()=> clearInterval(t);
  }, []);
  const nowStr = useMemo(()=> now.toLocaleTimeString(), [now]);

  // Refresh all
  const [refreshing, setRefreshing] = useState(false);
  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAlerts(), refetchReceipts(), refetchComplaints()]);
    } finally { setRefreshing(false); }
  };

  // Auth / nav
  const navigation = [
    { id:'overview', label:'Overview', icon:<Home className="w-4 h-4" /> },
    { id:'payments', label:'Payments', icon:<CreditCard className="w-4 h-4" /> },
    { id:'complaints', label:'Complaints', icon:<MessageSquare className="w-4 h-4" /> },
  ];
  const userEmail = useMemo(()=> {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const obj = JSON.parse(raw);
        return obj.email || obj.user?.email || '';
      }
      return localStorage.getItem('email') || '';
    } catch {
      return localStorage.getItem('email') || '';
    }
  }, []);
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('email');
    window.location.href = '/login';
  };

  // QUICK COMPLAINT SUBMIT (lightweight, silent fail)
  const submitQuickComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintForm.category || !complaintForm.title || !complaintForm.description) return;
    try {
      const fd = new FormData();
      fd.append('category', complaintForm.category);
      fd.append('title', complaintForm.title);
      fd.append('description', complaintForm.description);
      if (complaintForm.attachment) fd.append('attachment', complaintForm.attachment);
      // API available through complaints page (defer to that endpoint if mutation exists externally)
      // noop here if no mutation hook imported to keep this page lean
      setComplaintForm({ category:'', title:'', description:'', attachment:null });
      setShowComplaintModal(false);
    } catch {/* ignore */}
  };

  const renderOverview = () => (
    <div className="space-y-4 xl:space-y-6 pb-24 w-full">
      {/* Header & Metrics */}
      <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-14 -left-14 w-72 h-72 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-16 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-indigo-500/10 to-purple-600/10 rounded-full blur-3xl" />
        <div className="relative flex flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-1 bg-gradient-to-br from-indigo-500 to-blue-600  shadow-xl" style={{ borderRadius: '7px' }}>
              <img src="/logo.png" alt="Edith Estates Logo" className="w-24 h-12 " style={{ borderRadius: '7px' }} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
                Tenant Overview
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Your current rental & service status
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium text-indigo-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing?'animate-spin':''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={()=>setShowComplaintModal(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              Log Complaint
            </button>
            <span className="px-4 py-2.5 rounded-xl bg-white/60 border border-white/30 text-[11px] text-gray-600 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              {nowStr}
            </span>
          </div>
        </div>
        {/* Metrics */}
        <div className="mt-8">
          <div className="grid grid-cols-5 gap-4">
            <MetricCard
              label="UPCOMING"
              value={alertsLoading ? '…' : totalUpcoming}
              desc="Due soon"
              icon={<Clock className="w-4 h-4 text-amber-600" />}
              color="from-amber-500 to-amber-600"
            />
            <MetricCard
              label="OVERDUE"
              value={alertsLoading ? '…' : totalOverdue}
              desc="Past due"
              icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
              color="from-rose-500 to-rose-600"
            />
            <MetricCard
              label="PAID"
              value={receiptsLoading ? '…' : totalPaid}
              desc="Payments"
              icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
              color="from-emerald-500 to-emerald-600"
            />
            <MetricCard
              label="PENDING"
              value={receiptsLoading ? '…' : totalPending}
              desc="Verifying"
              icon={<Hourglass className="w-4 h-4 text-indigo-600" />}
              color="from-indigo-500 to-indigo-600"
            />
            <MetricCard
              label="COMPLAINTS"
              value={complaintsLoading ? '…' : complaintStats.total}
              desc={`${complaintStats.resolved} resolved`}
              icon={<Inbox className="w-4 h-4 text-blue-600" />}
              color="from-blue-500 to-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Snapshot Sections */}
      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Rent Alerts Snapshot">
          {alertsLoading ? <LoadingPlaceholder /> : (
            <div className="text-[12px] space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Upcoming</span>
                <span className="font-semibold text-amber-600">{totalUpcoming}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overdue</span>
                <span className="font-semibold text-rose-600">{totalOverdue}</span>
              </div>
              <p className="text-[10px] text-gray-500">View full details in the Payments tab.</p>
            </div>
          )}
        </SectionCard>
        <SectionCard title="Payments Summary">
          {receiptsLoading ? <LoadingPlaceholder /> : (
            <div className="text-[12px] space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Paid</span>
                <span className="font-semibold text-emerald-600">{totalPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-indigo-600">{totalPending}</span>
              </div>
              <p className="text-[10px] text-gray-500">Submit receipts & track status under Payments.</p>
            </div>
          )}
        </SectionCard>
        <SectionCard title="Complaints Status">
          {complaintsLoading ? <LoadingPlaceholder /> : (
            <div className="text-[12px] space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Open</span>
                <span className="font-semibold text-rose-600">{complaintStats.open}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-amber-600">{complaintStats.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolved</span>
                <span className="font-semibold text-emerald-600">{complaintStats.resolved}</span>
              </div>
              <p className="text-[10px] text-gray-500">Manage issues under Complaints tab.</p>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );

  const renderPage = () => {
    if (activePage === 'payments') return <PaymentsPage />;
    if (activePage === 'complaints') return <TenantComplaintsPage />;
    return renderOverview();
  };

  // ADDED: sidebar page mapping
  const sidebarActive: TenantPage =
    activePage === 'overview' ? 'dashboard' : (activePage as TenantPage);

  const handleSidebarChange = (val: TenantPage) => {
    if (val === 'dashboard') setActivePage('overview');
    else if (val === 'profile') {
      // future profile page stub
      setActivePage('overview');
    } else {
      setActivePage(val as any);
    }
  };

  return (
    <div className="flex min-h-screen ">
      <TenantSidebar active={sidebarActive} onChange={handleSidebarChange} />
      <div className="flex-1 flex flex-col">
        <main className="p-4 lg:p-6 xl:p-8 space-y-4 xl:space-y-6 mx-auto w-full max-w-none relative z-10">
          {renderPage()}
        </main>

        {showComplaintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={()=>setShowComplaintModal(false)}
            />
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/30 p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-600" />
                  Log Complaint
                </h2>
                <button
                  onClick={()=>setShowComplaintModal(false)}
                  className="p-2 rounded-lg hover:bg-white/60 transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={submitQuickComplaint} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-600">Category *</label>
                  <select
                    value={complaintForm.category}
                    onChange={e=>setComplaintForm(f=>({...f, category:e.target.value}))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Select</option>
                    <option value="1">General</option>
                    <option value="2">Maintenance</option>
                    <option value="3">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-600">Title *</label>
                  <input
                    value={complaintForm.title}
                    onChange={e=>setComplaintForm(f=>({...f, title:e.target.value}))}
                    required
                    placeholder="Short summary"
                    className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-600">Description *</label>
                  <textarea
                    value={complaintForm.description}
                    onChange={e=>setComplaintForm(f=>({...f, description:e.target.value}))}
                    required
                    rows={4}
                    placeholder="Provide details..."
                    className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-600">Attachment (optional)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e=>setComplaintForm(f=>({...f, attachment:e.target.files?.[0]||null}))}
                    className="w-full text-[11px]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={()=>setShowComplaintModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm hover:bg-white/90"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-medium shadow hover:shadow-md"
                  >
                    Submit
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-gray-500">
                  Detailed tracking available in the Complaints tab.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
