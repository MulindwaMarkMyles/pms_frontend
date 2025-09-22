import React, { useState } from 'react';
import { useManagerGuard } from '../../hooks/useFlexibleAuth';
import PaymentsPage from './PaymentsPage';
import EstatesPage from './EstatesPage';
import TenantsPage from './TenantsPage';
import ComplaintsPage from './ComplaintsPage';
import ManagerSidebar from '../../components/manager/ManagerSidebar';
import type { DashboardPage } from '../../components/manager/ManagerSidebar';
import { useManagerDashboardData } from '../../hooks/useManagerDashboardData';
import Beams from '../../components/background';
import { AlertTriangle, User, DollarSign, Wrench } from 'lucide-react'; // Add Lucide icon imports for replacements
import SecurityDepositsPageManager from './SecurityDepositsPage';

export default function ManagerDashboard() {
	const { isAuthenticated, isLoading } = useManagerGuard();
	const dashboard = useManagerDashboardData();
	const [activePage, setActivePage] = useState<DashboardPage>('dashboard');

	// Show loading if authentication is being checked
	if (isLoading || !isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
					<p className="text-gray-600 text-lg">Loading Edith Estates...</p>
				</div>
			</div>
		);
	}

	if (activePage === 'estates') return <div className="flex"><ManagerSidebar active={activePage} onChange={setActivePage} /><div className="flex-1"><EstatesPage /></div></div>;
	if (activePage === 'tenants') return <div className="flex"><ManagerSidebar active={activePage} onChange={setActivePage} /><div className="flex-1"><TenantsPage /></div></div>;
	if (activePage === 'payments') return <div className="flex"><ManagerSidebar active={activePage} onChange={setActivePage} /><div className="flex-1"><PaymentsPage /></div></div>;
	if (activePage === 'security-deposits') return <div className="flex"><ManagerSidebar active={activePage} onChange={setActivePage} /><div className="flex-1"><SecurityDepositsPageManager /></div></div>;
	if (activePage === 'complaints') return <div className="flex"><ManagerSidebar active={activePage} onChange={setActivePage} /><div className="flex-1"><ComplaintsPage /></div></div>;

	return (

		<div className="width-auto flex relative overflow-hidden" style={{ paddingTop:'100px' }}>
			{/* Creative SVG Blobs */}
			{/* <div className="absolute top-10 left-20 w-148 h-148 opacity-20" style={{ transform: 'rotate(45deg)' }}>
				<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
					<path d="M50 10c20 0 30 20 30 40s-10 40-30 40S10 70 10 50 30 10 50 10z" fill="#3b82f6" />
				</svg>
			</div>
			<div className="absolute top-120 left-80 w-148 h-148 opacity-20" style={{ transform: 'rotate(45deg)' }}>
				<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
					<path d="M50 10c20 0 30 20 30 40s-10 40-30 40S10 70 10 50 30 10 50 10z" fill="#3b82f6" />
				</svg>
			</div>
			<div className="absolute top-40 right-32 w-156 h-156 opacity-15" style={{ transform: 'rotate(-30deg)' }}>
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
			<ManagerSidebar active={activePage} onChange={setActivePage} />

			<main className="flex-1 p-4 lg:p-6 xl:p-12 space-y-6 xl:space-y-8 mx-auto w-full max-w-7xl relative z-10">
				{/* Top Cluster */}
				<TopCluster dashboard={dashboard} />
				{/* Secondary Grid */}
				<div className="grid grid-cols-12 gap-6 items-start">
					<div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
						<PerformanceOverview />
						<OpenComplaints />
					</div>
					<div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6">
						<SystemStatus dashboard={dashboard} />
						<PerformanceTips />
					</div>
				</div>
			</main>
		</div>
	);
}

