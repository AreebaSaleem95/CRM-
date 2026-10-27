import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dealValidationSchema } from '../validations/dealSchema';
import Modal from './Modal';
import { pipelineStages } from '../data/mockData';
import * as apiServices from '../services/api';
import { AlertCircle, UploadCloud, FileText, Loader2, X } from 'lucide-react';

const currencyOptions = [
  { code: 'USD', symbol: '$', label: '$ USD' },
  { code: 'PKR', symbol: 'Rs.', label: 'Rs. PKR' },
  { code: 'EUR', symbol: '€', label: '€ EUR' },
  { code: 'GBP', symbol: '£', label: '£ GBP' }
];

export default function DealFormModal({ isOpen, onClose, onSave, initialData }) {
  const [salesAgents, setSalesAgents] = useState([]);

  // Cloudinary Document Storage States
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

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

  // React Hook Form Setup with Zod Resolver
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(dealValidationSchema),
    defaultValues: {
      title: '',
      company: '',
      contactName: '',
      value: 0,
      currency: 'PKR',
      stage: 'Lead In',
      priority: 'Medium',
      dueDate: '',
      assigned_to: ''
    }
  });

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

  // Form Reset / Initial Data Populate
  useEffect(() => {
    if (initialData) {
      // Normalize currency string if stored as 'Rs. PKR' or 'USD'
      let initialCur = 'PKR';
      if (initialData.currency) {
        if (initialData.currency.includes('USD') || initialData.currency.includes('$')) initialCur = 'USD';
        else if (initialData.currency.includes('EUR') || initialData.currency.includes('€')) initialCur = 'EUR';
        else if (initialData.currency.includes('GBP') || initialData.currency.includes('£')) initialCur = 'GBP';
        else initialCur = 'PKR';
      } else {
        initialCur = getDefaultCurrency();
      }

      reset({
        title: initialData.title || '',
        company: initialData.company || '',
        contactName: initialData.contactName || '',
        value: initialData.value || 0,
        currency: initialCur,
        stage: initialData.stage || 'Lead In',
        priority: initialData.priority || 'Medium',
        dueDate: initialData.dueDate || new Date().toISOString().split('T')[0],
        assigned_to: initialData.assignedTo || initialData.assigned_to || ''
      });

      setDocumentUrl(initialData.documentUrl || initialData.document_url || '');
      setDocumentName(initialData.documentName || initialData.document_name || '');
    } else {
      reset({
        title: '',
        company: '',
        contactName: '',
        value: 0,
        currency: getDefaultCurrency(),
        stage: 'Lead In',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        assigned_to: ''
      });

      setDocumentUrl('');
      setDocumentName('');
    }
  }, [initialData, isOpen, reset]);

  // Handle Cloudinary Document Upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingFile(true);
      if (typeof apiServices.uploadDealDocument === 'function') {
        const res = await apiServices.uploadDealDocument(formData);
        if (res.data?.success) {
          setDocumentUrl(res.data.file.url);
          setDocumentName(res.data.file.name);
        }
      } else {
        alert('Upload service endpoint is not registered in api.js.');
      }
    } catch (err) {
      console.error('File Upload Failed:', err);
      alert('Failed to upload document to Cloudinary storage. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setDocumentUrl('');
    setDocumentName('');
  };

  // Zod Validated Form Submission
  const onFormSubmit = (data) => {
    onSave({
      ...data,
      currency: data.currency, // Preserves the selected individual currency
      value: Number(data.value) || 0,
      assigned_to: data.assigned_to ? Number(data.assigned_to) : null,
      assignedTo: data.assigned_to ? Number(data.assigned_to) : null,
      documentUrl,
      documentName,
      document_url: documentUrl,
      document_name: documentName
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Deal Details" : "Create New Sales Deal"}
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Deal Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Deal Title *
          </label>
          <input
            type="text"
            placeholder="e.g. ERP Modernization Suite"
            {...register('title')}
            className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition-all text-sm ${
              errors.title
                ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            }`}
          />
          {errors.title && (
            <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Company & Contact Person */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Company Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Global"
              {...register('company')}
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition-all text-sm ${
                errors.company
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
            {errors.company && (
              <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.company.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Contact Person
            </label>
            <input
              type="text"
              placeholder="e.g. Bilal Ahmed"
              {...register('contactName')}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Value Input with attached Currency Selector Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Deal Value *
            </label>
            <div className={`flex items-center rounded-xl bg-slate-950 border overflow-hidden transition-all ${
              errors.value 
                ? 'border-rose-500 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500' 
                : 'border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
            }`}>
              <select
                {...register('currency')}
                className="bg-slate-900 text-emerald-400 text-xs font-bold px-2.5 py-2.5 border-r border-slate-800 focus:outline-none cursor-pointer"
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="5000"
                {...register('value')}
                className="w-full px-3 py-2.5 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              />
            </div>
            {errors.value && (
              <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.value.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Pipeline Stage
            </label>
            <select
              {...register('stage')}
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
              {...register('priority')}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Due Date & Sales Agent Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Closing Date
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
              Assign To Sales Agent
            </label>
            <select
              {...register('assigned_to')}
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

        {/* Proposal Document / Contract File Upload (Cloudinary Storage) */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Proposal / Contract Document (Cloud Storage)
          </label>
          
          {documentUrl ? (
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-medium text-slate-200 truncate">{documentName || 'Attached Document'}</p>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    View Uploaded File
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                title="Remove Document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-3.5 border border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 hover:bg-slate-900/60 rounded-xl cursor-pointer transition-all">
              <div className="flex flex-col items-center justify-center text-center">
                {uploadingFile ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading file to Cloudinary...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                    <p className="text-xs font-medium text-slate-300">
                      Click to attach PDF proposal or contract agreement
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Max size 10MB (Cloudinary Object Storage)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploadingFile}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
            </label>
          )}
        </div>

        {/* Action Buttons */}
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