import React from 'react';
import Modal from '../ui/Modal';
import { Sparkles, TrendingUp, CheckCircle2, Copy, Check, Loader2 } from 'lucide-react';

export default function AIPitchModal({ isOpen, open, onClose, deal, aiData, loading }) {
  const [copied, setCopied] = React.useState(false);
  const isVisible = Boolean(isOpen || open);

  if (!isVisible) return null;

  // Flexible Data Extractors (Handles both Backend API format & Local Fallback)
  const pitchText = 
    aiData?.pitch || 
    aiData?.valueProposition || 
    aiData?.pitchAngle || 
    (deal ? `Tailored strategy: Accelerate rollout for ${deal.title} by demonstrating enterprise scalability and clear ROI metrics for ${deal.company}.` : '');

  const pointsList = 
    aiData?.keyPoints || 
    aiData?.keyPainPoints || 
    aiData?.painPoints || 
    [
      `Focus on operational automation for ${deal?.company || 'client'}`,
      `Propose structured milestones to fit allocated budget`,
      `Highlight post-implementation support & reliability`
    ];

  const winProbability = aiData?.probability || 78;

  const handleCopy = () => {
    if (pitchText) {
      navigator.clipboard.writeText(pitchText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      open={isVisible}
      isOpen={isVisible}
      onClose={onClose}
      title="AI Sales Strategist & Win Insights"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Analyzing deal metrics and generating tailored pitch...</p>
        </div>
      ) : aiData || deal ? (
        <div className="space-y-5">
          {/* Probability & Overview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estimated Win Probability
              </span>
              <h4 className="text-2xl font-bold text-slate-900 mt-0.5">
                {winProbability}%
              </h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Key Strategic Points */}
          {pointsList && pointsList.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Closing Tactics
              </h5>
              <div className="space-y-1.5">
                {pointsList.map((point, index) => (
                  <div key={index} className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    • {point}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Pitch / Email */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Tailored Sales Pitch & Follow-up Draft
              </h5>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer border border-indigo-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Pitch'}</span>
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-normal">
              {pitchText}
            </div>
          </div>

          {/* Close Action */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          Unable to generate insights. Please verify deal details.
        </div>
      )}
    </Modal>
  );
}