/* ========== SECTION COMPONENTS ========== */
function TopCluster({dashboard}:{dashboard:any}) {
	return (
		<div className="relative grid grid-cols-12 gap-6">
			<div className="col-span-12 lg:col-span-7 xl:col-span-9 relative z-10">
				<div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-8 overflow-hidden" style={{ backgroundImage: 'url(/dashboard-header-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'right' }}>
					<div className="absolute -top-10 -right-10 w-52 h-52 bg-gradient-to-br from-blue-500/10 to-blue-700/10 rounded-full blur-3xl" />
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
						<div className="flex items-center gap-5">
							<div className="p-1 bg-gradient-to-r from-blue-500 to-blue-600  shadow-xl" style={{ borderRadius: '7px' }}>
								{/* <span className="material-icons text-white text-3xl">apartment</span> */}
								<img src="/logo.png" alt="Edith Estates Logo" className="w-24 h-12 " style={{ borderRadius: '7px' }} />
							</div>
							<div>
								<h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">Edith Estates</h1>
								<p className="text-gray-600 mt-1 text-sm">Professional Property Management Suite</p>
							</div>
						</div>
						<div className="flex gap-3 flex-wrap">
							<button onClick={dashboard.refresh} className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium text-blue-700">
								<span className="material-icons text-base">refresh</span>
								Refresh
							</button>
							<button className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition flex items-center gap-2 text-sm font-medium">
								<span className="material-icons text-base">add_business</span>
								New Estate
							</button>
						</div>
					</div>
					<div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
						<Metric label="ESTATES" icon="domain" color="text-blue-500" value={dashboard.estates} desc="Active portfolios" />
						<Metric label="TENANTS" icon="group" color="text-indigo-500" value={dashboard.tenants} desc="Current occupants" />
						<Metric label="OPEN CASES" icon="report" color="text-amber-500" value={dashboard.pendingComplaints} desc="Complaints pending" />
						<Metric label="REVENUE (M)" icon="paid" color="text-emerald-500" value={`USh ${dashboard.monthlyRevenue.toLocaleString()}`} desc="This month" />
					</div>
				</div>
			</div>
			<div className="col-span-12 lg:col-span-5 xl:col-span-3 space-y-6">
				<FinancialSnapshot dashboard={dashboard} />
				<QuickActivity />
			</div>
		</div>
	);
}

/* ========== REUSABLE PARTS ========== */
function Metric({label, icon, color, value, desc}:{label:string;icon:string;color:string;value:any;desc:string}) {
	return (
		<div className="p-4 rounded-2xl bg-white/50 backdrop-blur border border-white/30 shadow flex flex-col gap-1">
			<div className="flex items-center gap-2 text-xs font-medium text-gray-500"><span className={`material-icons text-[16px] ${color}`}>{icon}</span>{label}</div>
			<div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
			<div className="text-[11px] text-gray-500">{desc}</div>
		</div>
	);
}

function FinancialSnapshot({dashboard}:{dashboard:any}) {
	return (
		<div className="backdrop-blur-xl bg-gradient-to-br from-blue-600/90 to-blue-700/90 text-white rounded-3xl shadow-2xl p-6 relative overflow-hidden">
			<div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-semibold tracking-wide text-sm opacity-90 flex items-center gap-2"><span className="material-icons text-base">insights</span>Financial Snapshot</h3>
				<span className="text-[10px] bg-white/20 px-2 py-1 rounded-md">LIVE</span>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="p-4 bg-white/10 rounded-2xl flex flex-col gap-1"><span className="text-[10px] uppercase tracking-wide opacity-70">Pending</span><span className="text-xl font-bold">{dashboard.paymentsPending}</span><span className="text-[10px] opacity-60">Payments</span></div>
				<div className="p-4 bg-white/10 rounded-2xl flex flex-col gap-1"><span className="text-[10px] uppercase tracking-wide opacity-70">Overdue</span><span className="text-xl font-bold">{dashboard.paymentsOverdue}</span><span className="text-[10px] opacity-60">Payments</span></div>
				<div className="col-span-2 p-4 bg-white/10 rounded-2xl">
					<div className="flex items-center justify-between mb-2"><span className="text-[11px] uppercase tracking-wide opacity-70 flex items-center gap-1"><span className="material-icons text-xs">paid</span>Monthly Revenue</span><span className="text-[10px] opacity-60">UGX</span></div>
					<div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-2"><div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full" style={{width: Math.min(100,(dashboard.monthlyRevenue/50000)*100)+'%'}} /></div>
					<div className="text-lg font-bold tracking-tight">USh {dashboard.monthlyRevenue.toLocaleString()}</div>
				</div>
			</div>
		</div>
	);
}

