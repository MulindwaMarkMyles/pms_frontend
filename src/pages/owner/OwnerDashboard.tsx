import React, { useState, useEffect, useMemo } from 'react';
import {
  useGetOccupancyStatusQuery,
  useGetPaymentDashboardSummaryQuery,
  useGetEstatePaymentStatusQuery,
  useGetComplaintAnalyticsQuery,
  useGetTenancyExpiryDashboardQuery,
  useGetPaymentAlertsQuery,
} from '../../services/ownerApi';
import OwnerSidebar from '../../components/owner/OwnerSidebar';
import ReportsPage from './ReportsPage';
import { Building, Users, DollarSign, AlertTriangle, Calendar } from 'lucide-react';


export default function OwnerDashboard() {
  const [activePage, setActivePage] = useState<'dashboard' | 'reports'>('dashboard');
  const [estateFilter, setEstateFilter] = useState<string>('');

  // API data
  const { data: occupancyData, isLoading: occupancyLoading, refetch: refetchOccupancy } = useGetOccupancyStatusQuery(estateFilter ? { estate_id: estateFilter } : undefined as any);
  const estatesCount = occupancyLoading ? 0 : (
    (occupancyData?.total_estates && occupancyData.total_estates > 0)
      ? occupancyData.total_estates
      : (occupancyData?.estates?.length || 0)
  );
  const { data: paymentSummary, isLoading: paymentLoading, refetch: refetchPayments } = useGetPaymentDashboardSummaryQuery();
  const { data: estatePaymentStatus = [], refetch: refetchEstatePayments } = useGetEstatePaymentStatusQuery();
  const { data: complaintAnalytics, isLoading: complaintLoading, refetch: refetchComplaints } = useGetComplaintAnalyticsQuery();
  const { data: tenancyExpiry, isLoading: tenancyLoading, refetch: refetchTenancy } = useGetTenancyExpiryDashboardQuery();
  const { data: paymentAlerts, refetch: refetchAlerts } = useGetPaymentAlertsQuery();

  // Auto refresh every 5 min
  useEffect(() => {
    const interval = setInterval(() => {
      refetchOccupancy(); refetchPayments(); refetchEstatePayments(); refetchComplaints(); refetchTenancy(); refetchAlerts();
    }, 300000);
    return () => clearInterval(interval);
  }, [refetchOccupancy, refetchPayments, refetchEstatePayments, refetchComplaints, refetchTenancy, refetchAlerts]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount||0);
  const now = useMemo(()=> new Date().toLocaleTimeString(), []);

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

  function Th({ children }:{children:React.ReactNode}) {
    return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
  }
  function Td({ children }:{children:React.ReactNode}) {
    return <td className="px-4 py-3 align-top">{children}</td>;
  }

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
  

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('email');
    window.location.href = '/login';
  };

  const refreshAll = () => { refetchOccupancy(); refetchPayments(); refetchEstatePayments(); refetchComplaints(); refetchTenancy(); refetchAlerts(); };

  const renderPage = () =>
    activePage === 'reports'
      ? <ReportsPage />
      : (
        <div className="space-y-10">
          {/* Top Cluster */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute -top-14 -right-14 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl" />
            <div className="relative flex flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600  shadow-xl" style={{ borderRadius: '7px' }}>
                  <img src="/logo.png" alt="Edith Estates Logo" className="w-24 h-12 "  style={{ borderRadius: '7px' }} />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">Owner Portfolio</h1>
                  <p className="text-gray-600 text-sm mt-1">High level snapshot across estates</p>
                </div>
              </div>
              <div className="flex gap-3">
                <select value={estateFilter} onChange={e=>setEstateFilter(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/60 border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
                  <option value="">All Estates</option>
                  {occupancyData?.estates?.map((es:any)=> <option key={es.estate_id} value={es.estate_id}>{es.estate_name}</option>)}
                </select>
                <button onClick={refreshAll} className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium text-blue-700"><span className="material-icons text-base">refresh</span>Refresh</button>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-5 gap-4">
              <MetricCard label="ESTATES" icon={<Building className="w-5 h-5 text-blue-600" />} color="from-blue-500 to-blue-600" value={occupancyLoading? '…' : estatesCount} desc="Managed" />
              <MetricCard label="OCCUPANCY" icon={<Users className="w-5 h-5 text-indigo-600" />} color="from-indigo-500 to-indigo-600" value={occupancyLoading? '…' : `${Number(occupancyData?.occupancy_rate || 0).toFixed(2)}%`} desc={`${occupancyData?.occupied_apartments||0}/${occupancyData?.total_apartments||0}`} />
              <MetricCard label="MONTH REVENUE" icon={<DollarSign className="w-5 h-5 text-emerald-600" />} color="from-emerald-500 to-emerald-600" 
                value={paymentLoading ? '…' : formatCurrency(paymentSummary?.monthly_revenue || 0)} 
                desc={`${Number(paymentSummary?.payment_rate || 0).toFixed(1)}% rate`} 
              />
              <MetricCard label="OPEN COMPLAINTS" icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} color="from-amber-500 to-amber-600" 
                value={complaintLoading ? '…' : (complaintAnalytics?.open_complaints || 0)} 
                desc={`${complaintAnalytics?.resolved_complaints || 0} resolved`} 
              />
              <MetricCard label="EXPIRING" icon={<Calendar className="w-5 h-5 text-rose-600" />} color="from-rose-500 to-rose-600" value={tenancyLoading? '…' : (tenancyExpiry?.expiring_this_month || 0)} desc={`${Number((tenancyExpiry?.renewal_rate || 0)).toFixed(2)}% renewal`} />
            </div>
          </div>

          {/* Secondary Layout */}
          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-8 space-y-8">
              {/* Occupancy Section */}
              <SectionCard title="Occupancy Overview" icon="insights" actions={
                <div className="flex items-center gap-2 text-[11px] text-gray-500"><span className="material-icons text-[14px]">update</span>{now}</div>
              }>
                {occupancyLoading ? <LoadingPlaceholder /> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      <StatPill label="Total Apts" value={occupancyData?.total_apartments||0} />
                      <StatPill label="Occupied" value={occupancyData?.occupied_apartments||0} accent="text-emerald-600" />
                      <StatPill label="Vacant" value={occupancyData?.vacant_apartments||0} accent="text-rose-600" />
                      <StatPill label="Rate" value={`${occupancyData?.occupancy_rate||0}%`} />
                    </div>
                    <div className="space-y-4">
                      {occupancyData?.estates?.slice(0, estateFilter? 1 : 5).map((es:any)=> (
                        <div key={es.estate_id} className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><span className="material-icons text-[16px] text-blue-600">villa</span>{es.estate_name}</h4>
                            <span className="text-[11px] font-medium text-gray-500">{es.occupancy_rate}%</span>
                          </div>
                          <Progress value={es.occupancy_rate} color="from-blue-500 to-indigo-600" />
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-gray-500 font-medium">
                            <div className="flex items-center gap-1"><span className="material-icons text-[14px] text-emerald-500">check_circle</span>{es.occupied_apartments}</div>
                            <div className="flex items-center gap-1"><span className="material-icons text-[14px] text-rose-500">highlight_off</span>{es.vacant_apartments}</div>
                            <div className="flex items-center gap-1"><span className="material-icons text-[14px] text-gray-400">apps</span>{es.total_apartments}</div>
                          </div>
                          {es.blocks?.length>0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {es.blocks.slice(0,6).map((b:any)=>(
                                <div key={b.block_id} className="p-2 rounded-xl bg-white/70 border border-white/40 text-[10px] flex flex-col gap-1">
                                  <div className="font-medium text-gray-700 truncate">{b.block_name}</div>
                                  <Progress value={b.occupancy_rate} small />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {!occupancyData?.estates?.length && <div className="text-xs text-gray-500">No estate occupancy data.</div>}
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Estate Performance Table */}
              <SectionCard title="Estate Performance" icon="table_view" actions={<span className="text-[11px] text-gray-500">{estatePaymentStatus.length} estates</span>}>
                {estatePaymentStatus.length===0 ? <EmptyLine label="No estate data" /> : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-[11px] uppercase tracking-wide text-gray-500 bg-white/50">
                        <tr>
                          <Th>Estate</Th><Th>Occupancy</Th><Th>Collection</Th><Th>Expected</Th><Th>Collected</Th><Th>Overdue</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/30">
                        {estatePaymentStatus.map((es:any)=> (
                          <tr key={es.estate_id} className="hover:bg-white/60">
                            <Td>
                              <div className="font-semibold text-gray-800">{es.estate_name}</div>
                              <div className="text-[11px] text-gray-500">{es.occupied_apartments}/{es.total_apartments} units</div>
                            </Td>
                            <Td><Progress value={(es.occupied_apartments / es.total_apartments)*100} small /></Td>
                            <Td><Progress value={es.collection_rate} color="from-emerald-500 to-emerald-600" small /></Td>
                            <Td>{formatCurrency(es.total_rent_expected)}</Td>
                            <Td className="text-emerald-600 font-medium">{formatCurrency(es.rent_collected)}</Td>
                            <Td>
                              <span className={`px-2 py-1 rounded-md text-[11px] font-medium ${es.overdue_count>0? 'bg-rose-100 text-rose-600':'bg-emerald-100 text-emerald-600'}`}>{es.overdue_count} overdue</span>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              {/* Complaint & Payment Distribution */}
              <SectionCard title="Operational Snapshot" icon="stacked_bar_chart">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <MiniStat label="Paid" value={paymentSummary?.paid_payments || 0} icon="task_alt" color="text-emerald-600" />
                  <MiniStat label="Pending" value={paymentSummary?.pending_payments || 0} icon="schedule" color="text-amber-600" />
                  <MiniStat label="Overdue" value={paymentSummary?.overdue_payments || 0} icon="warning" color="text-rose-600" />
                  <MiniStat label="Total Complaints" value={complaintAnalytics?.total_complaints || 0} icon="support" color="text-indigo-600" />
                </div>
                <div className="h-48 flex items-center justify-center text-xs text-gray-500 rounded-2xl border border-dashed border-gray-300 bg-white/40">
                  Complaints & Payments Trend (placeholder)
                </div>
              </SectionCard>
            </div>

            <div className="col-span-4 space-y-8">
              {/* Alerts */}
              <SectionCard title="Payment Alerts" icon="notification_important" actions={<span className="text-[10px] text-gray-500">Auto-refresh 5m</span>}>
                {!paymentAlerts ? <LoadingPlaceholder /> : (
                  <div className="space-y-5">
                    <AlertList title="Overdue" color="rose" icon="error" items={(paymentAlerts.overdue_alerts||[]).slice(0,5)} empty="No overdue payments" render={a=>(
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{a.tenant_name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{a.apartment} • {a.estate}</p>
                          <p className="text-[10px] text-rose-600 font-medium">{a.days_overdue} days overdue</p>
                        </div>
                        <span className="text-[11px] font-semibold text-rose-600">{formatCurrency(a.amount)}</span>
                      </div>
                    )} />
                    <AlertList title="Upcoming" color="amber" icon="schedule" items={(paymentAlerts.upcoming_alerts||[]).slice(0,5)} empty="No upcoming payments" render={a=>(
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{a.tenant_name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{a.apartment} • {a.estate}</p>
                          <p className="text-[10px] text-amber-600 font-medium">Due in {a.days_until_due} days</p>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-600">{formatCurrency(a.amount)}</span>
                      </div>
                    )} />
                    <AlertList title="Recent" color="emerald" icon="done_all" items={(paymentAlerts.recent_payments||[]).slice(0,5)} empty="No recent payments" render={a=>(
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{a.tenant_name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{a.apartment} • {a.estate}</p>
                          <p className="text-[10px] text-emerald-600 font-medium">{new Date(a.paid_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600">{formatCurrency(a.amount)}</span>
                      </div>
                    )} />
                  </div>
                )}
              </SectionCard>

              {/* Tenancy Expiry */}
              <SectionCard title="Leases Expiring Soon" icon="hourglass_bottom" actions={<span className="text-[10px] text-gray-500">{tenancyExpiry?.expiring_this_month||0} this month</span>}>
                {tenancyLoading ? <LoadingPlaceholder /> : (
                  <div className="space-y-3 max-h-80 overflow-auto pr-1 custom-scroll">
                    {tenancyExpiry?.expiring_soon?.slice(0,8).map((t:any)=> (
                      <div key={t.tenant_id} className="p-3 rounded-xl bg-white/60 backdrop-blur border border-white/30 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[11px] font-bold">{(t.tenant_name||'??').split(' ').filter(Boolean).slice(0,2).map((x:string)=>x[0]).join('').toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{t.tenant_name}</p>
                          <p className="text-[10px] text-gray-500 truncate flex items-center gap-1"><span className="material-icons text-[12px] text-indigo-500">domain</span>{t.apartment} • {t.estate}</p>
                          <p className="text-[10px] text-rose-600 font-medium mt-0.5">Ends {new Date(t.lease_end).toLocaleDateString()} ({t.days_until_expiry}d)</p>
                        </div>
                      </div>
                    ))}
                    {!tenancyExpiry?.expiring_soon?.length && <EmptyLine label="No expiring leases soon" />}
                  </div>
                )}
              </SectionCard>

              {/* Complaint Status */}
              <SectionCard title="Complaint Status" icon="support_agent" actions={<span className="text-[10px] text-gray-500">Avg {complaintAnalytics?.avg_resolution_time||0} days</span>}>
                {complaintLoading ? <LoadingPlaceholder /> : (
                  <div className="space-y-3 text-[12px]">
                    <BarRow label="Open" value={complaintAnalytics?.open_complaints||0} color="from-rose-500 to-rose-600" total={complaintAnalytics?.total_complaints||0} />
                    <BarRow label="In Progress" value={complaintAnalytics?.in_progress_complaints||0} color="from-amber-500 to-amber-600" total={complaintAnalytics?.total_complaints||0} />
                    <BarRow label="Resolved" value={complaintAnalytics?.resolved_complaints||0} color="from-emerald-500 to-emerald-600" total={complaintAnalytics?.total_complaints||0} />
                    <BarRow label="Closed" value={complaintAnalytics?.closed_complaints||0} color="from-gray-500 to-gray-600" total={complaintAnalytics?.total_complaints||0} />
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      );

  return (
    <div className="flex min-h-screen " style={{ paddingTop: '5rem' }}>
      <OwnerSidebar
        active={activePage}
        onChange={(p)=>setActivePage(p)}
      />
      <div className="flex-1 flex flex-col">
        <main className="px-6 lg:px-10 py-10 max-w-[1400px] mx-auto w-full">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

/* ===== Reusable Building Blocks ===== */
function MetricCard({ label, icon, value, desc, color }:{label:string;icon:string;value:any;desc:string;color:string}) {
  return (
    <div className="relative p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 flex flex-col gap-1 shadow overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
      <div className="flex items-center gap-2 text-[10px] font-medium tracking-wide text-gray-500"><span className="material-icons text-[16px] text-gray-600">{icon}</span>{label}</div>
      <div className="text-lg md:text-xl font-bold text-gray-900 leading-tight truncate">{value}</div>
      <div className="text-[10px] text-gray-500 truncate">{desc}</div>
    </div>
  );
}
function SectionCard({ title, icon, children, actions }:{title:string;icon:string;children:React.ReactNode;actions?:React.ReactNode}) {
  return (
    <div className="backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm"><span className="material-icons text-base text-blue-600">{icon}</span>{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}
function Progress({ value, color='from-blue-500 to-indigo-600', small=false }:{value:number; color?:string; small?:boolean}) {
  return (
    <div className={`w-full ${small? 'h-1.5':'h-2.5'} rounded-full bg-gray-200 overflow-hidden`}>
      <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: Math.min(100, Math.max(0, value)) + '%' }} />
    </div>
  );
}
function StatPill({ label, value, accent }:{label:string; value:any; accent?:string}) {
  return (
    <div className="p-3 rounded-2xl bg-white/60 backdrop-blur border border-white/30 flex flex-col gap-1 text-[11px]">
      <span className="text-gray-500 font-medium tracking-wide">{label}</span>
      <span className={`text-sm font-bold text-gray-800 ${accent||''}`}>{value}</span>
    </div>
  );
}
function MiniStat({ label, value, icon, color }:{label:string; value:any; icon:string; color:string}) {
  return (
    <div className="p-3 rounded-2xl bg-white/60 backdrop-blur border border-white/30 flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500"><span className={`material-icons text-[14px] ${color}`}>{icon}</span>{label}</div>
      <div className="text-sm font-bold text-gray-800">{value}</div>
    </div>
  );
}

/* ADDED: Missing helper components referenced in renderPage */

function EmptyLine({ label }:{ label:string }) {
  return <div className="text-xs text-gray-500 text-center py-6">{label}</div>;
}

interface AlertListProps<T> {
  title: string;
  color: 'rose' | 'amber' | 'emerald';
  icon: string;
  items: T[];
  empty: string;
  render: (item: T) => React.ReactNode;
}
function AlertList<T>({ title, color, icon, items, empty, render }: AlertListProps<T>) {
  const colorMap: Record<string,string> = {
    rose: 'from-rose-500 to-rose-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600'
  };
  return (
    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className={`material-icons text-[18px] bg-gradient-to-br ${colorMap[color]} text-white p-1.5 rounded-lg`}>
            {icon}
          </span>
          {title}
        </h4>
        <span className="text-[10px] text-gray-500 font-medium">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <EmptyLine label={empty} />
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/70 border border-white/40">
              {render(it)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BarRow({ label, value, total, color }:{label:string; value:number; total:number; color:string}) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-medium text-gray-600">
        <span>{label}</span>
        <span className="text-gray-700">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
