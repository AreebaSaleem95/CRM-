import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { pipelineStages } from '../data/mockData';
import * as apiServices from '../services/api';

const currencyOptions = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'PKR', symbol: 'Rs.', label: 'PKR (Rs.)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' }
];

export default function DealFormModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    contactName: '',
    value: '',
    currency: 'PKR',
    stage: 'Lead In',
    priority: 'Medium',
    dueDate: '',
    assigned_to: ''
  });

  const [salesAgents, setSalesAgents] = useState([]);

  // Default currency detector from settings
  const getDefaultCurrency = () => {
    try {
      const activeUser = JSON.parse(localStorage.getItem('crm_current_user') || '{}');
      const uId = activeUser?.id;
      const key = uId ? `crm_notifications_settings_uid_${uId}` : 'crm_notifications_settings';
      const settings = JSON.parse(localStorage.getItem(key) || '{}');
      const cur = settings?.default_currency || localStorage.getItem('crm_currency') || '';

      if (cur.includes('USD') || cur.includes('$')) return 'USD';
      if (cur.includes('EUR') || cur.includes('€')) return 'EUR';
      if (cur.includes('GBP') || cur.includes('£')) return 'GBP';
      return 'PKR';
    } catch (e) {
      return 'PKR';
    }
  };

  // Fetch registered sales agents for assignment dropdown
  useEffect(() => {
    if (isOpen) {
      const loadAgents = async () => {
        try {
          if (typeof apiServices.fetchSalesAgents === 'function') {
            const res = await apiServices.fetchSalesAgents();
            if (res?.data?.success && Array.isArray(res.data.agents)) {
              setSalesAgents(res.data.agents);
            }
          }
        } catch (err) {
          console.warn('Could not load agents list:', err.message);
        }
      };
      loadAgents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        currency: initialData.currency || getDefaultCurrency(),
        assigned_to: initialData.assignedTo || initialData.assigned_to || ''
      });
    } else {
      setFormData({
        title: '',
        company: '',
        contactName: '',
        value: '',
        currency: getDefaultCurrency(),
        stage: 'Lead In',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        assigned_to: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company) return;
    
    onSave({
      ...formData,
      value: Number(formData.value) || 0,
      currency: formData.currency,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      assignedTo: formData.assigned_to ? Number(formData.assigned_to) : null
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Deal Details" : "Create New Sales Deal"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Deal Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. ERP Modernization Suite"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Global"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Contact Person
            </label>
            <input
              type="text"
              placeholder="e.g. Bilal Ahmed"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Value Input with attached Currency Selector Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Deal Value *
            </label>
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 overflow-hidden">
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="bg-slate-900 text-emerald-400 text-xs font-bold px-2.5 py-2.5 border-r border-slate-800 focus:outline-none cursor-pointer"
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="number"
                required
                placeholder="5000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2.5 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Pipeline Stage
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm cursor-pointer"
            >
              {pipelineStages.map((stg) => (
                <option key={stg.id} value={stg.id}>{stg.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Closing Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
              Assign To Sales Agent
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm cursor-pointer"
            >
              <option value="">Keep for Myself (Unassigned)</option>
              {salesAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} — ({agent.role ? agent.role.toUpperCase() : 'SALES AGENT'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            {initialData ? "Update Deal" : "Save Deal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}