const recentActivity = [
	{ type:'tenant', message:'New tenant John Doe registered for Apt 4B', time:'2 hours ago', status:'success', icon:'person_add' },
	{ type:'complaint', message:'Water leak reported in Block A, Apt 3C', time:'4 hours ago', status:'warning', icon:'water_drop' },
	{ type:'payment', message:'Rent payment received from Sarah Kim', time:'6 hours ago', status:'success', icon:'payment' },
	{ type:'maintenance', message:'HVAC maintenance completed in Block B', time:'1 day ago', status:'info', icon:'build' },
];

function QuickActivity() {
	return (
		<div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl p-6" style={{ backgroundImage: 'url(/activity-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'top left' }}>
			<h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-sm"><span className="material-icons text-base text-blue-600">history_toggle_off</span>Quick Activity</h3>
			<div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scroll">
				{recentActivity.slice(0,6).map((a,i) => (
					<div key={i} className="flex items-start gap-3 group">
						{/* Replace img with conditional Lucide icons based on activity type */}
						{a.type === 'tenant' && <User className="w-10 h-10 text-blue-500 rounded-xl" />}
						{a.type === 'complaint' && <AlertTriangle className="w-10 h-10 text-amber-500 rounded-xl" />}
						{a.type === 'payment' && <DollarSign className="w-10 h-10 text-emerald-500 rounded-xl" />}
						{a.type === 'maintenance' && <Wrench className="w-10 h-10 text-indigo-500 rounded-xl" />}
						<div className="flex-1"><p className="text-sm text-gray-800 leading-snug">{a.message}</p><p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1"><span className="material-icons text-[10px]">schedule</span>{a.time}</p></div>
						<button className="opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-white/60"><span className="material-icons text-gray-400 text-sm">more_horiz</span></button>
					</div>
				))}
			</div>
		</div>
	);
}

