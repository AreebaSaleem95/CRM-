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
  Loader2
} from 'lucide-react';

export default function DealsPipeline() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);

  // Database se deals load karein
  const fetchLiveDeals = async () => {
    try {
      setLoading(true);
      const res = await getDeals();
      if (res.data.success) {
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
  }, []);

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
        if (res.data.success) {
          setDeals(prev => prev.map(d => d.id === editingDeal.id ? res.data.deal : d));
        }
      } else {
        const res = await createDeal(savedData);
        if (res.data.success) {
          setDeals(prev => [res.data.deal, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Database mein save nahi ho saka');
    }
  };

  // Deal Delete (Database Sync)
  const handleDeleteDeal = async (id) => {
    if (window.confirm("Are you sure you want to delete this deal from database?")) {
      try {
        await deleteDeal(id);
        setDeals(prev => prev.filter(d => d.id !== id));
      } catch (err) {
        alert('Deal delete nahi ho saki');
      }
    }
  };

  // Move Stage (Database Sync)
  const handleMoveStage = async (dealId, nextStage) => {
    try {
      // Instant UI update
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: nextStage } : d));
      // Database update
      await updateDeal(dealId, { stage: nextStage });
    } catch (err) {
      console.error('Stage update failed:', err);
      fetchLiveDeals(); // Revert back if failed
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

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/25 transition-all text-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Deal</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Pipeline</p>
            <h3 className="text-xl font-bold text-white mt-0.5">${totalPipelineValue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Closed Revenue</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5">${wonDealsValue.toLocaleString()}</h3>
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

      {/* Kanban Stages Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-sm">Loading Live Deals from Database...</span>
        </div>
      ) : (
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
                    ${stageValue.toLocaleString()}
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
                              onClick={() => handleDeleteDeal(deal.id)}
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
                            ${Number(deal.value).toLocaleString()}
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

      <DealFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDeal}
        initialData={editingDeal}
      />
    </div>
  );
}