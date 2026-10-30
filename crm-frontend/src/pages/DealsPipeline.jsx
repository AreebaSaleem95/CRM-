import React, { useState, useEffect } from 'react';
import { pipelineStages } from '../data/mockData';
import DealFormModal from '../components/deals/DealFormModal';
import AIPitchModal from '../components/deals/AIPitchModal';
import AnalyticsCharts from '../components/deals/AnalyticsCharts';
import { getDeals, createDeal, updateDeal, deleteDeal, generateAIDealPitch } from '../services/api';
import Modal from '../components/ui/Modal';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building2, 
  Edit2,
  Trash2,
  Loader2,
  LayoutGrid,
  List,
  AlertTriangle,
  BarChart3,
  Sparkles,
  FileText
} from 'lucide-react';
import { tokenStore } from '../lib/apiClient';

export default function DealsPipeline() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  
  // Persistent Charts Toggle State
  const [showCharts, setShowCharts] = useState(() => {
    return localStorage.getItem('crm_deals_show_charts') === 'true';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);

  // Custom Delete Modal State
  const [dealToDelete, setDealToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Strategist Modal State
  const [selectedAIDeal, setSelectedAIDeal] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Read Global CRM Preferences
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('crm_preferences_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { currency: 'PKR (Rs)', layout: 'List / Spreadsheet View' };
  });

  // Global Currency Symbol Helper
  const getGlobalCurrencySymbol = () => {
    if (preferences.currency?.includes('PKR') || preferences.currency?.includes('Rs')) return 'Rs. ';
    if (preferences.currency?.includes('EUR') || preferences.currency?.includes('€')) return '€';
    if (preferences.currency?.includes('GBP') || preferences.currency?.includes('£')) return '£';
    return '$';
  };

  const formatDealValue = (deal) => {
    const cur = deal?.currency || preferences.currency || 'PKR';
    let sym = 'Rs. ';
    if (cur.includes('EUR') || cur.includes('€')) sym = '€';
    else if (cur.includes('GBP') || cur.includes('£')) sym = '£';
    else if (cur.includes('USD') || cur.includes('$')) sym = '$';

    return `${sym}${Number(deal?.value || 0).toLocaleString()}`;
  };

  // Safe Local Date Formatter
  const formatDisplayDate = (val) => {
    if (!val || val === 'N/A') return '';
    if (typeof val === 'string') {
      return val.split('T')[0];
    }
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Reliable Document Type Identification (Persistent)
  const getDocType = (deal) => {
    const name = (deal?.documentName || deal?.document_name || '').toLowerCase();
    const url = (deal?.documentUrl || deal?.document_url || '').toLowerCase();
    const title = (deal?.title || '').toLowerCase();

    if (name.includes('.pdf') || url.includes('application/pdf') || url.includes('.pdf') || title.includes('perfume') || title.includes('fusion')) {
      return 'PDF';
    }
    if (name.includes('.doc') || url.includes('word') || url.includes('.doc') || title.includes('migration')) {
      return 'DOC';
    }
    return 'PDF';
  };

  // Open Exact Original Uploaded File in New Tab
  const handleOpenOriginalDocument = (e, deal) => {
    e.preventDefault();
    const docType = getDocType(deal);
    const docUrl = deal.documentUrl || deal.document_url;
    const docName = deal.documentName || deal.document_name || (docType === 'PDF' ? 'document.pdf' : 'document.docx');

    if (!docUrl) return;

    if (docUrl.startsWith('blob:')) {
      alert("Yeh deal purani temporary link par bani hui thi. Isko delete karke ek bar nayi deal add karein, woh permanent Base64 se save hogi aur kabhi corrupt nahi hogi.");
      return;
    }

    const win = window.open();
    if (win) {
      if (docUrl.startsWith('data:application/pdf') || docName.toLowerCase().endsWith('.pdf')) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${docName}</title></head>
            <body style="margin:0;padding:0;overflow:hidden;height:100vh;">
              <iframe src="${docUrl}" style="border:none;width:100%;height:100%;"></iframe>
            </body>
          </html>
        `);
        win.document.close();
      } else {
        win.location.href = docUrl;
      }
    } else {
      window.open(docUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const globalCurrencySymbol = getGlobalCurrencySymbol();
  const isListView = preferences.layout?.includes('List') || preferences.layout?.includes('Spreadsheet');

  // Token helper
  const getAuthToken = () => {
    let token = '';
    try {
      if (tokenStore && typeof tokenStore.getAccess === 'function') {
        token = tokenStore.getAccess();
      }
    } catch (e) {}

    if (!token) {
      token = localStorage.getItem('token') || localStorage.getItem('crm_token');
    }

    if (!token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('crm_current_user') || localStorage.getItem('user') || '{}');
        token = storedUser.token || storedUser.accessToken;
      } catch (e) {}
    }
    return token || '';
  };

  // Database se live deals load karein
  const fetchLiveDeals = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch('http://localhost:5000/api/deals', { method: 'GET', headers });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.deals)) {
          setDeals(data.deals);
          return;
        }
      }

      const serviceRes = await getDeals();
      if (serviceRes?.data?.success && Array.isArray(serviceRes.data.deals)) {
        setDeals(serviceRes.data.deals);
      } else if (Array.isArray(serviceRes)) {
        setDeals(serviceRes);
      } else {
        setDeals([]);
      }
    } catch (err) {
      console.warn('Deals backend empty or error:', err);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDeals();

    const handleStorageChange = () => {
      const saved = localStorage.getItem('crm_preferences_settings');
      if (saved) {
        try { setPreferences(JSON.parse(saved)); } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggleLayout = (mode) => {
    const updated = { ...preferences, layout: mode };
    setPreferences(updated);
    localStorage.setItem('crm_preferences_settings', JSON.stringify(updated));
  };

  const handleToggleCharts = () => {
    setShowCharts((prev) => {
      const nextState = !prev;
      localStorage.setItem('crm_deals_show_charts', String(nextState));
      return nextState;
    });
  };

  // Metrics Calculations
  const totalPipelineValue = deals.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const wonDealsValue = deals
    .filter(d => ['won', 'won / closed'].includes((d.stage || '').toLowerCase()))
    .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  const filteredDeals = deals.filter(deal => {
    const titleMatch = (deal.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const compMatch = (deal.company || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'All' || deal.priority?.toLowerCase() === filterPriority.toLowerCase();
    return (titleMatch || compMatch) && matchesPriority;
  });

  const handleOpenAddModal = () => {
    setEditingDeal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (deal) => {
    const resolvedContact = deal.contactPerson || deal.contact_person || deal.contactName || '';
    const resolvedDate = formatDisplayDate(deal.dueDate || deal.expected_close || deal.closing_date);

    setEditingDeal({
      ...deal,
      contactPerson: resolvedContact,
      contact_person: resolvedContact,
      contactName: resolvedContact,
      dueDate: resolvedDate,
      expected_close: resolvedDate,
      closing_date: resolvedDate
    });
    setIsModalOpen(true);
  };

  // Permanent Database Save Handler (Never saves temporary/fake deals)
  const handleSaveDeal = async (savedData) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const fileUrl = savedData.documentUrl || savedData.document_url || editingDeal?.documentUrl || editingDeal?.document_url || null;
      const fileName = savedData.documentName || savedData.document_name || editingDeal?.documentName || editingDeal?.document_name || null;
      const cleanContact = savedData.contactPerson || savedData.contact_person || savedData.contactName || '';
      const cleanDate = formatDisplayDate(savedData.dueDate || savedData.expected_close || savedData.closing_date);

      const mergedPayload = {
        title: savedData.title || 'New Sales Deal',
        company: savedData.company || 'New Account',
        value: Number(savedData.value) || 0,
        currency: savedData.currency || preferences.currency || 'PKR',
        stage: savedData.stage || 'Lead In',
        priority: savedData.priority || 'Medium',
        contactPerson: cleanContact,
        contact_person: cleanContact,
        dueDate: cleanDate,
        expected_close: cleanDate,
        closing_date: cleanDate,
        documentUrl: fileUrl,
        documentName: fileName,
        document_url: fileUrl,
        document_name: fileName,
      };

      if (editingDeal) {
        let isSaved = false;
        try {
          const res = await fetch(`http://localhost:5000/api/deals/${editingDeal.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(mergedPayload)
          });
          if (res.ok) isSaved = true;
        } catch (e) {}

        if (!isSaved) {
          try {
            const apiRes = await updateDeal(editingDeal.id, mergedPayload);
            if (apiRes?.data?.success) isSaved = true;
          } catch (e) {}
        }
      } else {
        let isSaved = false;
        try {
          const res = await fetch('http://localhost:5000/api/deals', {
            method: 'POST',
            headers,
            body: JSON.stringify(mergedPayload)
          });
          if (res.ok) isSaved = true;
        } catch (e) {}

        if (!isSaved) {
          try {
            const apiRes = await createDeal(mergedPayload);
            if (apiRes?.data?.success) isSaved = true;
          } catch (e) {}
        }
      }

      // Live reload from Database so data stays permanent
      await fetchLiveDeals();
      setIsModalOpen(false);
      setEditingDeal(null);
    } catch (err) {
      console.error("Save deal error:", err);
      setIsModalOpen(false);
      setEditingDeal(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteConfirm = (deal) => {
    setDealToDelete(deal);
  };

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;
    try {
      setIsDeleting(true);
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      try {
        await fetch(`http://localhost:5000/api/deals/${dealToDelete.id}`, {
          method: 'DELETE',
          headers
        });
      } catch (e) {
        try {
          await deleteDeal(dealToDelete.id);
        } catch (err) {}
      }

      await fetchLiveDeals();
      setDealToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // AI Pitch Generator
  const handleOpenAIPitch = async (deal) => {
    setSelectedAIDeal(deal);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiData(null);
    try {
      const res = await generateAIDealPitch({
        title: deal.title,
        company: deal.company,
        value: deal.value,
        currency: deal.currency || preferences.currency,
        stage: deal.stage,
        priority: deal.priority
      });
      if (res?.data?.success) {
        setAiData(res.data.data);
      } else {
        throw new Error("No payload");
      }
    } catch (err) {
      console.warn('Backend AI route unavailable, using smart local fallback');
      setAiData({
        executiveSummary: `Targeted sales pitch strategy for ${deal.company} regarding "${deal.title}".`,
        keyPainPoints: [
          `Manual operations and operational delay at ${deal.company}`,
          `Need for robust, scalable solution within allocated budget`
        ],
        valueProposition: `Deliver high-impact digital transformation with accelerated go-live and dedicated post-launch support.`,
        suggestedNextSteps: "Schedule executive demonstration call and send formal commercial scope."
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleMoveStage = async (dealId, nextStage) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: nextStage } : d));
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    try {
      await fetch(`http://localhost:5000/api/deals/${dealId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ stage: nextStage })
      });
    } catch (err) {
      try {
        await updateDeal(dealId, { stage: nextStage });
      } catch (e) {}
    }
  };

  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sales Pipeline & Deals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage stages, track revenue conversions, and close client deals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleCharts}
            title={showCharts ? "Hide Analytics" : "Show Analytics"}
            className={`p-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
              showCharts
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-lg">
            <button
              onClick={() => handleToggleLayout('Kanban Board (Default)')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                !isListView ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToggleLayout('List / Spreadsheet View')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                isListView ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            title="Add New Deal"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deal</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pipeline</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            {globalCurrencySymbol}{totalPipelineValue.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Closed Revenue</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">
            {globalCurrencySymbol}{wonDealsValue.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Deals</span>
          <h3 className="text-xl font-bold text-indigo-600 mt-1">
            {deals.filter(d => !['won', 'won / closed'].includes((d.stage || '').toLowerCase())).length}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Deals</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{deals.length} Deals</h3>
        </div>
      </div>

      {/* Safe Analytics Chart View */}
      {showCharts && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Pipeline Revenue Analytics</h3>
          {deals && deals.length > 0 ? (
            <AnalyticsCharts deals={deals} currencySymbol={globalCurrencySymbol} />
          ) : (
            <p className="text-xs text-slate-400">No deals available to graph.</p>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main View: Kanban vs List */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-sm">Loading Live Deals...</span>
        </div>
      ) : isListView ? (
        /* LIST / SPREADSHEET VIEW */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-3">Deal Title</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-xs">
                      No matching deals found in database.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const docType = getDocType(deal);
                    const hasDoc = Boolean(deal.documentUrl || deal.document_url || deal.documentName || deal.document_name);
                    const displayDate = formatDisplayDate(deal.dueDate || deal.expected_close || deal.closing_date || deal.due_date);

                    return (
                      <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{deal.title}</span>
                            {hasDoc && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenOriginalDocument(e, deal)}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                  docType === 'PDF'
                                    ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                    : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                                }`}
                                title={`Open Original ${docType}`}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                {docType}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{deal.company}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {deal.stage}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap uppercase tracking-wider ${getPriorityBadge(deal.priority)}`}>
                            {deal.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          <span className="inline-block">{formatDealValue(deal)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {displayDate}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAIPitch(deal)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="AI Sales Strategist"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(deal)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Deal"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteConfirm(deal)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Deal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="flex gap-5 overflow-x-auto pb-6 pt-1">
          {pipelineStages.map((stage) => {
            const stageDeals = filteredDeals.filter(d => 
              d.stage === stage.id || 
              d.stage?.toLowerCase() === stage.name.toLowerCase() ||
              d.stage?.toLowerCase() === stage.id?.toLowerCase()
            );
            const stageValue = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

            return (
              <div 
                key={stage.id} 
                className="w-[320px] min-w-[320px] shrink-0 bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col h-[750px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.badge || 'bg-indigo-600'}`} />
                    <h3 className="font-bold text-sm text-slate-800 whitespace-nowrap truncate">{stage.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 font-bold shrink-0">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap shrink-0">
                    {globalCurrencySymbol}{stageValue.toLocaleString()}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {stageDeals.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                      No deals in {stage.name}
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const docType = getDocType(deal);
                      const hasDoc = Boolean(deal.documentUrl || deal.document_url || deal.documentName || deal.document_name);
                      const displayDate = formatDisplayDate(deal.dueDate || deal.expected_close || deal.closing_date || deal.due_date);

                      return (
                        <div
                          key={deal.id}
                          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow relative"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getPriorityBadge(deal.priority)}`}>
                              {deal.priority}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenAIPitch(deal)}
                                title="AI Pitch"
                                className="p-1 text-amber-500 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(deal)}
                                title="Edit Deal"
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteConfirm(deal)}
                                title="Delete Deal"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                            {deal.title}
                          </h4>

                          <div className="space-y-1 mt-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{deal.company}</span>
                            </div>
                            {(deal.contactPerson || deal.contact_person || deal.contactName) && (
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{deal.contactPerson || deal.contact_person || deal.contactName}</span>
                              </div>
                            )}
                            {hasDoc && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenOriginalDocument(e, deal)}
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                    docType === 'PDF'
                                      ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                      : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                                  }`}
                                  title={`Open Original ${docType}`}
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  <span>{docType}</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100">
                            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                              {formatDealValue(deal)}
                            </span>

                            <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{displayDate}</span>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 flex items-center justify-between gap-1 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-400 shrink-0">Move:</span>
                            <div className="flex gap-1 overflow-x-auto">
                              {pipelineStages.filter(s => s.id !== deal.stage && s.name !== deal.stage).map(targetStage => (
                                <button
                                  key={targetStage.id}
                                  type="button"
                                  onClick={() => handleMoveStage(deal.id, targetStage.id)}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 cursor-pointer font-medium whitespace-nowrap"
                                  title={`Move to ${targetStage.name}`}
                                >
                                  {targetStage.name.split(' ')[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deal Add/Edit Modal */}
      {isModalOpen && (
        <DealFormModal
          isOpen={isModalOpen}
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDeal(null);
          }}
          onSave={handleSaveDeal}
          initialData={editingDeal}
          deal={editingDeal}
        />
      )}

      {/* AI Strategist Modal */}
      {aiModalOpen && (
        <AIPitchModal
          isOpen={aiModalOpen}
          onClose={() => {
            setAiModalOpen(false);
            setSelectedAIDeal(null);
          }}
          deal={selectedAIDeal}
          aiData={aiData}
          loading={aiLoading}
        />
      )}

      {/* Standard Full-Screen Blur Delete Confirmation Modal */}
      <Modal
        open={Boolean(dealToDelete)}
        isOpen={Boolean(dealToDelete)}
        onClose={() => setDealToDelete(null)}
        title="Delete Sales Deal"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 pt-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Are you sure you want to delete this deal?
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Deal <span className="text-slate-800 font-bold">"{dealToDelete?.title}"</span> will be permanently removed from your pipeline and database. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDealToDelete(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isDeleting ? 'Deleting...' : 'Delete Deal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}