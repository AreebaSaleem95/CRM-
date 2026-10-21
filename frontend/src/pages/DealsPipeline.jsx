import React, { useState, useEffect } from 'react';
import { pipelineStages } from '../data/mockData';
import DealFormModal from '../components/DealFormModal';
import { getDeals, createDeal, updateDeal, deleteDeal } from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  User, 
  Building2, 
  TrendingUp, 
  Edit2,
  Trash2,
  Loader2,
  LayoutGrid,
  List,
  AlertTriangle
} from 'lucide-react';

export default function DealsPipeline() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);

  // Custom Delete Modal State
  const [dealToDelete, setDealToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Read Global CRM Preferences (Currency & Layout Mode)
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('crm_preferences_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { currency: 'USD ($)', layout: 'Kanban Board (Default)' };
  });

  // Default Global Currency Symbol Helper
  const getGlobalCurrencySymbol = () => {
    if (preferences.currency?.includes('PKR') || preferences.currency?.includes('Rs')) return 'Rs. ';
    if (preferences.currency?.includes('EUR') || preferences.currency?.includes('€')) return '€';
    if (preferences.currency?.includes('GBP') || preferences.currency?.includes('£')) return '£';
    return '$';
  };

  // Specific Deal Currency Symbol Helper
  const formatDealValue = (deal) => {
    const cur = deal.currency || preferences.currency || 'USD';
    let sym = '$';
    if (cur.includes('PKR') || cur.includes('Rs')) sym = 'Rs. ';
    else if (cur.includes('EUR') || cur.includes('€')) sym = '€';
    else if (cur.includes('GBP') || cur.includes('£')) sym = '£';

    return `${sym}${Number(deal.value || 0).toLocaleString()}`;
  };

  const globalCurrencySymbol = getGlobalCurrencySymbol();
  const isListView = preferences.layout?.includes('List') || preferences.layout?.includes('Spreadsheet');

  // Database se deals load karein
  const fetchLiveDeals = async () => {
    try {
      setLoading(true);
      const res = await getDeals();
      if (res.data?.success) {
        setDeals(res.data.deals);
      }
    } catch (err) {
      console.error('Error fetching deals from DB:', err);
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

  // Metrics Calculations (Live from DB)
  const totalPipelineValue = deals.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const wonDealsValue = deals
    .filter(d => d.stage === 'Won' || d.stage === 'won' || d.stage === 'Won / Closed')
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
    setEditingDeal(deal);
    setIsModalOpen(true);
  };

  // Nayi Deal Add ya Purani Update (Database Sync)
  const handleSaveDeal = async (savedData) => {
    try {
      if (editingDeal) {
        const res = await updateDeal(editingDeal.id, savedData);
        if (res.data?.success) {
          setDeals(prev => prev.map(d => d.id === editingDeal.id ? res.data.deal : d));
        }
      } else {
        const res = await createDeal(savedData);
        if (res.data?.success) {
          setDeals(prev => [res.data.deal, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Database mein save nahi ho saka');
    }
  };

  // Custom Delete Trigger
  const handleOpenDeleteConfirm = (deal) => {
    setDealToDelete(deal);
  };

  // Confirm Deal Delete (Custom Modal Action)
  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;
    try {
      setIsDeleting(true);
      await deleteDeal(dealToDelete.id);
      setDeals(prev => prev.filter(d => d.id !== dealToDelete.id));
      setDealToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Deal delete nahi ho saki');
    } finally {
      setIsDeleting(false);
    }
  };

  // Move Stage (Database Sync)
  const handleMoveStage = async (dealId, nextStage) => {
    try {
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: nextStage } : d));
      await updateDeal(dealId, { stage: nextStage });
    } catch (err) {
      console.error('Stage update failed:', err);
      fetchLiveDeals();
    }
  };

  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Sales Pipeline & Deals
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage stages, track revenue conversions, and close client deals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Layout Mode Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => handleToggleLayout('Kanban Board (Default)')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isListView ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => handleToggleLayout('List / Spreadsheet View')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isListView ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List / Spreadsheet View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Spreadsheet</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/25 transition-all text-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Deal</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards with Dynamic Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-lg min-w-[48px] h-12 flex items-center justify-center">
            {globalCurrencySymbol.trim() || '$'}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Pipeline</p>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {globalCurrencySymbol}{totalPipelineValue.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-lg min-w-[48px] h-12 flex items-center justify-center">
            {globalCurrencySymbol.trim() || '$'}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Closed Revenue</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5">
              {globalCurrencySymbol}{wonDealsValue.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Deals</p>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {deals.filter(d => d.stage !== 'Won' && d.stage !== 'won' && d.stage !== 'Won / Closed').length}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Deals</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{deals.length} Deals</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search deals by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main View: Kanban vs List/Spreadsheet */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-sm">Loading Live Deals from Database...</span>
        </div>
      ) : isListView ? (
        /* SPREADSHEET / LIST VIEW MODE */
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Deal Title</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Stage</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Value</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-xs">
                      No matching deals found.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                        <span>{deal.title}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{deal.company}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getPriorityBadge(deal.priority)}`}>
                          {deal.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-400">
                        {formatDealValue(deal)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{deal.dueDate || 'N/A'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(deal)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Deal"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteConfirm(deal)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete Deal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 overflow-x-auto pb-4">
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
                className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col min-w-[280px] h-[750px]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.badge}`} />
                    <h3 className="font-bold text-sm text-white">{stage.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {globalCurrencySymbol}{stageValue.toLocaleString()}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {stageDeals.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      No deals in {stage.name}
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="group bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all duration-150 shadow-sm hover:shadow-md relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getPriorityBadge(deal.priority)}`}>
                            {deal.priority}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditModal(deal)}
                              title="Edit Deal"
                              className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteConfirm(deal)}
                              title="Delete Deal"
                              className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-white line-clamp-2">
                          {deal.title}
                        </h4>

                        <div className="space-y-1 mt-2.5 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{deal.company}</span>
                          </div>
                          {deal.contactName && (
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{deal.contactName}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                          <span className="text-sm font-bold text-emerald-400">
                            {formatDealValue(deal)}
                          </span>

                          {deal.dueDate && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{deal.dueDate}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 flex items-center justify-between gap-1 border-t border-slate-900 text-[11px]">
                          <span className="text-slate-500">Move to:</span>
                          <div className="flex gap-1">
                            {pipelineStages.filter(s => s.id !== deal.stage && s.name !== deal.stage).map(targetStage => (
                              <button
                                key={targetStage.id}
                                onClick={() => handleMoveStage(deal.id, targetStage.id)}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 cursor-pointer"
                                title={`Move to ${targetStage.name}`}
                              >
                                {targetStage.name.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deal Add/Edit Modal */}
      <DealFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDeal}
        initialData={editingDeal}
      />

      {/* Custom Dark Confirmation Modal for Deal Deletion */}
      {dealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Sales Deal</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="text-slate-200 font-semibold">"{dealToDelete.title}"</span>? This action cannot be undone and will permanently remove it from PostgreSQL database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDealToDelete(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}