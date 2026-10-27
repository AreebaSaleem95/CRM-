import React from 'react';
import Modal from './Modal';
import { Sparkles, TrendingUp, CheckCircle2, Copy, Check, Loader2 } from 'lucide-react';

export default function AIPitchModal({ isOpen, onClose, deal, aiData, loading }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (aiData?.pitch) {
      navigator.clipboard.writeText(aiData.pitch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Sales Strategist & Win Insights"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm font-medium">Analyzing deal metrics and generating tailored pitch...</p>
        </div>
      ) : aiData ? (
        <div className="space-y-5">
          {/* Probability & Overview Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Win Probability</span>
              <h4 className="text-2xl font-black text-white mt-0.5">{aiData.probability || 75}%</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Key Strategic Points */}
          {aiData.keyPoints && aiData.keyPoints.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Closing Tactics
              </h5>
              <div className="space-y-1.5">
                {aiData.keyPoints.map((point, index) => (
                  <div key={index} className="text-xs text-slate-300 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
                    • {point}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Pitch / Email */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Tailored Sales Pitch & Follow-up Draft
              </h5>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Pitch'}</span>
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-normal">
              {aiData.pitch}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          Unable to generate insights. Please verify your GEMINI_API_KEY in backend/.env.
        </div>
      )}
    </Modal>
  );
}