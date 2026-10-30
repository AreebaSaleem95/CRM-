import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dealValidationSchema } from '../../schemas/dealSchema';
import Modal from '../ui/Modal';
import { pipelineStages } from '../../data/mockData';
import { AlertCircle, UploadCloud, FileText, Loader2, X } from 'lucide-react';

const currencyOptions = [
  { code: 'PKR', symbol: 'Rs.', label: 'Rs. PKR' },
  { code: 'USD', symbol: '$', label: '$ USD' },
  { code: 'EUR', symbol: '€', label: '€ EUR' },
  { code: 'GBP', symbol: '£', label: '£ GBP' }
];

export default function DealFormModal({ isOpen, open, onClose, onSave, initialData, deal }) {
  const isVisible = Boolean(isOpen || open);
  const activeDeal = initialData || deal || null;

  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
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

  // Direct Form Pre-fill
  useEffect(() => {
    if (activeDeal && isVisible) {
      const cleanContact = activeDeal.contactPerson || activeDeal.contact_person || activeDeal.contactName || '';
      
      let cleanDate = '';
      const rawDate = activeDeal.dueDate || activeDeal.expected_close || activeDeal.closing_date || activeDeal.due_date;
      if (rawDate) {
        if (typeof rawDate === 'string') {
          const match = rawDate.match(/^\d{4}-\d{2}-\d{2}/);
          cleanDate = match ? match[0] : rawDate.split('T')[0];
        } else {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              cleanDate = d.toISOString().split('T')[0];
            }
          } catch (e) {}
        }
      }

      let cur = activeDeal.currency || 'PKR';
      if (cur.includes('USD') || cur.includes('$')) cur = 'USD';
      else if (cur.includes('EUR') || cur.includes('€')) cur = 'EUR';
      else if (cur.includes('GBP') || cur.includes('£')) cur = 'GBP';
      else cur = 'PKR';

      const formData = {
        title: activeDeal.title || '',
        company: activeDeal.company || '',
        contactName: cleanContact,
        value: Number(activeDeal.value) || 0,
        currency: cur,
        stage: activeDeal.stage || 'Lead In',
        priority: activeDeal.priority || 'Medium',
        dueDate: cleanDate,
        assigned_to: ''
      };

      reset(formData);

      // Force set har field ko taaki date aur contact person 100% render hon
      setValue('title', formData.title);
      setValue('company', formData.company);
      setValue('contactName', formData.contactName);
      setValue('value', formData.value);
      setValue('currency', formData.currency);
      setValue('stage', formData.stage);
      setValue('priority', formData.priority);
      setValue('dueDate', formData.dueDate);

      setDocumentUrl(activeDeal.documentUrl || activeDeal.document_url || '');
      setDocumentName(activeDeal.documentName || activeDeal.document_name || '');
    } else if (!activeDeal && isVisible) {
      const today = new Date().toISOString().split('T')[0];
      reset({
        title: '',
        company: '',
        contactName: '',
        value: 0,
        currency: 'PKR',
        stage: 'Lead In',
        priority: 'Medium',
        dueDate: today,
        assigned_to: ''
      });
      setDocumentUrl('');
      setDocumentName('');
    }
  }, [activeDeal, isVisible, reset, setValue]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentUrl(reader.result);
      setDocumentName(file.name);
      setUploadingFile(false);
    };
    reader.onerror = () => setUploadingFile(false);
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setDocumentUrl('');
    setDocumentName('');
  };

  const onFormSubmit = (data) => {
    const cleanDate = data.dueDate ? String(data.dueDate).split('T')[0] : '';
    const contactValue = data.contactName || '';

    const payload = {
      ...data,
      contactPerson: contactValue,
      contact_person: contactValue,
      contactName: contactValue,
      dueDate: cleanDate,
      expected_close: cleanDate,
      closing_date: cleanDate,
      due_date: cleanDate,
      currency: data.currency,
      value: Number(data.value) || 0,
      documentUrl,
      documentName,
      document_url: documentUrl,
      document_name: documentName
    };

    onSave(payload);
    onClose();
  };

  return (
    <Modal
      open={isVisible}
      isOpen={isVisible}
      onClose={onClose}
      title={activeDeal ? "Edit Deal Details" : "Create New Sales Deal"}
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Deal Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Deal Title *
          </label>
          <input
            type="text"
            placeholder="e.g. ERP Modernization Suite"
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

        {/* Company & Contact Person */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Company Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Global"
              {...register('company')}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all text-sm ${
                errors.company
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100'
              }`}
            />
            {errors.company && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.company.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Contact Person
            </label>
          <input
            type="text"
            placeholder="e.g. Bilal Ahmed"
            {...register('contactName')}
            defaultValue={activeDeal?.contactPerson || activeDeal?.contact_person || activeDeal?.contactName || ''}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all text-sm"
          />
          </div>
        </div>

        {/* Value Input with Currency Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Deal Value *
            </label>
            <div className={`flex items-center rounded-xl bg-slate-50 border overflow-hidden transition-all ${
              errors.value 
                ? 'border-rose-500 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500' 
                : 'border-slate-200 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-100 focus-within:bg-white'
            }`}>
              <select
                {...register('currency')}
                className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-2.5 border-r border-slate-200 focus:outline-none cursor-pointer"
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="5000"
                {...register('value')}
                className="w-full px-3 py-2.5 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Pipeline Stage
            </label>
            <select
              {...register('stage')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm cursor-pointer"
            >
              {pipelineStages.map((stg) => (
                <option key={stg.id} value={stg.id}>{stg.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Priority
            </label>
            <select
              {...register('priority')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Target Closing Date
          </label>
          <input
            type="date"
            {...register('dueDate')}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm cursor-pointer"
          />
        </div>

        {/* Proposal Document */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Proposal / Contract Document (Permanent Storage)
          </label>
          
          {documentUrl ? (
            <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 truncate">{documentName || 'Attached Document'}</p>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    ✓ File Encoded & Ready to Save
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                title="Remove Document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-3.5 border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100/60 rounded-xl cursor-pointer transition-all">
              <div className="flex flex-col items-center justify-center text-center">
                {uploadingFile ? (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 py-1 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing & Storing File...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                    <p className="text-xs font-medium text-slate-600">
                      Click to attach PDF proposal or contract agreement
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOC, DOCX up to 10MB</p>
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
            {activeDeal ? "Update Deal" : "Save Deal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}