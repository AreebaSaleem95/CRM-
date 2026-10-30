import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskValidationSchema } from '../../schemas/taskSchema';
import Modal from '../ui/Modal';
import api from '../../services/api';
import { tokenStore } from '../../lib/apiClient';
import { AlertCircle } from 'lucide-react';

export default function TaskFormModal({ isOpen, open, onClose, onSave, initialData }) {
  const isVisible = Boolean(isOpen || open);
  const [dealsList, setDealsList] = useState([]);

  // Centralized robust token getter
  const getAuthHeaders = () => {
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

    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch Deals for Dropdown (Strictly Authenticated and Role-Scoped)
  useEffect(() => {
    const fetchDealsDropdown = async () => {
      try {
        let dealsData = [];
        
        // 1. Primary: Direct fetch with Bearer token
        try {
          const res = await fetch('http://localhost:5000/api/deals', {
            headers: getAuthHeaders()
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.deals)) {
              dealsData = data.deals;
            }
          }
        } catch (e) {}

        // 2. Secondary: Axios instance if fetch fails
        if (dealsData.length === 0) {
          try {
            const res = await api.get('/deals');
            if (res?.data?.success && Array.isArray(res.data.deals)) {
              dealsData = res.data.deals;
            }
          } catch (axiosErr) {}
        }

        setDealsList(dealsData);
      } catch (err) {
        console.error('Failed to load deals for task dropdown:', err);
        setDealsList([]);
      }
    };

    if (isVisible) {
      fetchDealsDropdown();
    }
  }, [isVisible]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(taskValidationSchema),
    defaultValues: {
      title: '',
      dealId: '',
      relatedDeal: '',
      category: 'Follow-up',
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0]
    }
  });

  // Sync Form Values when modal opens or dealsList loads
  useEffect(() => {
    if (initialData && isVisible) {
      let cleanDate = '';
      if (initialData.dueDate) {
        cleanDate = String(initialData.dueDate).split('T')[0];
      }

      // Find dealId if only relatedDeal title exists
      let matchedDealId = initialData.dealId ? String(initialData.dealId) : '';
      if (!matchedDealId && initialData.relatedDeal && dealsList.length > 0) {
        const found = dealsList.find(d => d.title?.toLowerCase() === initialData.relatedDeal?.toLowerCase());
        if (found) matchedDealId = String(found.id);
      }

      reset({
        title: initialData.title || '',
        dealId: matchedDealId,
        relatedDeal: initialData.relatedDeal || '',
        category: initialData.category || 'Follow-up',
        priority: initialData.priority || 'Medium',
        dueDate: cleanDate || new Date().toISOString().split('T')[0]
      });
    } else if (!initialData && isVisible) {
      reset({
        title: '',
        dealId: '',
        relatedDeal: '',
        category: 'Follow-up',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData, isVisible, dealsList, reset]);

  const onFormSubmit = (data) => {
    const selectedDealObj = dealsList.find(d => String(d.id) === String(data.dealId));
    const submissionPayload = {
      ...data,
      dealId: data.dealId ? parseInt(data.dealId, 10) : null,
      relatedDeal: selectedDealObj ? selectedDealObj.title : (data.dealId ? '' : data.relatedDeal || '')
    };
    onSave(submissionPayload);
    onClose();
  };

  return (
    <Modal
      open={isVisible}
      isOpen={isVisible}
      onClose={onClose}
      title={initialData ? "Edit Task" : "Add New Task"}
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Task Description *
          </label>
          <input
            type="text"
            placeholder="e.g. Follow up on quotation"
            {...register('title')}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all text-sm ${
              errors.title
                ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100'
            }`}
          />
          {errors.title && (
            <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Link Deal (Live Database)
            </label>
            <select
              {...register('dealId')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all text-sm cursor-pointer"
            >
              <option value="">-- Select Deal --</option>
              {dealsList.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.title} ({d.company || 'Deal'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all text-sm cursor-pointer"
            >
              <option value="Call">Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Proposal">Proposal</option>
              <option value="Billing">Billing</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all text-sm cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all text-sm cursor-pointer"
            />
            {errors.dueDate && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.dueDate.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {initialData ? "Update Task" : "Add Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}