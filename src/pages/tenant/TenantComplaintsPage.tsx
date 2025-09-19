import { useState } from 'react';
import {
  useGetComplaintCategoriesQuery,
  useGetMyComplaintsQuery,
  useLogComplaintMutation,
  useUpdateComplaintMutation, // We'll need to add this to tenantApi.ts
} from '../../services/tenantApi';
import { useGetComplaintStatusesQuery } from '../../services/complaintApi';
import {
  RefreshCw, Plus, X, FileText, AlertTriangle, CheckCircle,
  Clock, MessageSquare, Circle, Loader2, BarChart3, Inbox, Tag, Edit
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [editForm, setEditForm] = useState({ // UPDATED: Added urgency and status
    category: '',
    title: '',
    description: '',
    attachment: null as File | null,
    urgency: '',
    status: ''
  });
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    attachment: null as File | null
  });
  const [statusFilter, setStatusFilter] = useState<string>('');

  // API hooks
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useGetComplaintCategoriesQuery();
  const { data: complaints = [], isLoading: complaintsLoading, refetch: refetchComplaints } = useGetMyComplaintsQuery();
  const { data: statuses = [], isLoading: statusesLoading, refetch: refetchStatuses } = useGetComplaintStatusesQuery();
  const [logComplaint, { isLoading: submitting }] = useLogComplaintMutation();
  const [updateComplaint, { isLoading: updating }] = useUpdateComplaintMutation();

  // Status and urgency styling helpers
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase().trim();
    if (!s) return 'bg-gray-100 text-gray-800';
    
    switch (s) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const urgencyStyle = (u?: string) => {
    switch ((u||'').toLowerCase()) {
      case 'high': return 'bg-rose-100 text-rose-600';
      case 'critical': return 'bg-rose-600 text-white';
      case 'medium': return 'bg-amber-100 text-amber-600';
      case 'low': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Handle refresh of all data
  const handleRefresh = () => {
    refetchCategories();
    refetchComplaints();
    refetchStatuses();
  };

  // Normalize complaints response (array or wrapped object)
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

  // Filter complaints based on status
  const visibleComplaints = complaintsArray.filter(c =>
    !statusFilter || (c.status?.name || '').toLowerCase() === statusFilter.toLowerCase()
  );

  // Summary counts
  const totalOpen = complaintsArray.filter(c => (c.status?.name || '').toLowerCase() === 'open').length;
  const totalInProgress = complaintsArray.filter(c => (c.status?.name || '').toLowerCase() === 'in progress').length;
  const totalResolved = complaintsArray.filter(c => (c.status?.name || '').toLowerCase() === 'resolved').length;

  // Submit new complaint
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
      alert(result.message || 'Complaint submitted successfully!');
      setShowForm(false);
      setFormData({ category: '', title: '', description: '', attachment: null });
      refetchComplaints();
      setStatusFilter('');
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      alert(error?.data?.error || 'Failed to submit complaint');
    }
  };

  // UPDATED: Handle edit submission with urgency and status
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const updateData = new FormData();
    updateData.append('category', editForm.category);
    updateData.append('title', editForm.title);
    updateData.append('description', editForm.description);
    if (editForm.attachment) {
      updateData.append('attachment', editForm.attachment);
    }
    updateData.append('urgency', editForm.urgency); // NEW: Include urgency
    updateData.append('status', editForm.status); // NEW: Include status

    try {
      const result = await updateComplaint({ id: selectedComplaint.id, data: updateData }).unwrap();
      alert(result.message || 'Complaint updated successfully!');
      setShowEditModal(false);
      setSelectedComplaint(null);
      refetchComplaints();
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      alert(error?.data?.error || 'Failed to update complaint');
    }
  };

  // Open edit modal
  const openEditModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setEditForm({
      category: complaint.category?.id || '',
      title: complaint.title || '',
      description: complaint.description || '',
      attachment: null,
      urgency: complaint.urgency || '', // NEW: Populate urgency
      status: complaint.status?.id || '' // NEW: Populate status ID
    });
    setShowEditModal(true);
  };

  // Get category icon (this function was referenced but not defined)
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
    <div className="min-h-screen relative overflow-hidden">
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
        <div className="space-y-8 pb-24 w-full" style={{ marginTop: '80px' }}>
          {/* Enhanced Header */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute -top-14 -left-14 w-72 h-72 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-16 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-indigo-500/10 to-purple-600/10 rounded-full blur-3xl" />
            <div className="relative flex flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
                    Complaints & Issues
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Report apartment issues and track resolution progress
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium text-indigo-700"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow hover:shadow-lg transition flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Log Complaint
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                  <p className="text-2xl font-bold text-gray-900">{complaintsArray.length}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Issues</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalOpen}
                  </p>
                </div>
                <Circle className="w-8 h-8 text-blue-500 fill-blue-200/40" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {totalInProgress}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalResolved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Statuses</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {statusesLoading ? '…' : statuses.length}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-end gap-4">
            <div className="flex flex-col flex-2">
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
            <div className="text-xs text-gray-500 flex items-center justify-center self-center" style={{ paddingTop: '10px'}}>
              {statusesLoading
                ? 'Loading statuses...'
                : statusFilter
                  ? `${visibleComplaints.length} shown`
                  : `${complaintsArray.length} total`}
            </div>
          </div>

          {/* Complaint Form Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={()=> !submitting && setShowForm(false)}
              />
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/30 p-8">
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

          {/* Complaint Edit Modal */}
          {showEditModal && selectedComplaint && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={()=> !updating && setShowEditModal(false)}
              />
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/30 p-8">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Edit className="w-5 h-5 text-rose-600" />
                    Edit Complaint
                  </h2>
                  <button
                    onClick={()=> !updating && setShowEditModal(false)}
                    className="p-2 rounded-lg hover:bg-white/60 transition"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Category *</label>
                    <select
                      value={editForm.category}
                      onChange={e=>setEditForm(f=>({...f, category:e.target.value}))}
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
                      value={editForm.title}
                      onChange={e=>setEditForm(f=>({...f, title:e.target.value}))}
                      required
                      placeholder="Short summary"
                      className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Description *</label>
                    <textarea
                      value={editForm.description}
                      onChange={e=>setEditForm(f=>({...f, description:e.target.value}))}
                      required
                      rows={4}
                      placeholder="Provide details..."
                      className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Urgency</label>
                    <select
                      value={editForm.urgency}
                      onChange={e=>setEditForm(f=>({...f, urgency:e.target.value}))}
                      className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">Select Urgency</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Status</label>
                    <select
                      value={editForm.status}
                      onChange={e=>setEditForm(f=>({...f, status:e.target.value}))}
                      className="w-full px-3 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">Select Status</option>
                      {statuses.map((s: any)=> (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Attachment (optional)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e=>setEditForm(f=>({...f, attachment:e.target.files?.[0]||null}))}
                      className="w-full text-xs"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Upload a new photo or document.</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={()=>setShowEditModal(false)}
                      className="px-4 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm hover:bg-white/90 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-medium shadow hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {updating ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Complaints List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Inbox className="w-6 h-6 text-rose-600" />
                My Complaints
              </h3>
              <span className="text-xs text-gray-500">
                {complaintsLoading ? 'Loading...' : `${complaintsArray.length} total`}
              </span>
            </div>
            <div className="p-6">
              {complaintsLoading ? (
                <div className="text-center py-12 flex flex-col items-center gap-3 text-gray-600">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-lg">Loading complaints...</p>
                </div>
              ) : visibleComplaints.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-4 text-gray-500">
                  <FileText className="w-16 h-16 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium mb-1">
                      {statusFilter ? 'No complaints in this status' : 'No complaints found'}
                    </h3>
                    <p className="text-sm mb-4">
                      {statusFilter ? 'Try another status or clear filter.' : 'Log your first issue to begin tracking.'}
                    </p>
                    {!statusFilter && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow"
                      >
                        Log Complaint
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left font-medium text-gray-600 py-3">Title</th>
                        <th className="text-left font-medium text-gray-600 py-3">Category</th>
                        <th className="text-left font-medium text-gray-600 py-3">Status</th>
                        <th className="text-left font-medium text-gray-600 py-3">Created</th>
                        <th className="text-left font-medium text-gray-600 py-3">Urgency</th>
                        <th className="text-left font-medium text-gray-600 py-3">Attachment</th>
                        <th className="text-left font-medium text-gray-600 py-3">Actions</th> {/* NEW: Added Actions column */}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleComplaints.map((complaint: any) => (
                        <tr key={complaint.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 font-semibold text-gray-900">
                            {complaint.title}
                          </td>
                          <td className="py-4 text-gray-600">
                            {complaint.category?.name || 'N/A'}
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(complaint.status?.name)}`}>
                              {complaint.status?.name || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-4 text-gray-600">
                            {safeDate(complaint.created_at)}
                          </td>
                          <td className="py-4">
                            {complaint.urgency && (
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${urgencyStyle(complaint.urgency)}`}>
                                {complaint.urgency.toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            {complaint.attachment ? (
                              <a
                                href={complaint.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                <FileText className="w-4 h-4" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="py-4"> {/* NEW: Actions column */}
                            {/* REMOVED: isEditable check to allow editing all complaints */}
                            <button
                              onClick={() => openEditModal(complaint)}
                              className="px-3 py-1 rounded-lg bg-blue-600/10 text-blue-600 text-xs font-medium hover:bg-blue-600/20 flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Category Guide */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              Issue Categories Guide
            </h3>
            <div className="grid grid-cols-3 gap-4">
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
              className="fixed bottom-5 right-5 p-4 rounded-full shadow-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-center"
              aria-label="Log Complaint"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}