function PerformanceOverview() {
	const metrics = [
		{ label: 'Resolution Rate', value: '92%', icon: 'task_alt', color: 'text-emerald-600' },
		{ label: 'Avg. Occupancy', value: '87%', icon: 'inventory_2', color: 'text-blue-600' },
		{ label: 'On-time Payments', value: '78%', icon: 'schedule_send', color: 'text-indigo-600' },
		{ label: 'Retention Rate', value: '94%', icon: 'verified_user', color: 'text-amber-600' }
	];
	return (
		<div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl p-6 lg:-mt-50">
			<div className="flex items-center justify-between mb-6">
				<h3 className="font-semibold text-gray-700 flex items-center gap-2"><span className="material-icons text-blue-600 text-base">bar_chart</span>Performance Overview</h3>
				<button className="text-xs px-3 py-1 rounded-lg bg-white/60 border border-white/30 hover:bg-white/80 transition flex items-center gap-1 text-gray-600"><span className="material-icons text-[14px]">calendar_today</span>This Month</button>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				{metrics.map((m,i) => (
					<div key={i} className="p-4 rounded-2xl bg-white/50 backdrop-blur border border-white/30 flex flex-col gap-2">
						<div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><span className={`material-icons text-[16px] ${m.color}`}>{m.icon}</span>{m.label}</div>
						<div className="text-xl font-bold text-gray-900">{m.value}</div>
						<div className="h-1.5 rounded-full bg-gray-200 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{width:m.value}} /></div>
					</div>
				))}
			</div>
			<div className="h-60 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl" style={{ backgroundImage: 'url(/analytics-chart.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>Analytics Chart Placeholder</div>
		</div>
	);
}

function OpenComplaints() {
	return (
		<div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl p-6" style={{ backgroundImage: 'url(/complaints-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'bottom right', backgroundBlendMode: 'overlay' }}>
			<div className="flex items-center justify-between mb-6">
				<h3 className="font-semibold text-gray-700 flex items-center gap-2"><span className="material-icons text-blue-600 text-base">priority_high</span>Open Complaints</h3>
				<button className="text-xs px-3 py-1 rounded-lg bg-white/60 border border-white/30 hover:bg-white/80 transition flex items-center gap-1 text-gray-600"><span className="material-icons text-[14px]">open_in_full</span>View All</button>
			</div>
			<div className="space-y-4 max-h-72 overflow-y-auto pr-2">
				{recentActivity.filter(a=>a.type==='complaint').map((c,i)=>(
					<div key={i} className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/30 hover:shadow flex items-start gap-3">
						{/* Replace img with Lucide AlertTriangle icon for complaints */}
						<AlertTriangle className="w-12 h-12 text-amber-500 rounded-xl" /> {/* Icon sized to match original img; adjust color as needed */}
						<div className="flex-1">
							<p className="text-sm font-medium text-gray-800">{c.message}</p>
							<p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1"><span className="material-icons text-[10px]">schedule</span>{c.time}</p>
						</div>
						<button className="px-3 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition">Review</button>
					</div>
				))}
			</div>
		</div>
	);
}

function SystemStatus({dashboard}:{dashboard:any}) {
	return (
		<div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl p-6">
			<h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-sm"><span className="material-icons text-base text-blue-600">update</span>System Status</h3>
			<div className="grid grid-cols-2 gap-4 text-sm items-stretch w-full">
				<div className="w-full h-full">
					<StatusCard label="Last Sync" value={dashboard.lastUpdated ? new Date(dashboard.lastUpdated).toLocaleTimeString() : '—'} />
				</div>
				<div className="w-full h-full">
					<StatusCard label="API Health" value={<span className="text-emerald-600 flex items-center gap-1"><span className="material-icons text-[14px]">podcasts</span>Stable</span>} />
				</div>
				<div className="w-full h-full">
					<StatusCard label="Complaints" value={<span className="text-amber-600">{dashboard.pendingComplaints} open</span>} />
				</div>
				<div className="w-full h-full">
					<StatusCard label="Revenue" value={`USh ${dashboard.monthlyRevenue.toLocaleString()}`} />
				</div>
			</div>
		</div>
	);
}

function StatusCard({label, value}:{label:string; value:any}) {
	return (
		<div className="p-4 rounded-2xl bg-white/50 backdrop-blur border border-white/30">
			<p className="text-[11px] text-gray-500 mb-1">{label}</p>
			<p className="font-semibold text-gray-800 text-sm truncate">{value}</p>
		</div>
	);
}

function PerformanceTips() {
	return (
		<div className="backdrop-blur-xl bg-gradient-to-br from-indigo-600/90 to-blue-700/90 text-white rounded-3xl shadow-2xl p-6">
			<h3 className="font-semibold tracking-wide text-sm mb-4 flex items-center gap-2"><span className="material-icons text-base">workspace_premium</span>Performance Tips</h3>
			<ul className="space-y-3 text-sm">
				<li className="flex gap-3"><span className="material-icons text-emerald-300 text-base">task_alt</span><span>Resolve pending complaints within 24h to keep retention high.</span></li>
				<li className="flex gap-3"><span className="material-icons text-amber-300 text-base">payments</span><span>Follow up on overdue payments to improve cash flow.</span></li>
				<li className="flex gap-3"><span className="material-icons text-blue-200 text-base">insights</span><span>Track occupancy trends to plan marketing efforts.</span></li>
			</ul>
		</div>
	);
}
