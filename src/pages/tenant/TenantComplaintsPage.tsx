import { useState } from 'react';
import {
  useGetComplaintCategoriesQuery,
  useGetMyComplaintsQuery,
  useLogComplaintMutation,
} from '../../services/tenantApi';
import { useGetComplaintStatusesQuery } from '../../services/complaintApi';
import {
  RefreshCw, Plus, X, FileText, AlertTriangle, CheckCircle,
  Clock, MessageSquare, Circle, Loader2, BarChart3, Inbox, Tag
} from 'lucide-react';

// Added / updated interfaces to match API shape
interface ComplaintCategory {
  id: number|string;
  name: string;
  description?: string;
}
interface ComplaintStatus { id?: number|string; name: string }
interface ComplaintApartment {
  number?: string;
  block?: string;
  estate?: string;
}
interface Complaint {
  id: number|string;
  title: string;
  description: string;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  feedback?: string;
  attachment?: string | null;
  created_at: string;
  updated_at: string;
  apartment?: ComplaintApartment;
  tenant_name?: string;
  days_since_created?: number;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  has_feedback?: boolean;
  is_resolved?: boolean;
  can_be_updated?: boolean;
}
const safeDate = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export default function TenantComplaintsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    attachment: null as File | null
  });
  // ADDED: status filter
  const [statusFilter, setStatusFilter] = useState<string>('');

  // API hooks
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useGetComplaintCategoriesQuery();
  const { data: complaints = [], isLoading: complaintsLoading, refetch: refetchComplaints } = useGetMyComplaintsQuery();
  const { data: statuses = [], isLoading: statusesLoading, refetch: refetchStatuses } = useGetComplaintStatusesQuery(); // ADDED
  const [logComplaint, { isLoading: submitting }] = useLogComplaintMutation();

  // UPDATED: dynamic status color using statuses list fallback
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase().trim();
    if (!s) return 'bg-gray-100 text-gray-800';
    // Prefer matching canonical statuses if API returns hex/color fields in future (placeholder)
    switch (s) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // NEW: urgency color + icon map
  const urgencyStyle = (u?: string) => {
    switch ((u||'').toLowerCase()) {
      case 'high': return 'bg-rose-100 text-rose-600';
      case 'critical': return 'bg-rose-600 text-white';
      case 'medium': return 'bg-amber-100 text-amber-600';
      case 'low': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // UPDATED: refresh to include statuses
  const handleRefresh = () => {
    refetchCategories();
    refetchComplaints();
    refetchStatuses(); // ADDED
  };

  // NEW: normalize complaints response (array or wrapped object)
  const complaintsArray = Array.isArray(complaints)
    ? complaints
    : (() => {
        if (complaints && typeof complaints === 'object') {
          const possible =
            (complaints as any).results ||
            (complaints as any).complaints ||
            (complaints as any).data ||
            (complaints as any).items;
          if (Array.isArray(possible)) return possible;
        }
        return [];
      })();

  // UPDATED: filtered complaints
  const visibleComplaints = complaintsArray.filter(c =>
    !statusFilter || (c.status?.name || '').toLowerCase() === statusFilter.toLowerCase()
  );

  // UPDATED: summary counts
  const totalOpen = complaintsArray.filter(c => (c.status?.name || '').toLowerCase() === 'open').length;
  const totalInProgress = complaintsArray.filter(c => (c.status?.name || '').toLowerCase() === 'in progress').length;
  const totalResolved = complaintsArray.filter(c => (c.status?.name || '').toLowerCase() === 'resolved').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('category', formData.category);
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    if (formData.attachment) {
      submitData.append('attachment', formData.attachment);
    }

    try {
      const result = await logComplaint(submitData).unwrap();
      // UPDATED: unified feedback handling (optional toast hook could be used later)
      alert(result.message || 'Complaint submitted successfully!');
      setShowForm(false);
      setFormData({ category: '', title: '', description: '', attachment: null });
      refetchComplaints();              // ADDED ensure list refresh
      setStatusFilter('');              // ADDED reset filter so new item visible
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      alert(error?.data?.error || 'Failed to submit complaint');
    }
  };

  const getPriorityIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'amenities': return <RefreshCw className="w-5 h-5" />;
      case 'maintenance': return <Plus className="w-5 h-5" />;
      case 'security': return <X className="w-5 h-5" />;
      case 'noise': return <FileText className="w-5 h-5" />;
      case 'cleanliness': return <AlertTriangle className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  // ADDED: dynamic statuses loaded indicator
  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1200px] mx-auto pb-24" style={{ marginTop :'80px'}}>
      {/* Header - made responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-rose-600" />
            Complaints & Issues
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Report apartment issues and track resolution progress
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {/* Report Issue button */}
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-medium shadow hover:shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Complaint
          </button>
        </div>
      </div>

      {/* Summary Cards - responsive adjustments & icon replacements */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Complaints</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{complaintsArray.length}</p>
            </div>
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Open Issues</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {totalOpen}
              </p>
            </div>
            <Circle className="w-6 h-6 text-blue-500 fill-blue-200/40" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                {totalInProgress}
              </p>
            </div>
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {totalResolved}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Statuses</p>
              <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                {statusesLoading ? '…' : statuses.length}
              </p>
            </div>
            <BarChart3 className="w-6 h-6 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Status Filter - responsive */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Filter Status</label>
            <select
              value={statusFilter}
              onChange={e=>setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All</option>
              {statuses.map(s=> (
                <option key={s.id} value={(s as any).name}>{(s as any).name}</option>
              ))}
            </select>
        </div>
        <div className="text-xs text-gray-500">
          {statusesLoading
            ? 'Loading statuses...'
            : statusFilter
              ? `${visibleComplaints.length} shown`
              : `${complaintsArray.length} total`}
        </div>
      </div>

      {/* Complaint Form Modal (unchanged except for loader icon) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={()=> !submitting && setShowForm(false)}
          />
          <div className="relative w-full sm:w-auto h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto backdrop-blur-xl bg-white/90 sm:bg-white/80 rounded-none sm:rounded-3xl shadow-2xl border border-white/30 p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                Report Issue
              </h2>
              <button
                onClick={()=> !submitting && setShowForm(false)}
                className="p-2 rounded-lg hover:bg-white/60 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Category *</label>
                <select
                  value={formData.category}
                  onChange={e=>setFormData(f=>({...f, category:e.target.value}))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select</option>
                  {categories.map((cat: any)=> (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Title *</label>
                <input
                  value={formData.title}
                  onChange={e=>setFormData(f=>({...f, title:e.target.value}))}
                  required
                  placeholder="Short summary (e.g. Broken bathroom tap)"
                  className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={e=>setFormData(f=>({...f, description:e.target.value}))}
                  required
                  rows={4}
                  placeholder="Provide location, severity, when it started, and any other details…"
                  className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Attachment (optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e=>setFormData(f=>({...f, attachment:e.target.files?.[0]||null}))}
                  className="w-full text-xs"
                />
                <p className="text-[10px] text-gray-500 mt-1">Add a photo or document to help resolution.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={()=>setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm hover:bg-white/90 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-medium shadow hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
            <p className="mt-4 text-[10px] text-gray-500">
              After submission you can track progress in this list.
            </p>
          </div>
        </div>
      )}

      {/* Complaints List - updated empty/loading states icons and mobile spacing */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-rose-600" />
            My Complaints
          </h3>
          <span className="text-xs text-gray-500">
            {complaintsLoading ? 'Loading...' : `${complaintsArray.length} total`}
          </span>
        </div>
        <div className="p-4 sm:p-6">
          {complaintsLoading ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-sm">Loading complaints...</span>
            </div>
          ) : visibleComplaints.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-4">
              <FileText className="w-10 h-10 text-gray-400" />
              <div>
                <h3 className="text-base font-medium mb-1">
                  {statusFilter ? 'No complaints in this status' : 'No complaints found'}
                </h3>
                <p className="text-xs sm:text-sm mb-4">
                  {statusFilter ? 'Try another status or clear filter.' : 'Log your first issue to begin tracking.'}
                </p>
                {!statusFilter && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:shadow"
                  >
                    Log Complaint
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleComplaints.map((complaint: any) => (
                <div
                  key={complaint.id}
                  className="complaint-card border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getPriorityIcon(complaint.category?.name)}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-semibold text-gray-900">{complaint.title}</h4>
                        <div className="flex flex-wrap gap-2 items-center">
                          {complaint.category?.name && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-medium">
                              {complaint.category.name}
                            </span>
                          )}
                          {complaint.apartment && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium">
                              {[
                                complaint.apartment.number,
                                complaint.apartment.block,
                                complaint.apartment.estate
                              ].filter(Boolean).join(' • ')}
                            </span>
                          )}
                          {complaint.urgency && (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${urgencyStyle(complaint.urgency)}`}>
                              {complaint.urgency.toUpperCase()}
                            </span>
                          )}
                          {complaint.days_since_created !== undefined && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
                              {complaint.days_since_created}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(complaint.status?.name)}`}>
                      {complaint.status?.name || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-line">
                    {complaint.description}
                  </p>
                  {complaint.has_feedback && complaint.feedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Property Manager Response
                      </h5>
                      <p className="text-blue-800 text-sm leading-relaxed">{complaint.feedback}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-[12px] text-gray-500 mb-3">
                    <span>Submitted: {safeDate(complaint.created_at)}</span>
                    {complaint.updated_at !== complaint.created_at && (
                      <span>Updated: {safeDate(complaint.updated_at)}</span>
                    )}
                    {complaint.tenant_name && (
                      <span className="text-gray-600">By: {complaint.tenant_name}</span>
                    )}
                  </div>
                  {complaint.attachment && (
                    <div className="border-t border-gray-200 pt-3">
                      <a
                        href={complaint.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Attachment</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Guide - icons updated */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-indigo-600" />
          Issue Categories Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesLoading ? (
            <div className="col-span-full text-center text-gray-500 text-sm">Loading categories...</div>
          ) : categories.map((category: ComplaintCategory) => (
            <div key={category.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xl">{getPriorityIcon(category.name)}</div>
              <div>
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                <p className="text-xs text-gray-600">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB for mobile */}
      {!showForm && (
        <button
          onClick={()=>setShowForm(true)}
          className="sm:hidden fixed bottom-5 right-5 p-4 rounded-full shadow-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-center"
          aria-label="Log Complaint"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}